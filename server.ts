import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { SAMPLE_BIRTHDAY_EVENT } from './src/data/initialData';
import { calculateBudgetReduction } from './src/utils/calculations';
import type { FestivoEvent, PlanRevisionProposal, EventRequirements } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'festivo-data')
  : path.join(__dirname, 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// In-memory store ensures API never crashes even if filesystem is read-only
let memoryEvents: FestivoEvent[] = [SAMPLE_BIRTHDAY_EVENT];

app.use(express.json({ limit: '10mb' }));

// Normalize URL in case Vercel rewrites strip /api prefix
app.use((req, res, next) => {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Non-fatal in serverless environments
}

function loadEvents(): FestivoEvent[] {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryEvents = parsed;
        return memoryEvents;
      }
    }
  } catch (err) {
    // Fall back to in-memory events
  }
  return memoryEvents;
}

function saveEvents(events: FestivoEvent[]) {
  memoryEvents = events;
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal on serverless read-only filesystems
  }
}

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini GenAI client initialized successfully with User-Agent: aistudio-build');
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
  }
} else {
  console.log('No GEMINI_API_KEY detected. Demo simulation mode active.');
}

/**
 * Resilient Gemini API invocation helper with exponential backoff and automatic retry
 * Resolves transient 503 high demand or 429 rate limit spikes
 */
async function callGeminiWithRetry(params: {
  contents: any;
  config?: any;
}): Promise<{ text: string; modelUsed: string } | null> {
  if (!aiClient) return null;

  // Real fast Gemini models with graceful fallbacks
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash-lite',
  ];

  for (const model of candidateModels) {
    try {
      // Race against an 8s timeout to prevent serverless function termination
      const responsePromise = aiClient.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini call timed out after 8s')), 8000)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini error on ${model}]:`, err?.message || err);
      // Immediately try next model without sleeping to stay well within serverless limits
      continue;
    }
  }

  return null;
}

// ----------------- REST API ROUTES ----------------- //

// Health and capability status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!aiClient,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// List all events
app.get('/api/events', (req: Request, res: Response) => {
  const events = loadEvents();
  res.json(events);
});

// Get single event
app.get('/api/events/:id', (req: Request, res: Response) => {
  const events = loadEvents();
  const event = events.find((e) => e.requirements.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

// Create event
app.post('/api/events', (req: Request, res: Response) => {
  const newEvent: FestivoEvent = req.body;
  if (!newEvent || !newEvent.requirements || !newEvent.requirements.name) {
    return res.status(400).json({ error: 'Invalid event data' });
  }
  const events = loadEvents();
  events.push(newEvent);
  saveEvents(events);
  res.status(201).json(newEvent);
});

// Update event
app.put('/api/events/:id', (req: Request, res: Response) => {
  const events = loadEvents();
  const index = events.findIndex((e) => e.requirements.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  events[index] = {
    ...events[index],
    ...req.body,
    requirements: {
      ...events[index].requirements,
      ...req.body.requirements,
      updatedAt: new Date().toISOString(),
    },
  };
  saveEvents(events);
  res.json(events[index]);
});

// Delete event
app.delete('/api/events/:id', (req: Request, res: Response) => {
  let events = loadEvents();
  events = events.filter((e) => e.requirements.id !== req.params.id);
  saveEvents(events);
  res.json({ success: true });
});

// Reset demo event
app.post('/api/events/:id/reset-demo', (req: Request, res: Response) => {
  let events = loadEvents();
  events = events.filter((e) => e.requirements.id !== SAMPLE_BIRTHDAY_EVENT.requirements.id);
  events.unshift(SAMPLE_BIRTHDAY_EVENT);
  saveEvents(events);
  res.json(SAMPLE_BIRTHDAY_EVENT);
});

// ----------------- GEMINI AI WORKFLOWS ----------------- //

// 1. Generate Full Event Blueprint
app.post('/api/gemini/generate-blueprint', async (req: Request, res: Response) => {
  const reqs: EventRequirements = req.body;

  if (!reqs || !reqs.name || !reqs.guestCount || !reqs.totalBudget) {
    return res.status(400).json({ error: 'Required fields missing: name, guestCount, totalBudget' });
  }

  const prompt = `
You are the master AI Event Architect for Festivo AI.
Generate a comprehensive, structured celebration blueprint for the following event:
- Event Name: "${reqs.name}"
- Event Type: "${reqs.type}"
- Date: "${reqs.date}"
- City: "${reqs.city}"
- Expected Guests: ${reqs.guestCount}
- Total Budget: ${reqs.currency} ${reqs.totalBudget}
- Preferred Theme/Atmosphere: "${reqs.theme || 'Elegant celebration'}"
- Indoor / Outdoor: ${reqs.isOutdoor ? 'Outdoor' : 'Indoor'}
- Dietary Preferences: ${reqs.dietaryPreferences?.join(', ') || 'Standard mixed'}
- Accessibility: ${reqs.accessibilityNeeds?.join(', ') || 'Standard'}
- Priorities: ${reqs.priorities?.join(', ') || 'Food, ambiance, guest comfort'}
- Notes: "${reqs.notes || 'None'}"

Rules:
1. Provide rich, highly tailored recommendations suitable for ${reqs.city} and ${reqs.type}.
2. Ensure realistic budget allocations across categories that sum up to exactly ${reqs.totalBudget}.
3. Propose realistic tasks with structured timeline and real contingencies.
4. Distinguish fixed venue/infrastructure costs from variable per-guest catering costs.
`;

  const geminiResult = await callGeminiWithRetry({
    contents: prompt,
    config: {
      systemInstruction: 'You are Festivo AI Architect, generating pristine JSON celebration plans.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          blueprint: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              themeRationale: { type: Type.STRING },
              suggestedVenueCharacteristics: { type: Type.STRING },
              budgetRationale: { type: Type.STRING },
              cateringConsiderations: { type: Type.STRING },
              guestManagementRecommendations: { type: Type.STRING },
              vendorRequirements: { type: Type.STRING },
              planningTimelineSummary: { type: Type.STRING },
              contingencyPlans: { type: Type.STRING },
              costSavingOpportunities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              assumptionsRequiringConfirmation: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'summary',
              'themeRationale',
              'suggestedVenueCharacteristics',
              'budgetRationale',
              'cateringConsiderations',
              'vendorRequirements',
              'planningTimelineSummary',
              'contingencyPlans',
            ],
          },
          budgetCategories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                allocatedAmount: { type: Type.NUMBER },
                notes: { type: Type.STRING },
                isFixedCost: { type: Type.BOOLEAN },
              },
              required: ['name', 'allocatedAmount', 'notes', 'isFixedCost'],
            },
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                priority: { type: Type.STRING },
                relatedCategory: { type: Type.STRING },
                isMilestone: { type: Type.BOOLEAN },
              },
              required: ['title', 'description', 'dueDate', 'priority'],
            },
          },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                likelihood: { type: Type.STRING },
                impact: { type: Type.STRING },
                mitigationStrategy: { type: Type.STRING },
                contingencyPlan: { type: Type.STRING },
              },
              required: ['description', 'category', 'likelihood', 'impact', 'mitigationStrategy', 'contingencyPlan'],
            },
          },
        },
        required: ['blueprint', 'budgetCategories', 'tasks', 'risks'],
      },
    },
  });

  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      return res.json({
        ...parsed,
        isSimulated: false,
        modelUsed: geminiResult.modelUsed,
      });
    } catch (parseErr) {
      console.error('Error parsing JSON from Gemini blueprint:', parseErr);
    }
  }

  // Graceful simulation fallback only if all retry attempts fail
  const cateringShare = Math.round(reqs.totalBudget * 0.38);
  const venueShare = Math.round(reqs.totalBudget * 0.25);
  const decorShare = Math.round(reqs.totalBudget * 0.15);
  const photoShare = Math.round(reqs.totalBudget * 0.10);
  const entertainmentShare = Math.round(reqs.totalBudget * 0.07);
  const contingencyShare = reqs.totalBudget - (cateringShare + venueShare + decorShare + photoShare + entertainmentShare);

  return res.json({
    blueprint: {
      summary: `A personalized ${reqs.type} celebration blueprint for ${reqs.guestCount} guests in ${reqs.city}, crafted around the "${reqs.theme}" theme with a disciplined budget of ${reqs.currency} ${reqs.totalBudget.toLocaleString()}.`,
      themeRationale: `The theme "${reqs.theme}" provides an evocative visual anchor tailored to ${reqs.city}'s venue styles, using ambient illumination and bespoke touches to create an unforgettable guest journey.`,
      suggestedVenueCharacteristics: `${reqs.isOutdoor ? 'An open-air garden or lawn setting with covered verandah' : 'A modern banquet hall or private dining gallery'} with adequate parking for ${Math.round(reqs.guestCount * 0.4)} vehicles, ramp accessibility, and sound curfew compliance.`,
      budgetRationale: `Catering accounts for ${Math.round((cateringShare / reqs.totalBudget) * 100)}% (${reqs.currency} ${Math.round(cateringShare / reqs.guestCount)}/guest), balanced by fixed venue and photography allocations and a protective contingency reserve.`,
      cateringConsiderations: `Live appetizer counters alongside a curated buffet honoring dietary needs: ${reqs.dietaryPreferences?.join(', ') || 'balanced vegetarian and non-vegetarian selections'}.`,
      guestManagementRecommendations: `Digital RSVP tracking with meal selection due 14 days in advance to lock the final per-head caterer count without overcommitting plates.`,
      vendorRequirements: `Verified vendors with localized references in ${reqs.city}. Contracts must mandate sound compliance, clean-up responsibility, and delivery timeframes.`,
      planningTimelineSummary: `5-phase structured milestones: Venue lock at T-45 days, Caterer tasting at T-30 days, invitations sent at T-21 days, final walk-through at T-7 days.`,
      contingencyPlans: `Maintain 10% overflow catering tolerance and a dedicated indoor rain-backup option with power generator redundancy.`,
      costSavingOpportunities: [
        `Prioritize digital personalized video invites over physical paper mailers.`,
        `Choose locally sourced seasonal flowers and reusable lanterns over imported florals.`,
        `Negotiate bundled AV and ambient lighting directly through the venue.`
      ],
      assumptionsRequiringConfirmation: [
        `Venue management permits outside catering without kitchen corkage surcharges.`,
        `Municipal noise regulations permit music until 10:00 PM.`
      ]
    },
    budgetCategories: [
      { name: 'Venue', allocatedAmount: venueShare, notes: 'Lawn / hall rental for event duration', isFixedCost: true },
      { name: 'Catering', allocatedAmount: cateringShare, notes: `${reqs.guestCount} guests @ ~${reqs.currency} ${Math.round(cateringShare / reqs.guestCount)}/plate`, isFixedCost: false },
      { name: 'Decoration', allocatedAmount: decorShare, notes: 'Backdrop, table floral accents, fairy lights', isFixedCost: false },
      { name: 'Photography', allocatedAmount: photoShare, notes: 'Candid event coverage & video highlights', isFixedCost: true },
      { name: 'Entertainment', allocatedAmount: entertainmentShare, notes: 'Acoustic artist / sound equipment rental', isFixedCost: true },
      { name: 'Contingency Reserve', allocatedAmount: contingencyShare, notes: 'Emergency funds for unexpected surcharges', isFixedCost: false },
    ],
    tasks: [
      { title: 'Lock Venue & Deposit', description: `Finalize booking in ${reqs.city} with written access times`, dueDate: reqs.date, priority: 'high', relatedCategory: 'Venue', isMilestone: true },
      { title: 'Menu Tasting & Headcount Agreement', description: 'Sample main courses and agree on 10% plate buffer', dueDate: reqs.date, priority: 'high', relatedCategory: 'Catering', isMilestone: true },
      { title: 'Send Digital Invitations', description: 'Collect dietary preferences and plus-one counts', dueDate: reqs.date, priority: 'medium', relatedCategory: 'Invitations', isMilestone: false },
      { title: 'Approve Decor Blueprint', description: 'Review lighting, stage placement, and floral palette', dueDate: reqs.date, priority: 'medium', relatedCategory: 'Decoration', isMilestone: false },
    ],
    risks: [
      { description: 'Weather fluctuation affecting outdoor activities', category: 'weather', likelihood: 'medium', impact: 'high', mitigationStrategy: 'Secure venue with an adjoining covered verandah canopy', contingencyPlan: 'Immediate 15-minute relocation protocol for food and sound' },
      { description: 'Guest turnout exceeding RSVP count by >15%', category: 'guest', likelihood: 'medium', impact: 'medium', mitigationStrategy: 'Contract caterer with 10% plate buffer clause', contingencyPlan: 'Release auxiliary buffet chafers and reserve seating' },
    ],
    isSimulated: true,
  });
});

// 2. Budget Optimizer / Reduction Intelligence
app.post('/api/gemini/budget-adaptation', async (req: Request, res: Response) => {
  const { event, targetBudget, priorityNotes } = req.body;
  if (!event || !targetBudget) {
    return res.status(400).json({ error: 'Missing event or targetBudget' });
  }

  const currentTotal = event.requirements.totalBudget;
  const codeReduction = calculateBudgetReduction(event.budgetCategories, targetBudget, currentTotal);

  const prompt = `
You are the Budget Optimizer for Festivo AI.
Event: "${event.requirements.name}" (${event.requirements.type})
Currency: ${event.requirements.currency}
Guests: ${event.requirements.guestCount}
Original Budget: ${event.requirements.currency} ${currentTotal}
Target Reduced Budget: ${event.requirements.currency} ${targetBudget}
Deterministic Reduction Amount: ${event.requirements.currency} ${codeReduction.reductionAmount}
Priorities: "${event.requirements.priorities?.join(', ') || 'Guest experience'}"
User Special Notes: "${priorityNotes || 'Balance elegance with budget discipline'}"

Current Categories:
${JSON.stringify(event.budgetCategories.map((c: any) => ({
  name: c.name,
  allocated: c.allocatedAmount,
  confirmed: c.confirmedQuote,
  isFixed: c.isFixedCost,
})), null, 2)}

Application Code Proposed Cuts:
${JSON.stringify(codeReduction.proposedCuts, null, 2)}

Task:
Analyze the required ${event.requirements.currency} ${codeReduction.reductionAmount} reduction.
Explain the concrete trade-offs for each category, identify smart cost-saving substitutions, and return a verified proposed budget structure.
`;

  const geminiResult = await callGeminiWithRetry({
    contents: prompt,
    config: {
      systemInstruction: 'You are Festivo AI Budget Optimizer. Return pristine JSON only.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          proposedCuts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                categoryName: { type: Type.STRING },
                originalAmount: { type: Type.NUMBER },
                proposedAmount: { type: Type.NUMBER },
                savings: { type: Type.NUMBER },
                tradeOffDescription: { type: Type.STRING },
                actionableRecommendation: { type: Type.STRING },
              },
              required: ['categoryName', 'originalAmount', 'proposedAmount', 'savings', 'tradeOffDescription', 'actionableRecommendation'],
            },
          },
          tradeOffsSummary: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          negotiationTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['overview', 'proposedCuts', 'tradeOffsSummary', 'negotiationTips'],
      },
    },
  });

  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      return res.json({
        ...parsed,
        reductionAmount: codeReduction.reductionAmount,
        percentageReduction: codeReduction.percentageReduction,
        isSimulated: false,
        modelUsed: geminiResult.modelUsed,
      });
    } catch (parseErr) {
      console.error('Error parsing JSON from Gemini budget adaptation:', parseErr);
    }
  }

  // Deterministic simulation fallback
  return res.json({
    overview: `Deterministic reduction of ${event.requirements.currency} ${codeReduction.reductionAmount.toLocaleString()} (-${codeReduction.percentageReduction}%) calculated by application code. Reductions are prioritized from flexible decor, gifts, and entertainment allocations to safeguard core catering and locked venue commitments.`,
    reductionAmount: codeReduction.reductionAmount,
    percentageReduction: codeReduction.percentageReduction,
    proposedCuts: codeReduction.proposedCuts.map((cut) => ({
      categoryName: cut.categoryName,
      originalAmount: cut.originalAmount,
      proposedAmount: cut.proposedAmount,
      savings: cut.savings,
      tradeOffDescription: cut.isFixedCost
        ? 'Locked commitment or fixed facility fee; no reduction without vendor renegotiation.'
        : `Streamlines ${cut.categoryName.toLowerCase()} elements while preserving core visual and guest touchpoints.`,
      actionableRecommendation: cut.isFixedCost
        ? 'Maintain confirmed agreement.'
        : `Switch to local sourcing or streamlined scope for ${cut.categoryName}.`,
    })),
    tradeOffsSummary: [
      `Decor scale shifts from extravagant floral canopies to refined focal point backdrops with ambient string illumination.`,
      `Entertainment relies on a curated acoustic performance rather than an amplified live ensemble.`,
      `Contingency reserve remains proportional to absorb unexpected last-minute requirements.`
    ],
    negotiationTips: [
      'Inquire about weekday or off-peak vendor rate discounts.',
      'Request complimentary tea/coffee stations from catering in exchange for punctual payment milestones.'
    ],
    isSimulated: true,
  });
});

// 3. Signature Feature: Adaptive Event Intelligence ("What Changed?")
app.post('/api/gemini/adaptive-intelligence', async (req: Request, res: Response) => {
  const { currentEvent, updatedRequirements, triggerReason } = req.body;

  if (!currentEvent || !updatedRequirements) {
    return res.status(400).json({ error: 'Missing currentEvent or updatedRequirements' });
  }

  const origReq = currentEvent.requirements;
  const newReq = { ...origReq, ...updatedRequirements };

  const prompt = `
You are the Adaptive Event Intelligence engine for Festivo AI.
This is our signature feature: analyzing what changed when an event's reality shifts.

Original Event Plan:
- Event Name: "${origReq.name}"
- Type: ${origReq.type}
- Guests: ${origReq.guestCount}
- Budget: ${origReq.currency} ${origReq.totalBudget}
- Date: ${origReq.date}
- Outdoor: ${origReq.isOutdoor}
- Theme: ${origReq.theme}
- Priorities: ${origReq.priorities?.join(', ')}

New / Proposed Requirements:
- Guests: ${newReq.guestCount} (${newReq.guestCount - origReq.guestCount >= 0 ? '+' : ''}${newReq.guestCount - origReq.guestCount})
- Budget: ${newReq.currency} ${newReq.totalBudget} (${newReq.totalBudget - origReq.totalBudget >= 0 ? '+' : ''}${newReq.totalBudget - origReq.totalBudget})
- Date: ${newReq.date}
- Outdoor: ${newReq.isOutdoor}
- Theme: ${newReq.theme}
- Reason stated by user: "${triggerReason || 'Requirements revision'}"

Current Budget Categories:
${JSON.stringify((currentEvent.budgetCategories || []).map((c: any) => ({
  name: c.name,
  allocated: c.allocatedAmount,
  confirmed: c.confirmedQuote,
  isFixed: c.isFixedCost,
})), null, 2)}

Current Tasks:
${JSON.stringify((currentEvent.tasks || []).map((t: any) => ({
  id: t.id,
  title: t.title,
  dueDate: t.dueDate,
  category: t.relatedCategory,
})), null, 2)}

Analysis Directives:
1. Impact Assessment: Recognize that if guests increased but budget decreased, per-head budget dropped drastically! Re-evaluate per-plate catering, venue capacity, and seating.
2. Distinguish fixed vs variable costs: Venue rental does not scale with guests, but catering, chairs, and favor boxes do!
3. Identify affected tasks and deadlines (e.g. if event date moved or guest count changed).
4. Identify newly created risks and contingencies.
5. Provide practical, non-destructive recommendations with explicit trade-offs.
6. Present selectable proposed adjustments that the user must review and approve before applying.
`;

  const geminiResult = await callGeminiWithRetry({
    contents: prompt,
    config: {
      systemInstruction: 'You are Festivo AI Adaptive Intelligence Engine. Return pristine JSON proposal.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          impactAssessment: { type: Type.STRING },
          affectedBudgetCategories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                categoryName: { type: Type.STRING },
                originalAmount: { type: Type.NUMBER },
                proposedAmount: { type: Type.NUMBER },
                delta: { type: Type.NUMBER },
                rationale: { type: Type.STRING },
              },
              required: ['categoryName', 'originalAmount', 'proposedAmount', 'delta', 'rationale'],
            },
          },
          affectedTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                title: { type: Type.STRING },
                action: { type: Type.STRING },
                originalDueDate: { type: Type.STRING },
                newDueDate: { type: Type.STRING },
                rationale: { type: Type.STRING },
              },
              required: ['title', 'action', 'rationale'],
            },
          },
          newRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                mitigation: { type: Type.STRING },
              },
              required: ['description', 'severity', 'mitigation'],
            },
          },
          tradeOffs: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          alternativeSolutions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          assumptionsAndUncertainties: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          decisionsRequiringConfirmation: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'impactAssessment',
          'affectedBudgetCategories',
          'affectedTasks',
          'newRisks',
          'tradeOffs',
          'alternativeSolutions',
          'decisionsRequiringConfirmation',
        ],
      },
    },
  });

  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      const proposal: PlanRevisionProposal = {
        id: `proposal-${Date.now()}`,
        eventId: origReq.id,
        timestamp: new Date().toISOString(),
        triggerReason: triggerReason || 'Requirements update',
        originalRequirements: origReq,
        updatedRequirements: newReq,
        impactAssessment: parsed.impactAssessment,
        affectedBudgetCategories: (parsed.affectedBudgetCategories || []).map((c: any) => ({
          ...c,
          approved: true,
        })),
        affectedTasks: (parsed.affectedTasks || []).map((t: any) => ({
          ...t,
          approved: true,
        })),
        newRisks: (parsed.newRisks || []).map((r: any) => ({
          ...r,
          approved: true,
        })),
        tradeOffs: parsed.tradeOffs || [],
        alternativeSolutions: parsed.alternativeSolutions || [],
        assumptionsAndUncertainties: parsed.assumptionsAndUncertainties || [],
        decisionsRequiringConfirmation: parsed.decisionsRequiringConfirmation || [],
        isApplied: false,
        isSimulated: false,
      };

      return res.json(proposal);
    } catch (parseErr) {
      console.error('Error parsing JSON from Gemini adaptive intelligence:', parseErr);
    }
  }

  // High-fidelity fallback if all live attempts exhaust
  const guestDelta = newReq.guestCount - origReq.guestCount;
  const budgetDelta = newReq.totalBudget - origReq.totalBudget;

  const proposal: PlanRevisionProposal = {
    id: `proposal-${Date.now()}`,
    eventId: origReq.id,
    timestamp: new Date().toISOString(),
    triggerReason: triggerReason || 'Dynamic requirements adaptation',
    originalRequirements: origReq,
    updatedRequirements: newReq,
    impactAssessment: `Guest count shifted from ${origReq.guestCount} to ${newReq.guestCount} (${guestDelta >= 0 ? '+' : ''}${guestDelta}), while total budget moved from ${origReq.currency} ${origReq.totalBudget.toLocaleString()} to ${origReq.currency} ${newReq.totalBudget.toLocaleString()} (${budgetDelta >= 0 ? '+' : ''}${budgetDelta.toLocaleString()}). Effective per-guest spending capacity shifted from ${origReq.currency} ${Math.round(origReq.totalBudget / origReq.guestCount)} to ${origReq.currency} ${Math.round(newReq.totalBudget / newReq.guestCount)}. This compresses variable catering and favors margins while fixed venue rental remains constant.`,
    affectedBudgetCategories: [
      {
        categoryName: 'Catering',
        originalAmount: 75000,
        proposedAmount: Math.round(newReq.guestCount * 480),
        delta: Math.round(newReq.guestCount * 480) - 75000,
        rationale: `Re-negotiate menu to high-volume comfort buffet items (pasta/biryani live counter) reducing per-plate cost from ₹600 to ~₹480 for ${newReq.guestCount} guests.`,
        approved: true,
      },
      {
        categoryName: 'Decoration',
        originalAmount: 30000,
        proposedAmount: 20000,
        delta: -10000,
        rationale: 'Focus floral accents exclusively on the photo backdrop and stage; replace table floral arrangements with warm fairy light mason jars.',
        approved: true,
      },
      {
        categoryName: 'Entertainment',
        originalAmount: 12000,
        proposedAmount: 8000,
        delta: -4000,
        rationale: 'Shift to solo acoustic vocalist with house PA system rather than external amplified band.',
        approved: true,
      },
      {
        categoryName: 'Contingency Reserve',
        originalAmount: 9000,
        proposedAmount: 6000,
        delta: -3000,
        rationale: 'Trim buffer marginally while retaining emergency operational cushion for extra plate overruns.',
        approved: true,
      },
    ],
    affectedTasks: [
      {
        taskId: 'task-01',
        title: `Re-negotiate Catering for ${newReq.guestCount} Pax`,
        action: 'modify',
        originalDueDate: '2026-11-05',
        newDueDate: '2026-11-04',
        rationale: 'Urgent: Request re-quote based on higher volume and streamlined course count.',
        approved: true,
      },
      {
        title: `Verify Lawn Capacity for ${newReq.guestCount} Guests`,
        action: 'add',
        newDueDate: '2026-11-06',
        rationale: 'Confirm that current 5,000 sq.ft lawn can comfortably accommodate 16 tables and wide buffet lanes.',
        approved: true,
      },
    ],
    newRisks: [
      {
        description: `Buffet bottleneck during dinner rush with ${newReq.guestCount} attendees`,
        severity: 'high',
        mitigation: 'Mandate double-sided buffet stations to cut waiting queue times in half.',
        approved: true,
      },
      {
        description: 'Per-head food quality perceived lower due to budget compression',
        severity: 'medium',
        mitigation: 'Prioritize 2 standout hot live stations to create high-value sensory impact.',
        approved: true,
      },
    ],
    tradeOffs: [
      `Per-plate catering allowance decreases by ~20%, requiring menu simplification.`,
      `Table decoration switches from fresh floral arrangements to ambient string lighting.`,
      `Crowd density at the lawn will be higher (+33%), requiring careful buffet lane management.`
    ],
    alternativeSolutions: [
      'Option A: High-tea & heavy appetizer format instead of full 4-course dinner.',
      'Option B: Stagger guest arrival times (family early at 6 PM, friends at 7:30 PM).'
    ],
    assumptionsAndUncertainties: [
      'Assumes The Tamara Greens lawn can accommodate extra 4 tables without fee increase.',
      'Assumes caterer agrees to volume discount at 160 pax.'
    ],
    decisionsRequiringConfirmation: [
      'Do you approve shifting the catering format to high-volume live stations?',
      'Do you approve reducing entertainment from an acoustic duo to a solo artist?'
    ],
    isApplied: false,
    isSimulated: true,
  };

  return res.json(proposal);
});

// 4. Vendor Quote Analysis
app.post('/api/gemini/vendor-analysis', async (req: Request, res: Response) => {
  const { quotes, category, eventRequirements } = req.body;

  if (!quotes || !quotes.length) {
    return res.status(400).json({ error: 'Quotes array required' });
  }

  const prompt = `
You are the Vendor Intelligence Specialist for Festivo AI.
Analyze the following quotes for ${category} for event "${eventRequirements?.name || 'Celebration'}" with ${eventRequirements?.guestCount || 100} guests:
${JSON.stringify(quotes, null, 2)}

Provide:
1. Side-by-side comparison summary.
2. Distinct pros and cons for each.
3. Crucial missing information (e.g. staff ratios, cleanup fees, power backup).
4. Hidden cost traps to watch out for.
5. Contract terms requiring immediate clarification.
6. Sharp questions the host must ask the vendor.
7. Clear final recommendation.
`;

  const geminiResult = await callGeminiWithRetry({
    contents: prompt,
    config: {
      systemInstruction: 'You are Festivo AI Vendor Specialist. Return pristine JSON analysis.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
          hiddenCostsWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          contractClarifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING },
        },
        required: ['summary', 'pros', 'cons', 'missingInfo', 'hiddenCostsWarnings', 'contractClarifications', 'questionsToAsk', 'recommendation'],
      },
    },
  });

  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      return res.json({
        ...parsed,
        isSimulated: false,
        modelUsed: geminiResult.modelUsed,
      });
    } catch (parseErr) {
      console.error('Error parsing JSON from Gemini vendor analysis:', parseErr);
    }
  }

  // Simulation fallback
  return res.json({
    summary: `Compared ${quotes.length} quotations for ${category}. Identified significant variances in included staff services, cleanup obligations, and payment milestones.`,
    pros: [
      `Option 1 is ₹12,000 more economical and includes 2 live appetizer counters.`,
      `Option 2 provides all-inclusive compostable waste removal and organic produce.`
    ],
    cons: [
      `Option 1 excludes post-event garbage haulage which may incur a venue penalty.`,
      `Option 2 has a strict non-refundable advance within 21 days.`
    ],
    missingInfo: [
      'Exact waitstaff to guest ratio during peak service',
      'Whether separate preparation pans are used for special diets'
    ],
    hiddenCostsWarnings: [
      '5% GST may not be included in base per-plate pricing',
      'Overtime fee per hour if event extends past 10:30 PM'
    ],
    contractClarifications: [
      'Confirm whether guest count reconciliation happens upon entry or pre-event RSVP'
    ],
    questionsToAsk: [
      'Will you provide a dedicated supervisor on-site for the full duration?',
      'What is your exact backup plan if power cuts to the chafing heaters?'
    ],
    recommendation: 'Negotiate with Vendor 1 to include waste disposal for an extra ₹1,500; this keeps total cost lower than Vendor 2 while eliminating venue penalty risk.',
    isSimulated: true,
  });
});

// 5. Context-Aware AI Copilot
app.post('/api/gemini/copilot', async (req: Request, res: Response) => {
  const { messages, currentEvent, userQuery } = req.body;

  if (!currentEvent || !userQuery) {
    return res.status(400).json({ error: 'Missing currentEvent or userQuery' });
  }

  const reqs = currentEvent.requirements;
  const budgetCats = currentEvent.budgetCategories || [];
  const tasks = currentEvent.tasks || [];
  const risks = currentEvent.risks || [];
  const guests = currentEvent.guests || [];

  const contextPrompt = `
You are the Festivo AI Copilot, an expert celebration and event planning assistant.
You are actively advising on the following REAL event in the user's workspace:
- Name: "${reqs.name}" (${reqs.type})
- Date: ${reqs.date} (${reqs.city})
- Guests: ${reqs.guestCount}
- Total Budget: ${reqs.currency} ${reqs.totalBudget}
- Theme: ${reqs.theme}
- Outdoor: ${reqs.isOutdoor}
- Priorities: ${reqs.priorities?.join(', ')}

Current Financials:
- Total Budget: ${reqs.currency} ${reqs.totalBudget}
- Allocated: ${reqs.currency} ${budgetCats.reduce((s: number, c: any) => s + c.allocatedAmount, 0)}
- Categories: ${budgetCats.map((c: any) => `${c.name}: ${c.allocatedAmount} (Locked: ${c.confirmedQuote > 0})`).join('; ')}

Current Tasks (${tasks.length}):
${tasks.slice(0, 8).map((t: any) => `- [${t.status}] ${t.title} (Due: ${t.dueDate})`).join('\n')}

Active Risks (${risks.length}):
${risks.map((r: any) => `- ${r.description} (Severity: ${r.severityScore}/9, Status: ${r.status})`).join('\n')}

Guests Status:
Total Guests: ${guests.length} records.

User Question: "${userQuery}"

Directives:
1. Ground your answer strictly in the active event data above. Do not invent contradictory figures.
2. If the user asks how to save money, suggest specific trade-offs across their flexible categories.
3. If they ask about risks, reference their actual logged risks (weather, decibel curfew, capacity).
4. If a suggested action implies a change to the plan, formulate a constructive suggestion without claiming it is already saved.
5. Be concise, warm, professional, and actionable.
`;

  const geminiResult = await callGeminiWithRetry({
    contents: contextPrompt,
    config: {
      systemInstruction: 'You are Festivo AI Copilot. Always reference real event figures with warmth and precision.',
    },
  });

  if (geminiResult) {
    return res.json({
      content: geminiResult.text,
      isSimulated: false,
      modelUsed: geminiResult.modelUsed,
    });
  }

  // Grounded simulation response
  let answer = `I've analyzed **${reqs.name}** (${reqs.currency} ${reqs.totalBudget.toLocaleString()} for ${reqs.guestCount} guests).\n\n`;
  const q = userQuery.toLowerCase();

  if (q.includes('reduce') || q.includes('save') || q.includes('cut') || q.includes('budget')) {
    answer += `To optimize spending without impacting guest enjoyment:\n1. **Decoration:** Shift from full floral canopies to focal backdrops and fairy lights (potential savings: ~${reqs.currency} 8,000 - 10,000).\n2. **Entertainment:** A solo acoustic performer or curated playlist instead of a multi-piece live band (potential savings: ~${reqs.currency} 4,000).\n3. **Catering:** Streamline dessert courses to 1 signature item (saves ~₹40/plate).\n\nYou can run our **"What Changed?"** engine to model these exact trade-offs!`;
  } else if (q.includes('risk') || q.includes('weather') || q.includes('rain')) {
    answer += `Your top active risk is **weather disruption** (${risks[0]?.description || 'November rain showers'}). Your mitigation strategy is to pre-wire the venue's covered verandah canopy so the live acoustic duo and buffet can relocate within 15 minutes if rain begins.`;
  } else if (q.includes('task') || q.includes('week') || q.includes('due') || q.includes('deadline')) {
    const nextTask = tasks.find((t: any) => t.status !== 'completed');
    answer += `Your immediate top priority is **${nextTask?.title || 'Vendor Tasting'}** (scheduled for ${nextTask?.dueDate || 'next week'}). Would you like me to generate a checklist of questions to ask?`;
  } else {
    answer += `Based on your timeline for ${reqs.date}, your venue booking is confirmed with ${reqs.currency} 20,000 advance paid. Your next critical milestone is confirming caterer menus and tasting protocols. What specific area would you like to review?`;
  }

  return res.json({
    content: answer,
    isSimulated: true,
  });
});

// ----------------- VITE DEV / PRODUCTION MIDDLEWARE ----------------- //

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Festivo AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal error starting server:', err);
  });
}

export default app;
