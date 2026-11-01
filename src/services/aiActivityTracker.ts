/**
 * Festivo AI - Centralized Live AI Activity Tracker
 * Records real Gemini API operations, configured models, user inputs, and structured responses.
 * Never stores or exposes secrets, tokens, or auth headers.
 */

export interface AIActivityItem {
  id: string;
  operation: string; // e.g. 'Adaptive Intelligence ("What Changed?")'
  endpoint: string; // e.g. '/api/gemini/adaptive-intelligence'
  model: string; // e.g. 'gemini-3.6-flash'
  status: 'loading' | 'success' | 'error';
  timestamp: string;
  latencyMs?: number;
  input: Record<string, any>;
  response?: Record<string, any> | string;
  isSimulated?: boolean;
  errorMessage?: string;
}

const STORAGE_KEY = 'festivo_ai_activity_logs_v1';

class AIActivityTracker {
  private activities: AIActivityItem[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.activities = JSON.parse(saved);
      }
    } catch {
      this.activities = [];
    }
  }

  private saveToStorage() {
    try {
      // Keep most recent 50 activities
      const trimmed = this.activities.slice(0, 50);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage quota errors
    }
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('AIActivity listener error:', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getActivities(): AIActivityItem[] {
    return [...this.activities];
  }

  public getLatestActivity(): AIActivityItem | null {
    return this.activities[0] || null;
  }

  public getActiveCount(): number {
    return this.activities.filter((a) => a.status === 'loading').length;
  }

  public logStart(params: {
    operation: string;
    endpoint: string;
    input: Record<string, any>;
    model?: string;
  }): string {
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    // Sanitize input (remove any potential secret fields)
    const sanitizedInput = this.sanitizeData(params.input);

    const newItem: AIActivityItem = {
      id,
      operation: params.operation,
      endpoint: params.endpoint,
      model: params.model || 'gemini-3.6-flash',
      status: 'loading',
      timestamp: timeFormatted,
      input: sanitizedInput,
    };

    this.activities.unshift(newItem);
    this.notify();
    return id;
  }

  public logSuccess(params: {
    id: string;
    response: any;
    isSimulated?: boolean;
    modelUsed?: string;
    latencyMs?: number;
  }) {
    const item = this.activities.find((a) => a.id === params.id);
    if (!item) return;

    item.status = 'success';
    item.response = this.sanitizeData(params.response);
    item.isSimulated = !!params.isSimulated;
    if (params.modelUsed) item.model = params.modelUsed;
    if (params.latencyMs !== undefined) item.latencyMs = params.latencyMs;

    this.notify();
  }

  public logError(params: { id: string; error: any; latencyMs?: number }) {
    const item = this.activities.find((a) => a.id === params.id);
    if (!item) return;

    item.status = 'error';
    item.errorMessage = params.error?.message || String(params.error);
    if (params.latencyMs !== undefined) item.latencyMs = params.latencyMs;

    this.notify();
  }

  public clearActivities() {
    this.activities = [];
    this.notify();
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    try {
      const str = JSON.stringify(data, (key, value) => {
        // Redact any sensitive tokens, secrets, or keys
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('key') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('password') ||
          lowerKey.includes('auth')
        ) {
          return '[REDACTED_FOR_SECURITY]';
        }
        return value;
      });
      return JSON.parse(str);
    } catch {
      return { summary: 'Non-serializable payload' };
    }
  }
}

export const aiActivityTracker = new AIActivityTracker();

