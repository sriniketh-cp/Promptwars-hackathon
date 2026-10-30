/**
 * Festivo AI - Client API Service
 * Clean typed abstractions for communicating with server-side endpoints.
 */

import {
  FestivoEvent,
  EventRequirements,
  VendorQuotation,
  CopilotMessage,
  PlanRevisionProposal,
} from '../types';
import { SAMPLE_BIRTHDAY_EVENT } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'festivo_ai_events_cache';

export const api = {
  // Check health and server AI model availability
  async getHealth(): Promise<{ status: string; hasApiKey: boolean; model: string }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false, model: 'demo-mode' };
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
    const res = await fetch('/api/gemini/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requirements),
    });
    if (!res.ok) {
      throw new Error('Failed to generate event blueprint');
    }
    return await res.json();
  },

  // Gemini AI Budget Adaptation
  async adaptBudget(event: FestivoEvent, targetBudget: number, priorityNotes: string) {
    const res = await fetch('/api/gemini/budget-adaptation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, targetBudget, priorityNotes }),
    });
    if (!res.ok) {
      throw new Error('Failed to calculate budget adaptation');
    }
    return await res.json();
  },

  // Gemini AI Adaptive Intelligence ("What Changed?")
  async runAdaptiveIntelligence(
    currentEvent: FestivoEvent,
    updatedRequirements: Partial<EventRequirements>,
    triggerReason: string
  ): Promise<PlanRevisionProposal> {
    const res = await fetch('/api/gemini/adaptive-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentEvent, updatedRequirements, triggerReason }),
    });
    if (!res.ok) {
      throw new Error('Failed to run adaptive intelligence analysis');
    }
    return await res.json();
  },

  // Gemini AI Vendor Quotes Analysis
  async analyzeVendorQuotes(
    quotes: VendorQuotation[],
    category: string,
    eventRequirements: EventRequirements
  ) {
    const res = await fetch('/api/gemini/vendor-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotes, category, eventRequirements }),
    });
    if (!res.ok) {
      throw new Error('Failed to analyze vendor quotations');
    }
    return await res.json();
  },

  // Gemini AI Copilot
  async askCopilot(messages: CopilotMessage[], currentEvent: FestivoEvent, userQuery: string) {
    const res = await fetch('/api/gemini/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, currentEvent, userQuery }),
    });
    if (!res.ok) {
      throw new Error('Failed to reach AI Event Copilot');
    }
    return await res.json();
  },
};
