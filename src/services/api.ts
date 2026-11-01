/**
 * Festivo AI - Client API Service
 * Clean typed abstractions for communicating with server-side endpoints.
 * Integrates directly with aiActivityTracker to expose real operations, inputs, models, and responses.
 */

import {
  FestivoEvent,
  EventRequirements,
  VendorQuotation,
  CopilotMessage,
  PlanRevisionProposal,
} from '../types';
import { SAMPLE_BIRTHDAY_EVENT } from '../data/initialData';
import { aiActivityTracker } from './aiActivityTracker';

const LOCAL_STORAGE_KEY = 'festivo_ai_events_cache';

export const api = {
  // Check health and server AI model availability
  async getHealth(): Promise<{
    status: string;
    hasApiKey: boolean;
    apiKeyConfigured?: boolean;
    apiKeyPrefix?: string;
    model: string;
  }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false, model: 'gemini-3.8-flash' };
    }
  },

  // Get all events
  async getEvents(): Promise<FestivoEvent[]> {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const events = await res.json();
        if (Array.isArray(events) && events.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
          return events;
        }
      }
    } catch (e) {
      console.warn('Network call failed, loading from local cache:', e);
    }

    // Fallback to local storage or initial demo event
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Error reading localStorage:', err);
    }

    return [SAMPLE_BIRTHDAY_EVENT];
  },

  // Save new event
  async createEvent(event: FestivoEvent): Promise<FestivoEvent> {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Network call failed, saving to local cache:', e);
    }

    // Save to local cache
    const existing = await this.getEvents();
    const updated = [...existing, event];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return event;
  },

  // Update event
  async updateEvent(id: string, event: Partial<FestivoEvent>): Promise<FestivoEvent> {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Network call failed, updating local cache:', e);
    }

    const existing = await this.getEvents();
    const idx = existing.findIndex((e) => e.requirements.id === id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...event } as FestivoEvent;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
      return existing[idx];
    }
    return event as FestivoEvent;
  },

  // Delete event
  async deleteEvent(id: string): Promise<boolean> {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Network call failed on delete:', e);
    }
    const existing = await this.getEvents();
    const filtered = existing.filter((e) => e.requirements.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // Reset demo event
  async resetDemoEvent(id: string): Promise<FestivoEvent> {
    try {
      const res = await fetch(`/api/events/${id}/reset-demo`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Reset demo network failed:', e);
    }
    const existing = await this.getEvents();
    const filtered = existing.filter((e) => e.requirements.id !== SAMPLE_BIRTHDAY_EVENT.requirements.id);
    const updated = [SAMPLE_BIRTHDAY_EVENT, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return SAMPLE_BIRTHDAY_EVENT;
  },

  // Gemini AI Blueprint generation
  async generateBlueprint(requirements: EventRequirements) {
    const startTime = performance.now();
    const logId = aiActivityTracker.logStart({
      operation: 'Event Blueprint Generation',
      endpoint: '/api/gemini/generate-blueprint',
      model: 'gemini-3.8-flash',
      input: {
        eventName: requirements.name,
        type: requirements.type,
        guestCount: requirements.guestCount,
        totalBudget: requirements.totalBudget,
        currency: requirements.currency,
        city: requirements.city,
        date: requirements.date,
        theme: requirements.theme,
        priorities: requirements.priorities,
      },
    });

    try {
      const res = await fetch('/api/gemini/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requirements),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Blueprint generation failed');
        throw new Error(errorText || 'Failed to generate event blueprint');
      }

      const data = await res.json();
      aiActivityTracker.logSuccess({
        id: logId,
        response: data,
        isSimulated: data.blueprint?.isSimulated || data.isSimulated,
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        latencyMs,
      });

      return data;
    } catch (error: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      aiActivityTracker.logError({ id: logId, error, latencyMs });
      throw error;
    }
  },

  // Gemini AI Budget Adaptation
  async adaptBudget(event: FestivoEvent, targetBudget: number, priorityNotes: string) {
    const startTime = performance.now();
    const logId = aiActivityTracker.logStart({
      operation: 'Budget Adaptation & Proportional Allocation',
      endpoint: '/api/gemini/budget-adaptation',
      model: 'gemini-3.8-flash',
      input: {
        eventName: event.requirements.name,
        currentBudget: event.requirements.totalBudget,
        targetBudget,
        currency: event.requirements.currency,
        fixedCategoriesCount: (event.budgetCategories || []).filter((c) => c.isFixedCost || c.confirmedQuote > 0).length,
        flexibleCategoriesCount: (event.budgetCategories || []).filter((c) => !c.isFixedCost && c.confirmedQuote === 0).length,
        priorityNotes,
      },
    });

    try {
      const res = await fetch('/api/gemini/budget-adaptation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, targetBudget, priorityNotes }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error('Failed to calculate budget adaptation');
      }

      const data = await res.json();
      aiActivityTracker.logSuccess({
        id: logId,
        response: data,
        isSimulated: data.isSimulated,
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        latencyMs,
      });

      return data;
    } catch (error: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      aiActivityTracker.logError({ id: logId, error, latencyMs });
      throw error;
    }
  },

  // Gemini AI Adaptive Intelligence ("What Changed?")
  async runAdaptiveIntelligence(
    currentEvent: FestivoEvent,
    updatedRequirements: Partial<EventRequirements>,
    triggerReason: string
  ): Promise<PlanRevisionProposal> {
    const startTime = performance.now();
    const origReq = currentEvent.requirements;
    const newGuests = updatedRequirements.guestCount ?? origReq.guestCount;
    const newBudget = updatedRequirements.totalBudget ?? origReq.totalBudget;

    const logId = aiActivityTracker.logStart({
      operation: 'Adaptive Intelligence ("What Changed?")',
      endpoint: '/api/gemini/adaptive-intelligence',
      model: 'gemini-3.8-flash',
      input: {
        eventName: origReq.name,
        originalGuests: origReq.guestCount,
        newGuests,
        guestDelta: newGuests - origReq.guestCount,
        originalBudget: `${origReq.currency} ${origReq.totalBudget.toLocaleString()}`,
        newBudget: `${origReq.currency} ${newBudget.toLocaleString()}`,
        budgetDelta: `${origReq.currency} ${(newBudget - origReq.totalBudget).toLocaleString()}`,
        originalPerGuest: `${origReq.currency} ${Math.round(origReq.totalBudget / origReq.guestCount)}`,
        newPerGuest: `${origReq.currency} ${Math.round(newBudget / newGuests)}`,
        triggerReason,
        activeTasksCount: (currentEvent.tasks || []).length,
        budgetCategoriesCount: (currentEvent.budgetCategories || []).length,
      },
    });

    try {
      const res = await fetch('/api/gemini/adaptive-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEvent, updatedRequirements, triggerReason }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error('Failed to run adaptive intelligence analysis');
      }

      const data = await res.json();
      aiActivityTracker.logSuccess({
        id: logId,
        response: data,
        isSimulated: data.isSimulated,
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        latencyMs,
      });

      return data;
    } catch (error: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      aiActivityTracker.logError({ id: logId, error, latencyMs });
      throw error;
    }
  },

  // Gemini AI Vendor Quotes Analysis
  async analyzeVendorQuotes(
    quotes: VendorQuotation[],
    category: string,
    eventRequirements: EventRequirements
  ) {
    const startTime = performance.now();
    const logId = aiActivityTracker.logStart({
      operation: 'Vendor Quotation Intelligence',
      endpoint: '/api/gemini/vendor-analysis',
      model: 'gemini-3.8-flash',
      input: {
        category,
        quotesAnalyzed: quotes.map((q) => ({
          vendorName: q.vendorName,
          quotedPrice: q.quotedPrice,
          servicesCount: q.includedServices?.length || 0,
        })),
        eventGuestCount: eventRequirements.guestCount,
        eventBudget: eventRequirements.totalBudget,
      },
    });

    try {
      const res = await fetch('/api/gemini/vendor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes, category, eventRequirements }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error('Failed to analyze vendor quotations');
      }

      const data = await res.json();
      aiActivityTracker.logSuccess({
        id: logId,
        response: data,
        isSimulated: data.isSimulated,
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        latencyMs,
      });

      return data;
    } catch (error: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      aiActivityTracker.logError({ id: logId, error, latencyMs });
      throw error;
    }
  },

  // Gemini AI Copilot
  async askCopilot(messages: CopilotMessage[], currentEvent: FestivoEvent, userQuery: string) {
    const startTime = performance.now();
    const logId = aiActivityTracker.logStart({
      operation: 'AI Event Copilot',
      endpoint: '/api/gemini/copilot',
      model: 'gemini-3.8-flash',
      input: {
        userQuery,
        conversationHistoryCount: messages.length,
        activeEventName: currentEvent.requirements.name,
        guestCount: currentEvent.requirements.guestCount,
        budget: currentEvent.requirements.totalBudget,
      },
    });

    try {
      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, currentEvent, userQuery }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error('Failed to reach AI Event Copilot');
      }

      const data = await res.json();
      aiActivityTracker.logSuccess({
        id: logId,
        response: data,
        isSimulated: data.isSimulated,
        modelUsed: data.modelUsed || 'gemini-3.8-flash',
        latencyMs,
      });

      return data;
    } catch (error: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      aiActivityTracker.logError({ id: logId, error, latencyMs });
      throw error;
    }
  },
};
