// server.ts
import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

// src/data/initialData.ts
var SAMPLE_BIRTHDAY_EVENT = {
  requirements: {
    id: "festivo-evt-demo-01",
    name: "Aarav\u2019s 25th Milestone Celebration",
    type: "birthday",
    date: "2026-11-28",
    city: "Bengaluru",
    guestCount: 120,
    totalBudget: 2e5,
    currency: "INR",
    theme: "Warm Autumnal Garden Soir\xE9e (Plum, Coral & Muted Gold)",
    venuePreference: "Boutique Garden Lawn or Open-Air Courtyard",
    isOutdoor: true,
    dietaryPreferences: ["Vegetarian (45%)", "Non-Vegetarian (55%)", "Gluten-Free (4 guests)", "Jain (6 guests)"],
    accessibilityNeeds: ["Wheelchair accessible entrance for grandparents", "Step-free seating area"],
    culturalPreferences: "Contemporary celebration with live acoustic performance and cake cutting ceremony",
    ageGroups: ["Young adults (20-30)", "Family and elders (50-75)"],
    priorities: ["Memorable food & mocktails", "Atmospheric acoustic music", "High-quality photography", "Comfortable guest seating"],
    notes: "Outdoor evening event starting at 6:30 PM. Weather contingency required for possible light November shower.",
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-10-30T09:00:00.000Z"
  },
  blueprint: {
    summary: "A curated 25th milestone birthday celebration for 120 guests designed around an intimate yet vibrant autumn garden aesthetic in Bengaluru. Balanced between live acoustic entertainment, bespoke culinary stations, and a dedicated photo-walk corridor.",
    themeRationale: "Deep plum and midnight hues paired with warm coral florals and muted gold accent lighting elevate a birthday from conventional party to an elegant, photographable evening soiree suited for both peer friends and family elders.",
    suggestedVenueCharacteristics: "An open-air lush lawn (minimum 4,500 sq.ft) with an attached covered verandah canopy for all-weather contingency, equipped with three-phase power support for acoustic amplification.",
    budgetRationale: "Budget of \u20B92,00,000 allocated with a per-guest food & beverage allowance of ~\u20B9650, allowing healthy allocations for venue, ambient lighting decor, and professional candid photography without exceeding financial limits.",
    cateringConsiderations: "Live counter format featuring artisanal chaat and kebabs, dual main courses (separate Jain/pure veg buffet line), and signature seasonal mocktail spritzers.",
    guestManagementRecommendations: "Digital RSVP tracking with dietary collection 3 weeks prior. Group elder seating near the acoustic stage perimeter for lower acoustic decibel levels.",
    vendorRequirements: "Prioritize caterers who provide in-house service personnel and dishware. Photographers must deliver same-week highlight teaser reels.",
    planningTimelineSummary: "6-week structured milestone roadmap: Venue & Caterer confirmation by W-5, invitations sent by W-4, decor mockup approval by W-2, sound check on D-day.",
    contingencyPlans: "Semi-permanent clear marquee rain canopy reserved on hold with venue vendor; auxiliary generator backed up for stage acoustics.",
    costSavingOpportunities: [
      "Digital interactive invitations with RSVP collection instead of physical printed kits (saves ~\u20B94,000).",
      "Select seasonal local marigolds and bougainvillea alongside plum foliage rather than imported lilies (saves ~\u20B98,000).",
      "Opt for a 3-piece acoustic duo over a full 5-piece live band (saves ~\u20B912,000)."
    ],
    assumptionsRequiringConfirmation: [
      "Venue includes basic 100-amp power backup.",
      "Sound curfew permitted until 10:00 PM per local Bengaluru municipal bylaws.",
      "Outside caterer corkage/entry fees waived by lawn management."
    ],
    generatedAt: "2026-10-15T10:05:00.000Z",
    isAiGenerated: true,
    isSimulated: false
  },
  budgetCategories: [
    {
      id: "cat-venue",
      name: "Venue",
      allocatedAmount: 5e4,
      estimatedCost: 5e4,
      confirmedQuote: 48e3,
      actualExpense: 2e4,
      // advance paid
      notes: "Lawn rental for 7 hours including bridal/guest suite and green room",
      isFixedCost: true
    },
    {
      id: "cat-catering",
      name: "Catering",
      allocatedAmount: 75e3,
      estimatedCost: 78e3,
      confirmedQuote: 72e3,
      actualExpense: 0,
      notes: "120 plates @ \u20B9600/plate + 2 live starter counters + mocktail bar",
      isFixedCost: false
      // scales with guest count!
    },
    {
      id: "cat-decor",
      name: "Decoration",
      allocatedAmount: 3e4,
      estimatedCost: 32e3,
      confirmedQuote: 0,
      actualExpense: 0,
      notes: "Fairy light canopy, floral arch entryway, warm lanterns on 12 guest tables",
      isFixedCost: false
    },
    {
      id: "cat-photo",
      name: "Photography",
      allocatedAmount: 2e4,
      estimatedCost: 2e4,
      confirmedQuote: 18e3,
      actualExpense: 5e3,
      notes: "1 candid photographer + 1 videographer (5 hours coverage + 1-min teaser)",
      isFixedCost: true
    },
    {
      id: "cat-entertainment",
      name: "Entertainment",
      allocatedAmount: 12e3,
      estimatedCost: 15e3,
      confirmedQuote: 0,
      actualExpense: 0,
      notes: "Acoustic duo (vocalist + guitarist) + sound equipment and mic setup",
      isFixedCost: true
    },
    {
      id: "cat-gifts",
      name: "Gifts & Favors",
      allocatedAmount: 4e3,
      estimatedCost: 4e3,
      confirmedQuote: 0,
      actualExpense: 0,
      notes: "Custom seed-paper thank-you cards and artisanal mini sweet boxes",
      isFixedCost: false
    },
    {
      id: "cat-contingency",
      name: "Contingency Reserve",
      allocatedAmount: 9e3,
      estimatedCost: 9e3,
      confirmedQuote: 0,
      actualExpense: 0,
      notes: "Buffer for last-minute guest additions, extra ice, generator fuel, or tips",
      isFixedCost: false
    }
  ],
  guests: [
    {
      id: "g-01",
      name: "Vikram & Priya Malhotra",
      email: "vikram.m@example.com",
      phone: "+91 98450 11223",
      rsvpStatus: "confirmed",
      plusOnes: 1,
      dietary: "Vegetarian",
      accessibility: "None",
      seatingNotes: "Table 2 - College friends",
      tableNumber: "Table 2"
    },
    {
      id: "g-02",
      name: "Dr. Suresh & Shobha Sharma",
      email: "suresh.s@example.com",
      phone: "+91 98452 33445",
      rsvpStatus: "confirmed",
      plusOnes: 1,
      dietary: "Jain Vegetarian",
      accessibility: "Wheelchair ramp access required",
      seatingNotes: "Table 1 - Family elders",
      tableNumber: "Table 1"
    },
    {
      id: "g-03",
      name: "Rohit Sen",
      email: "rohit.sen@example.com",
      phone: "+91 99001 55667",
      rsvpStatus: "pending",
      plusOnes: 0,
      dietary: "Non-Vegetarian",
      accessibility: "None",
      seatingNotes: "Table 3 - Tech team",
      tableNumber: "Table 3"
    },
    {
      id: "g-04",
      name: "Ananya Deshmukh",
      email: "ananya.d@example.com",
      phone: "+91 97400 88990",
      rsvpStatus: "confirmed",
      plusOnes: 1,
      dietary: "Gluten-Free",
      accessibility: "None",
      seatingNotes: "Table 2 - College friends",
      tableNumber: "Table 2"
    },
    {
      id: "g-05",
      name: "Karan Mehra",
      email: "karan.m@example.com",
      phone: "+91 98860 12345",
      rsvpStatus: "declined",
      plusOnes: 0,
      dietary: "None",
      accessibility: "None",
      seatingNotes: "Out of town on business"
    }
  ],
  vendors: [
    {
      id: "v-cater-01",
      name: "Royal Spice Caterers",
      category: "catering",
      contactPerson: "Chef Rajesh Nair",
      phone: "+91 98440 55112",
      email: "contact@royalspiceblr.com",
      status: "shortlisted",
      notes: "Specializes in Indian fusion and live skewer stations",
      quotes: [
        {
          id: "q-cater-01",
          vendorName: "Royal Spice Caterers",
          quotedPrice: 72e3,
          includedServices: [
            "120 plates buffet (3 appetizers, 4 mains, 2 desserts)",
            "2 live counter stations (Amritsari Kulcha + Tandoori Paneer/Chicken)",
            "Full serving staff (8 waitstaff + 2 counter chefs)",
            "Standard crockery, cutlery, and linen runners",
            "Water dispensers and ice cubes"
          ],
          excludedServices: [
            "Mocktail bar syrup ingredients",
            "Garbage clearance from venue premises after 11 PM",
            "Service tax / GST (quoted 5% additional)"
          ],
          taxesAndFees: 3600,
          depositRequired: 25e3,
          paymentMilestones: "35% advance booking, 50% on event morning, 15% after dinner service",
          cancellationTerms: "Full refund up to 14 days prior; 50% retained thereafter",
          validUntil: "2026-11-10",
          availabilityNotes: "Confirmed available for evening slot on Nov 28",
          notes: "Competitive per-plate rate of \u20B9600. High tasting feedback."
        },
        {
          id: "q-cater-02",
          vendorName: "Gourmet Greens & Grills",
          quotedPrice: 84e3,
          includedServices: [
            "120 plates buffet with organic farm produce",
            "Signature bespoke mocktail bar with bartender",
            "Complete post-event compostable waste disposal",
            "Premium porcelain dinnerware and copper warmers"
          ],
          excludedServices: ["Table centerpiece florals", "Overtime past 10:30 PM (\u20B93,000/hr)"],
          taxesAndFees: 4200,
          depositRequired: 4e4,
          paymentMilestones: "50% advance, 50% on start of service",
          cancellationTerms: "Non-refundable advance within 21 days",
          validUntil: "2026-11-05",
          availabilityNotes: "Tentative booking held until Nov 5",
          notes: "Higher tier pricing (\u20B9700/plate) but includes mocktail bar and zero-waste disposal."
        }
      ],
      aiAnalysis: {
        summary: "Royal Spice is \u20B912,000 more cost-effective (\u20B9600/plate vs \u20B9700/plate) and offers live tandoor stations. However, Gourmet Greens includes the mocktail bar and waste disposal which Royal Spice excludes.",
        pros: ["Under budget by \u20B93,000", "Live appetizer counters included", "Generous cancellation window (14 days)"],
        cons: ["5% GST is extra (+\u20B93,600)", "Does not handle waste clearance after 11 PM"],
        missingInfo: ["Staff-to-guest ratio during peak dinner rush", "Whether separate Jain cookware is used"],
        hiddenCostsWarnings: ["Venue cleaning penalty if caterer leaves trash bag behind", "Cost of hiring separate mocktail mixer"],
        contractClarifications: ["Confirm if plate count is reconciled at head-count or pre-booked number."],
        questionsToAsk: [
          "Can you bundle 2 mocktail spritzers into the \u20B9600 plate cost?",
          "Will you arrange certified separate prep vessels for the Jain vegetarian guests?"
        ],
        recommendation: "Negotiate with Royal Spice Caterers to include mocktail dispensers to save having to hire a separate beverage vendor.",
        isSimulated: false
      }
    },
    {
      id: "v-venue-01",
      name: "The Tamara Greens Lawn",
      category: "venue",
      contactPerson: "Kavitha Rao",
      phone: "+91 99450 77889",
      status: "confirmed",
      notes: "Lawn booked with receipt #TG-2026-88",
      quotes: [
        {
          id: "q-venue-01",
          vendorName: "The Tamara Greens Lawn",
          quotedPrice: 48e3,
          includedServices: ["5,000 sq.ft lawn access from 2 PM to 11 PM", "Two air-conditioned green rooms", "Power generator 40 kVA backup", "50 guest parking spots"],
          excludedServices: ["Lawn decoration", "Cleaning surcharge if confetti used (\u20B95,000)"],
          taxesAndFees: 0,
          depositRequired: 2e4,
          paymentMilestones: "\u20B920,000 paid; balance \u20B928,000 on check-in",
          cancellationTerms: "75% refund if cancelled 30 days prior",
          validUntil: "2026-11-28",
          availabilityNotes: "Locked and receipt issued"
        }
      ]
    }
  ],
  tasks: [
    {
      id: "task-01",
      title: "Confirm Caterer Final Tasting & Menu",
      description: "Lock 3 starters, 4 main courses, and confirm Jain vegetarian prep protocol",
      dueDate: "2026-11-05",
      priority: "high",
      status: "in_progress",
      owner: "Aarav (Host)",
      relatedCategory: "Catering",
      dependencies: [],
      isMilestone: true
    },
    {
      id: "task-02",
      title: "Finalize Stage Acoustic Duo & Playlist",
      description: "Review 45-minute acoustic setlist and confirm 2 wireless microphones",
      dueDate: "2026-11-12",
      priority: "medium",
      status: "todo",
      owner: "Rohan",
      relatedCategory: "Entertainment",
      dependencies: []
    },
    {
      id: "task-03",
      title: "Send Digital RSVP Reminders",
      description: "Broadcast WhatsApp reminder with meal choice selection to pending 35 guests",
      dueDate: "2026-11-15",
      priority: "high",
      status: "todo",
      owner: "Priya",
      relatedCategory: "Invitations",
      dependencies: []
    },
    {
      id: "task-04",
      title: "Approve Autumn Floral & Fairy Light Mockup",
      description: "Verify plum and coral floral runners and ensure fairy light canopy height complies with fire safety",
      dueDate: "2026-11-18",
      priority: "medium",
      status: "todo",
      owner: "Aarav (Host)",
      relatedCategory: "Decoration",
      dependencies: ["task-01"]
    },
    {
      id: "task-05",
      title: "Venue Walkthrough with Photographer",
      description: "Map golden-hour lighting zones (5:15 PM - 5:50 PM) and cake cutting backdrop spot",
      dueDate: "2026-11-22",
      priority: "medium",
      status: "todo",
      owner: "Vikram",
      relatedCategory: "Photography",
      dependencies: []
    },
    {
      id: "task-06",
      title: "Pay Lawn Final Balance & Settle Security Deposit",
      description: "Transfer remaining \u20B928,000 to The Tamara Greens management",
      dueDate: "2026-11-28",
      priority: "high",
      status: "todo",
      owner: "Aarav (Host)",
      relatedCategory: "Venue",
      dependencies: []
    }
  ],
  risks: [
    {
      id: "risk-01",
      description: "Unseasonal late November evening shower wetting the outdoor lawn banquet",
      category: "weather",
      likelihood: "medium",
      impact: "high",
      severityScore: 6,
      affectedTasks: ["task-04", "task-05"],
      mitigationStrategy: "Ensure venue verandah is pre-wired for instant buffet shift; retain clear tarp covers on standby with decorator.",
      contingencyPlan: "Shift buffet tables and acoustic stage under the 1,800 sq.ft covered verandah within 15 minutes.",
      status: "mitigating"
    },
    {
      id: "risk-02",
      description: "Guest count surging by 20-30 guests beyond the 120 RSVP ceiling",
      category: "guest",
      likelihood: "medium",
      impact: "medium",
      severityScore: 4,
      affectedTasks: ["task-01", "task-03"],
      mitigationStrategy: "Contract caterer with a standard 10% buffer tolerance (up to 132 plates without surcharge).",
      contingencyPlan: "Release 2 additional reserve tables and activate backup dessert platters.",
      status: "mitigating"
    },
    {
      id: "risk-03",
      description: "Local 10:00 PM decibel curfew enforcement disrupting live music performance",
      category: "permits",
      likelihood: "high",
      impact: "low",
      severityScore: 3,
      affectedTasks: ["task-02"],
      mitigationStrategy: "Schedule live acoustic duo strictly between 7:30 PM - 9:30 PM, transitioning to low-volume background jazz thereafter.",
      contingencyPlan: "Acoustic unplugged session without speaker amplification for the final 30 minutes.",
      status: "resolved"
    }
  ],
  revisions: [
    {
      id: "rev-01",
      eventId: "festivo-evt-demo-01",
      timestamp: "2026-10-20T14:30:00.000Z",
      reason: "Initial blueprint creation and baseline budget allocation",
      snapshot: {}
      // populated on revision save
    }
  ],
  copilotMessages: [
    {
      id: "msg-01",
      role: "assistant",
      content: 'Welcome to Festivo AI! I am your intelligent celebration copilot. I\u2019ve reviewed Aarav\u2019s 25th Milestone Celebration. You have \u20B950,000 allocated for venue (locked at \u20B948,000), \u20B975,000 for catering (120 guests), and \u20B977,000 remaining across decor, photography, entertainment, and reserve. How can I assist you today? You can test our "What changed?" scenario, optimize the budget, or compare caterer quotes.',
      timestamp: "2026-10-30T09:00:00.000Z",
      isSimulated: false,
      suggestedAction: {
        type: "open_what_changed",
        label: 'Test "What Changed?" (160 guests / \u20B91.7L budget)'
      }
    }
  ]
};

// src/utils/calculations.ts
function formatCurrency(amount, currency = "INR", locale = "en-IN") {
  if (isNaN(amount) || !isFinite(amount)) return "0";
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount);
  } catch (e) {
    const symbol = currency === "INR" ? "\u20B9" : currency === "USD" ? "$" : currency === "EUR" ? "\u20AC" : "\xA3";
    return `${symbol}${amount.toLocaleString()}`;
  }
}
function calculateTotalAllocated(categories) {
  return categories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0);
}
function calculateBudgetReduction(categories, newTotalBudget, currentTotalBudget) {
  const reductionAmount = Math.max(0, currentTotalBudget - newTotalBudget);
  const percentageReduction = currentTotalBudget > 0 ? reductionAmount / currentTotalBudget * 100 : 0;
  const warnings = [];
  const totalAllocated = calculateTotalAllocated(categories);
  const fixedCategories = categories.filter((c) => c.isFixedCost || c.confirmedQuote > 0);
  const flexibleCategories = categories.filter((c) => !c.isFixedCost && c.confirmedQuote === 0);
  const fixedSum = fixedCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const flexibleSum = flexibleCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  if (newTotalBudget < fixedSum) {
    warnings.push(
      `Fixed obligations and confirmed vendor deposits (totaling ${formatCurrency(
        fixedSum
      )}) exceed the target budget. You may need to renegotiate vendor contracts.`
    );
  }
  const categoryFlexibilityWeights = {
    "Decoration": 1.6,
    "Entertainment": 1.4,
    "Gifts & Favors": 1.5,
    "Contingency Reserve": 1.2,
    "Photography": 1.1,
    "Transportation": 1,
    "Catering": 0.8,
    // Harder to cut without guest reduction
    "Venue": 0.4,
    // Usually fixed once committed
    "Logistics": 0.7,
    "Invitations": 1.2,
    "Other": 1
  };
  let totalWeightedFlexible = 0;
  flexibleCategories.forEach((cat) => {
    const weight = categoryFlexibilityWeights[cat.name] || 1;
    totalWeightedFlexible += cat.allocatedAmount * weight;
  });
  const proposedCuts = categories.map((cat) => {
    if (cat.isFixedCost || cat.confirmedQuote > 0 || totalWeightedFlexible === 0) {
      return {
        categoryName: cat.name,
        originalAmount: cat.allocatedAmount,
        proposedAmount: cat.allocatedAmount,
        savings: 0,
        isFixedCost: true,
        reason: cat.confirmedQuote > 0 ? "Confirmed vendor quotation locked" : "Fixed infrastructure requirement"
      };
    }
    const weight = categoryFlexibilityWeights[cat.name] || 1;
    const catShare = cat.allocatedAmount * weight / totalWeightedFlexible;
    const calculatedCut = Math.round(reductionAmount * catShare);
    const maxCutAllowed = Math.round(cat.allocatedAmount * 0.7);
    const actualCut = Math.min(calculatedCut, maxCutAllowed);
    const proposedAmount = Math.max(0, cat.allocatedAmount - actualCut);
    return {
      categoryName: cat.name,
      originalAmount: cat.allocatedAmount,
      proposedAmount,
      savings: actualCut,
      isFixedCost: false,
      reason: `Optimized flexible allocation (-${Math.round(actualCut / cat.allocatedAmount * 100)}%)`
    };
  });
  return {
    reductionAmount,
    percentageReduction: Math.round(percentageReduction * 10) / 10,
    isFeasible: newTotalBudget >= fixedSum,
    warnings,
    proposedCuts
  };
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "festivo-data") : path.join(__dirname, "data");
var EVENTS_FILE = path.join(DATA_DIR, "events.json");
var memoryEvents = [SAMPLE_BIRTHDAY_EVENT];
app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => {
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  next();
});
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
}
function loadEvents() {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryEvents = parsed;
        return memoryEvents;
      }
    }
  } catch (err) {
  }
  return memoryEvents;
}
function saveEvents(events) {
  memoryEvents = events;
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
  }
}
var apiKey = process.env.GEMINI_API_KEY;
var aiClient = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log("Gemini GenAI client initialized successfully.");
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI client:", e);
  }
} else {
  console.log("No GEMINI_API_KEY detected. Demo simulation mode active.");
}
var lastGeminiError = null;
async function callGeminiWithRetry(params) {
  if (!aiClient) {
    lastGeminiError = "No API key configured (aiClient is null)";
    return null;
  }
  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.8-flash"
  ];
  const startTime = Date.now();
  const MAX_TOTAL_MS = 9e3;
  for (const model of candidateModels) {
    const elapsed = Date.now() - startTime;
    const remainingTime = MAX_TOTAL_MS - elapsed;
    if (remainingTime < 1500) {
      console.warn("[Gemini]: Time window depleted, engaging deterministic simulation fallback.");
      lastGeminiError = "Time window depleted (>9000ms)";
      break;
    }
    const perCallTimeout = Math.min(remainingTime - 400, 8e3);
    try {
      const responsePromise = aiClient.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Gemini call timed out after ${perCallTimeout}ms`)), perCallTimeout)
      );
      const response = await Promise.race([responsePromise, timeoutPromise]);
      if (response && response.text) {
        lastGeminiError = null;
        return { text: response.text, modelUsed: model };
      }
    } catch (err) {
      const msg = String(err?.message || err);
      console.warn(`[Gemini error on ${model}]:`, msg);
      lastGeminiError = `[${model}]: ${msg}`;
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("Quota") || msg.includes("rate-limit")) {
        console.warn("[Gemini]: Quota exceeded on API key. Transitioning immediately to simulation fallback.");
        lastGeminiError = `Quota exceeded (429 RESOURCE_EXHAUSTED): ${msg}`;
        break;
      }
      continue;
    }
  }
  return null;
}
app.get("/api/health", (req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = !!(rawKey && rawKey !== "MY_GEMINI_API_KEY" && rawKey.trim() !== "");
  res.json({
    status: "ok",
    hasApiKey: !!aiClient,
    apiKeyConfigured: isKeyConfigured,
    apiKeyPrefix: isKeyConfigured ? rawKey.substring(0, 6) + "..." : "none",
    model: "gemini-3.6-flash",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/test-gemini", async (req, res) => {
  const rawKey = process.env.GEMINI_API_KEY;
  if (!aiClient) {
    return res.json({
      success: false,
      reason: "aiClient is null",
      apiKeyPresent: !!rawKey,
      apiKeyValue: rawKey ? rawKey.substring(0, 8) + "..." : "MISSING"
    });
  }
  const testModels = [
    "gemini-3.8-flash",
    "gemini-3.8-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-pro"
  ];
  const results = [];
  for (const model of testModels) {
    try {
      const resp = await Promise.race([
        aiClient.models.generateContent({ model, contents: "Reply with exactly: OK" }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout after 8s")), 8e3))
      ]);
      if (resp && resp.text) {
        results.push({ model, success: true, response: resp.text.trim() });
      } else {
        results.push({ model, success: false, reason: "empty response" });
      }
    } catch (e) {
      const msg = e?.message || String(e);
      const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
      results.push({
        model,
        success: false,
        quotaExceeded: isQuota,
        error: msg.length > 200 ? msg.substring(0, 200) + "..." : msg
      });
    }
  }
  const working = results.find((r) => r.success);
  return res.json({
    workingModel: working ? working.model : null,
    allModelsExhausted: !working,
    results
  });
});
app.get("/api/events", (req, res) => {
  const events = loadEvents();
  res.json(events);
});
app.get("/api/events/:id", (req, res) => {
  const events = loadEvents();
  const event = events.find((e) => e.requirements.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  res.json(event);
});
app.post("/api/events", (req, res) => {
  const newEvent = req.body;
  if (!newEvent || !newEvent.requirements || !newEvent.requirements.name) {
    return res.status(400).json({ error: "Invalid event data" });
  }
  const events = loadEvents();
  events.push(newEvent);
  saveEvents(events);
  res.status(201).json(newEvent);
});
app.put("/api/events/:id", (req, res) => {
  const events = loadEvents();
  const index = events.findIndex((e) => e.requirements.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }
  events[index] = {
    ...events[index],
    ...req.body,
    requirements: {
      ...events[index].requirements,
      ...req.body.requirements,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
  saveEvents(events);
  res.json(events[index]);
});
app.delete("/api/events/:id", (req, res) => {
  let events = loadEvents();
  events = events.filter((e) => e.requirements.id !== req.params.id);
  saveEvents(events);
  res.json({ success: true });
});
app.post("/api/events/:id/reset-demo", (req, res) => {
  let events = loadEvents();
  events = events.filter((e) => e.requirements.id !== SAMPLE_BIRTHDAY_EVENT.requirements.id);
  events.unshift(SAMPLE_BIRTHDAY_EVENT);
  saveEvents(events);
  res.json(SAMPLE_BIRTHDAY_EVENT);
});
app.post("/api/gemini/generate-blueprint", async (req, res) => {
  const reqs = req.body;
  if (!reqs || !reqs.name || !reqs.guestCount || !reqs.totalBudget) {
    return res.status(400).json({ error: "Required fields missing: name, guestCount, totalBudget" });
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
- Preferred Theme/Atmosphere: "${reqs.theme || "Elegant celebration"}"
- Indoor / Outdoor: ${reqs.isOutdoor ? "Outdoor" : "Indoor"}
- Dietary Preferences: ${reqs.dietaryPreferences?.join(", ") || "Standard mixed"}
- Accessibility: ${reqs.accessibilityNeeds?.join(", ") || "Standard"}
- Priorities: ${reqs.priorities?.join(", ") || "Food, ambiance, guest comfort"}
- Notes: "${reqs.notes || "None"}"

Rules:
1. Provide rich, highly tailored recommendations suitable for ${reqs.city} and ${reqs.type}.
2. Ensure realistic budget allocations across categories that sum up to exactly ${reqs.totalBudget}.
3. Propose realistic tasks with structured timeline and real contingencies.
4. Distinguish fixed venue/infrastructure costs from variable per-guest catering costs.
`;
  const geminiResult = await callGeminiWithRetry({
    contents: prompt,
    config: {
      systemInstruction: "You are Festivo AI Architect, generating pristine JSON celebration plans.",
      responseMimeType: "application/json",
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
                items: { type: Type.STRING }
              },
              assumptionsRequiringConfirmation: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: [
              "summary",
              "themeRationale",
              "suggestedVenueCharacteristics",
              "budgetRationale",
              "cateringConsiderations",
              "vendorRequirements",
              "planningTimelineSummary",
              "contingencyPlans"
            ]
          },
          budgetCategories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                allocatedAmount: { type: Type.NUMBER },
                notes: { type: Type.STRING },
                isFixedCost: { type: Type.BOOLEAN }
              },
              required: ["name", "allocatedAmount", "notes", "isFixedCost"]
            }
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
                isMilestone: { type: Type.BOOLEAN }
              },
              required: ["title", "description", "dueDate", "priority"]
            }
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
                contingencyPlan: { type: Type.STRING }
              },
              required: ["description", "category", "likelihood", "impact", "mitigationStrategy", "contingencyPlan"]
            }
          }
        },
        required: ["blueprint", "budgetCategories", "tasks", "risks"]
      }
    }
  });
  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      return res.json({
        ...parsed,
        isSimulated: false,
        modelUsed: geminiResult.modelUsed
      });
    } catch (parseErr) {
      console.error("Error parsing JSON from Gemini blueprint:", parseErr);
    }
  }
  const cateringShare = Math.round(reqs.totalBudget * 0.38);
  const venueShare = Math.round(reqs.totalBudget * 0.25);
  const decorShare = Math.round(reqs.totalBudget * 0.15);
  const photoShare = Math.round(reqs.totalBudget * 0.1);
  const entertainmentShare = Math.round(reqs.totalBudget * 0.07);
  const contingencyShare = reqs.totalBudget - (cateringShare + venueShare + decorShare + photoShare + entertainmentShare);
  return res.json({
    blueprint: {
      summary: `A personalized ${reqs.type} celebration blueprint for ${reqs.guestCount} guests in ${reqs.city}, crafted around the "${reqs.theme}" theme with a disciplined budget of ${reqs.currency} ${reqs.totalBudget.toLocaleString()}.`,
      themeRationale: `The theme "${reqs.theme}" provides an evocative visual anchor tailored to ${reqs.city}'s venue styles, using ambient illumination and bespoke touches to create an unforgettable guest journey.`,
      suggestedVenueCharacteristics: `${reqs.isOutdoor ? "An open-air garden or lawn setting with covered verandah" : "A modern banquet hall or private dining gallery"} with adequate parking for ${Math.round(reqs.guestCount * 0.4)} vehicles, ramp accessibility, and sound curfew compliance.`,
      budgetRationale: `Catering accounts for ${Math.round(cateringShare / reqs.totalBudget * 100)}% (${reqs.currency} ${Math.round(cateringShare / reqs.guestCount)}/guest), balanced by fixed venue and photography allocations and a protective contingency reserve.`,
      cateringConsiderations: `Live appetizer counters alongside a curated buffet honoring dietary needs: ${reqs.dietaryPreferences?.join(", ") || "balanced vegetarian and non-vegetarian selections"}.`,
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
      { name: "Venue", allocatedAmount: venueShare, notes: "Lawn / hall rental for event duration", isFixedCost: true },
      { name: "Catering", allocatedAmount: cateringShare, notes: `${reqs.guestCount} guests @ ~${reqs.currency} ${Math.round(cateringShare / reqs.guestCount)}/plate`, isFixedCost: false },
      { name: "Decoration", allocatedAmount: decorShare, notes: "Backdrop, table floral accents, fairy lights", isFixedCost: false },
      { name: "Photography", allocatedAmount: photoShare, notes: "Candid event coverage & video highlights", isFixedCost: true },
      { name: "Entertainment", allocatedAmount: entertainmentShare, notes: "Acoustic artist / sound equipment rental", isFixedCost: true },
      { name: "Contingency Reserve", allocatedAmount: contingencyShare, notes: "Emergency funds for unexpected surcharges", isFixedCost: false }
    ],
    tasks: [
      { title: "Lock Venue & Deposit", description: `Finalize booking in ${reqs.city} with written access times`, dueDate: reqs.date, priority: "high", relatedCategory: "Venue", isMilestone: true },
      { title: "Menu Tasting & Headcount Agreement", description: "Sample main courses and agree on 10% plate buffer", dueDate: reqs.date, priority: "high", relatedCategory: "Catering", isMilestone: true },
      { title: "Send Digital Invitations", description: "Collect dietary preferences and plus-one counts", dueDate: reqs.date, priority: "medium", relatedCategory: "Invitations", isMilestone: false },
      { title: "Approve Decor Blueprint", description: "Review lighting, stage placement, and floral palette", dueDate: reqs.date, priority: "medium", relatedCategory: "Decoration", isMilestone: false }
    ],
    risks: [
      { description: "Weather fluctuation affecting outdoor activities", category: "weather", likelihood: "medium", impact: "high", mitigationStrategy: "Secure venue with an adjoining covered verandah canopy", contingencyPlan: "Immediate 15-minute relocation protocol for food and sound" },
      { description: "Guest turnout exceeding RSVP count by >15%", category: "guest", likelihood: "medium", impact: "medium", mitigationStrategy: "Contract caterer with 10% plate buffer clause", contingencyPlan: "Release auxiliary buffet chafers and reserve seating" }
    ],
    isSimulated: true
  });
});
app.post("/api/gemini/budget-adaptation", async (req, res) => {
  const { event, targetBudget, priorityNotes } = req.body;
  if (!event || !targetBudget) {
    return res.status(400).json({ error: "Missing event or targetBudget" });
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
Priorities: "${event.requirements.priorities?.join(", ") || "Guest experience"}"
User Special Notes: "${priorityNotes || "Balance elegance with budget discipline"}"

Current Categories:
${JSON.stringify(event.budgetCategories.map((c) => ({
    name: c.name,
    allocated: c.allocatedAmount,
    confirmed: c.confirmedQuote,
    isFixed: c.isFixedCost
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
      systemInstruction: "You are Festivo AI Budget Optimizer. Return pristine JSON only.",
      responseMimeType: "application/json",
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
                actionableRecommendation: { type: Type.STRING }
              },
              required: ["categoryName", "originalAmount", "proposedAmount", "savings", "tradeOffDescription", "actionableRecommendation"]
            }
          },
          tradeOffsSummary: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          negotiationTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["overview", "proposedCuts", "tradeOffsSummary", "negotiationTips"]
      }
    }
  });
  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      return res.json({
        ...parsed,
        reductionAmount: codeReduction.reductionAmount,
        percentageReduction: codeReduction.percentageReduction,
        isSimulated: false,
        modelUsed: geminiResult.modelUsed
      });
    } catch (parseErr) {
      console.error("Error parsing JSON from Gemini budget adaptation:", parseErr);
    }
  }
  return res.json({
    overview: `Deterministic reduction of ${event.requirements.currency} ${codeReduction.reductionAmount.toLocaleString()} (-${codeReduction.percentageReduction}%) calculated by application code. Reductions are prioritized from flexible decor, gifts, and entertainment allocations to safeguard core catering and locked venue commitments.`,
    reductionAmount: codeReduction.reductionAmount,
    percentageReduction: codeReduction.percentageReduction,
    proposedCuts: codeReduction.proposedCuts.map((cut) => ({
      categoryName: cut.categoryName,
      originalAmount: cut.originalAmount,
      proposedAmount: cut.proposedAmount,
      savings: cut.savings,
      tradeOffDescription: cut.isFixedCost ? "Locked commitment or fixed facility fee; no reduction without vendor renegotiation." : `Streamlines ${cut.categoryName.toLowerCase()} elements while preserving core visual and guest touchpoints.`,
      actionableRecommendation: cut.isFixedCost ? "Maintain confirmed agreement." : `Switch to local sourcing or streamlined scope for ${cut.categoryName}.`
    })),
    tradeOffsSummary: [
      `Decor scale shifts from extravagant floral canopies to refined focal point backdrops with ambient string illumination.`,
      `Entertainment relies on a curated acoustic performance rather than an amplified live ensemble.`,
      `Contingency reserve remains proportional to absorb unexpected last-minute requirements.`
    ],
    negotiationTips: [
      "Inquire about weekday or off-peak vendor rate discounts.",
      "Request complimentary tea/coffee stations from catering in exchange for punctual payment milestones."
    ],
    isSimulated: true
  });
});
app.post("/api/gemini/adaptive-intelligence", async (req, res) => {
  const { currentEvent, updatedRequirements, triggerReason } = req.body;
  if (!currentEvent || !updatedRequirements) {
    return res.status(400).json({ error: "Missing currentEvent or updatedRequirements" });
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
- Priorities: ${origReq.priorities?.join(", ")}

New / Proposed Requirements:
- Guests: ${newReq.guestCount} (${newReq.guestCount - origReq.guestCount >= 0 ? "+" : ""}${newReq.guestCount - origReq.guestCount})
- Budget: ${newReq.currency} ${newReq.totalBudget} (${newReq.totalBudget - origReq.totalBudget >= 0 ? "+" : ""}${newReq.totalBudget - origReq.totalBudget})
- Date: ${newReq.date}
- Outdoor: ${newReq.isOutdoor}
- Theme: ${newReq.theme}
- Reason stated by user: "${triggerReason || "Requirements revision"}"

Current Budget Categories:
${JSON.stringify((currentEvent.budgetCategories || []).map((c) => ({
    name: c.name,
    allocated: c.allocatedAmount,
    confirmed: c.confirmedQuote,
    isFixed: c.isFixedCost
  })), null, 2)}

Current Tasks:
${JSON.stringify((currentEvent.tasks || []).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate,
    category: t.relatedCategory
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
      systemInstruction: "You are Festivo AI Adaptive Intelligence Engine. Return pristine JSON proposal.",
      responseMimeType: "application/json",
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
                rationale: { type: Type.STRING }
              },
              required: ["categoryName", "originalAmount", "proposedAmount", "delta", "rationale"]
            }
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
                rationale: { type: Type.STRING }
              },
              required: ["title", "action", "rationale"]
            }
          },
          newRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                mitigation: { type: Type.STRING }
              },
              required: ["description", "severity", "mitigation"]
            }
          },
          tradeOffs: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          alternativeSolutions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          assumptionsAndUncertainties: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          decisionsRequiringConfirmation: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "impactAssessment",
          "affectedBudgetCategories",
          "affectedTasks",
          "newRisks",
          "tradeOffs",
          "alternativeSolutions",
          "decisionsRequiringConfirmation"
        ]
      }
    }
  });
  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      const proposal2 = {
        id: `proposal-${Date.now()}`,
        eventId: origReq.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        triggerReason: triggerReason || "Requirements update",
        originalRequirements: origReq,
        updatedRequirements: newReq,
        impactAssessment: parsed.impactAssessment,
        affectedBudgetCategories: (parsed.affectedBudgetCategories || []).map((c) => ({
          ...c,
          approved: true
        })),
        affectedTasks: (parsed.affectedTasks || []).map((t) => ({
          ...t,
          approved: true
        })),
        newRisks: (parsed.newRisks || []).map((r) => ({
          ...r,
          approved: true
        })),
        tradeOffs: parsed.tradeOffs || [],
        alternativeSolutions: parsed.alternativeSolutions || [],
        assumptionsAndUncertainties: parsed.assumptionsAndUncertainties || [],
        decisionsRequiringConfirmation: parsed.decisionsRequiringConfirmation || [],
        isApplied: false,
        isSimulated: false
      };
      return res.json(proposal2);
    } catch (parseErr) {
      console.error("Error parsing JSON from Gemini adaptive intelligence:", parseErr);
    }
  }
  const guestDelta = newReq.guestCount - origReq.guestCount;
  const budgetDelta = newReq.totalBudget - origReq.totalBudget;
  const proposal = {
    id: `proposal-${Date.now()}`,
    eventId: origReq.id,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    triggerReason: triggerReason || "Dynamic requirements adaptation",
    originalRequirements: origReq,
    updatedRequirements: newReq,
    impactAssessment: `Guest count shifted from ${origReq.guestCount} to ${newReq.guestCount} (${guestDelta >= 0 ? "+" : ""}${guestDelta}), while total budget moved from ${origReq.currency} ${origReq.totalBudget.toLocaleString()} to ${origReq.currency} ${newReq.totalBudget.toLocaleString()} (${budgetDelta >= 0 ? "+" : ""}${budgetDelta.toLocaleString()}). Effective per-guest spending capacity shifted from ${origReq.currency} ${Math.round(origReq.totalBudget / origReq.guestCount)} to ${origReq.currency} ${Math.round(newReq.totalBudget / newReq.guestCount)}. This compresses variable catering and favors margins while fixed venue rental remains constant.`,
    affectedBudgetCategories: [
      {
        categoryName: "Catering",
        originalAmount: 75e3,
        proposedAmount: Math.round(newReq.guestCount * 480),
        delta: Math.round(newReq.guestCount * 480) - 75e3,
        rationale: `Re-negotiate menu to high-volume comfort buffet items (pasta/biryani live counter) reducing per-plate cost from \u20B9600 to ~\u20B9480 for ${newReq.guestCount} guests.`,
        approved: true
      },
      {
        categoryName: "Decoration",
        originalAmount: 3e4,
        proposedAmount: 2e4,
        delta: -1e4,
        rationale: "Focus floral accents exclusively on the photo backdrop and stage; replace table floral arrangements with warm fairy light mason jars.",
        approved: true
      },
      {
        categoryName: "Entertainment",
        originalAmount: 12e3,
        proposedAmount: 8e3,
        delta: -4e3,
        rationale: "Shift to solo acoustic vocalist with house PA system rather than external amplified band.",
        approved: true
      },
      {
        categoryName: "Contingency Reserve",
        originalAmount: 9e3,
        proposedAmount: 6e3,
        delta: -3e3,
        rationale: "Trim buffer marginally while retaining emergency operational cushion for extra plate overruns.",
        approved: true
      }
    ],
    affectedTasks: [
      {
        taskId: "task-01",
        title: `Re-negotiate Catering for ${newReq.guestCount} Pax`,
        action: "modify",
        originalDueDate: "2026-11-05",
        newDueDate: "2026-11-04",
        rationale: "Urgent: Request re-quote based on higher volume and streamlined course count.",
        approved: true
      },
      {
        title: `Verify Lawn Capacity for ${newReq.guestCount} Guests`,
        action: "add",
        newDueDate: "2026-11-06",
        rationale: "Confirm that current 5,000 sq.ft lawn can comfortably accommodate 16 tables and wide buffet lanes.",
        approved: true
      }
    ],
    newRisks: [
      {
        description: `Buffet bottleneck during dinner rush with ${newReq.guestCount} attendees`,
        severity: "high",
        mitigation: "Mandate double-sided buffet stations to cut waiting queue times in half.",
        approved: true
      },
      {
        description: "Per-head food quality perceived lower due to budget compression",
        severity: "medium",
        mitigation: "Prioritize 2 standout hot live stations to create high-value sensory impact.",
        approved: true
      }
    ],
    tradeOffs: [
      `Per-plate catering allowance decreases by ~20%, requiring menu simplification.`,
      `Table decoration switches from fresh floral arrangements to ambient string lighting.`,
      `Crowd density at the lawn will be higher (+33%), requiring careful buffet lane management.`
    ],
    alternativeSolutions: [
      "Option A: High-tea & heavy appetizer format instead of full 4-course dinner.",
      "Option B: Stagger guest arrival times (family early at 6 PM, friends at 7:30 PM)."
    ],
    assumptionsAndUncertainties: [
      "Assumes The Tamara Greens lawn can accommodate extra 4 tables without fee increase.",
      "Assumes caterer agrees to volume discount at 160 pax."
    ],
    decisionsRequiringConfirmation: [
      "Do you approve shifting the catering format to high-volume live stations?",
      "Do you approve reducing entertainment from an acoustic duo to a solo artist?"
    ],
    isApplied: false,
    isSimulated: true
  };
  return res.json(proposal);
});
app.post("/api/gemini/vendor-analysis", async (req, res) => {
  const { quotes, category, eventRequirements } = req.body;
  if (!quotes || !quotes.length) {
    return res.status(400).json({ error: "Quotes array required" });
  }
  const prompt = `
You are the Vendor Intelligence Specialist for Festivo AI.
Analyze the following quotes for ${category} for event "${eventRequirements?.name || "Celebration"}" with ${eventRequirements?.guestCount || 100} guests:
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
      systemInstruction: "You are Festivo AI Vendor Specialist. Return pristine JSON analysis.",
      responseMimeType: "application/json",
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
          recommendation: { type: Type.STRING }
        },
        required: ["summary", "pros", "cons", "missingInfo", "hiddenCostsWarnings", "contractClarifications", "questionsToAsk", "recommendation"]
      }
    }
  });
  if (geminiResult) {
    try {
      const parsed = JSON.parse(geminiResult.text);
      return res.json({
        ...parsed,
        isSimulated: false,
        modelUsed: geminiResult.modelUsed
      });
    } catch (parseErr) {
      console.error("Error parsing JSON from Gemini vendor analysis:", parseErr);
    }
  }
  return res.json({
    summary: `Compared ${quotes.length} quotations for ${category}. Identified significant variances in included staff services, cleanup obligations, and payment milestones.`,
    pros: [
      `Option 1 is \u20B912,000 more economical and includes 2 live appetizer counters.`,
      `Option 2 provides all-inclusive compostable waste removal and organic produce.`
    ],
    cons: [
      `Option 1 excludes post-event garbage haulage which may incur a venue penalty.`,
      `Option 2 has a strict non-refundable advance within 21 days.`
    ],
    missingInfo: [
      "Exact waitstaff to guest ratio during peak service",
      "Whether separate preparation pans are used for special diets"
    ],
    hiddenCostsWarnings: [
      "5% GST may not be included in base per-plate pricing",
      "Overtime fee per hour if event extends past 10:30 PM"
    ],
    contractClarifications: [
      "Confirm whether guest count reconciliation happens upon entry or pre-event RSVP"
    ],
    questionsToAsk: [
      "Will you provide a dedicated supervisor on-site for the full duration?",
      "What is your exact backup plan if power cuts to the chafing heaters?"
    ],
    recommendation: "Negotiate with Vendor 1 to include waste disposal for an extra \u20B91,500; this keeps total cost lower than Vendor 2 while eliminating venue penalty risk.",
    isSimulated: true
  });
});
app.post("/api/gemini/copilot", async (req, res) => {
  const { messages, currentEvent, userQuery } = req.body;
  if (!currentEvent || !userQuery) {
    return res.status(400).json({ error: "Missing currentEvent or userQuery" });
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
- Priorities: ${reqs.priorities?.join(", ")}

Current Financials:
- Total Budget: ${reqs.currency} ${reqs.totalBudget}
- Allocated: ${reqs.currency} ${budgetCats.reduce((s, c) => s + c.allocatedAmount, 0)}
- Categories: ${budgetCats.map((c) => `${c.name}: ${c.allocatedAmount} (Locked: ${c.confirmedQuote > 0})`).join("; ")}

Current Tasks (${tasks.length}):
${tasks.slice(0, 8).map((t) => `- [${t.status}] ${t.title} (Due: ${t.dueDate})`).join("\n")}

Active Risks (${risks.length}):
${risks.map((r) => `- ${r.description} (Severity: ${r.severityScore}/9, Status: ${r.status})`).join("\n")}

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
      systemInstruction: "You are Festivo AI Copilot. Always reference real event figures with warmth and precision."
    }
  });
  if (geminiResult) {
    return res.json({
      content: geminiResult.text,
      isSimulated: false,
      modelUsed: geminiResult.modelUsed
    });
  }
  let answer = `I've analyzed **${reqs.name}** (${reqs.currency} ${reqs.totalBudget.toLocaleString()} for ${reqs.guestCount} guests).

`;
  const q = userQuery.toLowerCase();
  if (q.includes("reduce") || q.includes("save") || q.includes("cut") || q.includes("budget")) {
    answer += `To optimize spending without impacting guest enjoyment:
1. **Decoration:** Shift from full floral canopies to focal backdrops and fairy lights (potential savings: ~${reqs.currency} 8,000 - 10,000).
2. **Entertainment:** A solo acoustic performer or curated playlist instead of a multi-piece live band (potential savings: ~${reqs.currency} 4,000).
3. **Catering:** Streamline dessert courses to 1 signature item (saves ~\u20B940/plate).

You can run our **"What Changed?"** engine to model these exact trade-offs!`;
  } else if (q.includes("risk") || q.includes("weather") || q.includes("rain")) {
    answer += `Your top active risk is **weather disruption** (${risks[0]?.description || "November rain showers"}). Your mitigation strategy is to pre-wire the venue's covered verandah canopy so the live acoustic duo and buffet can relocate within 15 minutes if rain begins.`;
  } else if (q.includes("task") || q.includes("week") || q.includes("due") || q.includes("deadline")) {
    const nextTask = tasks.find((t) => t.status !== "completed");
    answer += `Your immediate top priority is **${nextTask?.title || "Vendor Tasting"}** (scheduled for ${nextTask?.dueDate || "next week"}). Would you like me to generate a checklist of questions to ask?`;
  } else {
    answer += `Based on your timeline for ${reqs.date}, your venue booking is confirmed with ${reqs.currency} 20,000 advance paid. Your next critical milestone is confirming caterer menus and tasting protocols. What specific area would you like to review?`;
  }
  return res.json({
    content: answer,
    isSimulated: true,
    modelUsed: "gemini-3.6-flash",
    fallbackReason: lastGeminiError || "Simulation fallback engaged"
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode");
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static build from dist");
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Festivo AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Fatal error starting server:", err);
  });
}
var server_default = app;
export {
  server_default as default
};
