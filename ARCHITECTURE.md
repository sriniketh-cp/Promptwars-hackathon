# Festivo AI — Architecture & Systems Design

This document details the architectural boundaries, data flow, and separation of concerns between client components, server endpoints, persistence mechanisms, and the Gemini AI model.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client Tier)                             │
│                                                                             │
│  React 19 SPA + Tailwind CSS v4 + TypeScript                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Components:                                                           │  │
│  │  - DashboardView         - AdaptiveIntelligenceView ("What changed?") │  │
│  │  - EventArchitectView    - VendorCoordinationView                     │  │
│  │  - BudgetOptimizerView   - TimelineTasksView / RiskAdvisorView        │  │
│  │  - GuestManagerView      - ReportsExportView / CopilotView            │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │ Calls /api/*                          │
│                                     ▼                                       │
│                         Typed Client API (api.ts)                           │
│                     (with local cache synchronization)                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ HTTP REST JSON
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER TIER (Node.js)                             │
│                                                                             │
│  Express 4 Full-Stack Server (server.ts) on Port 3000                       │
│  - Vite Middlewares (Dev) / Static Dist Handler (Prod)                     │
│  - REST Endpoints (/api/events, /api/gemini/*)                              │
│                                                                             │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │  Authoritative Financial Engine│    │  Server-Side Gemini Integration │  │
│  │  (TypeScript Code)            │    │  (@google/genai SDK)            │  │
│  │  - Variance calculations      │    │  - User-Agent: aistudio-build   │  │
│  │  - Fixed vs Flexible cuts     │    │  - Structured JSON schemas      │  │
│  │  - Day delta date shifts      │    │  - Model: gemini-3.8-flash      │  │
│  └──────────────┬────────────────┘     └────────────────┬────────────────┘  │
│                 │                                       │                   │
│                 ▼                                       ▼                   │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │  Local File Store             │     │  Google Gemini API              │  │
│  │  /data/events.json            │     │  (HTTPS with GEMINI_API_KEY)    │  │
│  └───────────────────────────────┘     └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Separation of Concerns: Deterministic Code vs. AI

A foundational architectural requirement of Festivo AI is the strict division of labor:

| Capability | Execution Engine | Rationale |
| :--- | :--- | :--- |
| **Summing Category Allocations** | TypeScript Code (`calculations.ts`) | Absolute precision; zero tolerance for LLM addition errors. |
| **Calculating ₹50,000 Budget Reduction** | TypeScript Code (`calculateBudgetReduction`) | Deterministic arithmetic: Target – Current. |
| **Fixed vs. Flexible Cost Classification** | Application Schema & Rules | Categorizes contracts, confirmed quotes, and venue deposits as locked. |
| **Proposing Creative Substitutions & Trade-offs** | Gemini 3.8 Flash (`/api/gemini/budget-adaptation`) | Natural language reasoning, culinary knowledge, local vendor culture. |
| **Evaluating "What Changed?" Ripple Effects** | Gemini 3.8 Flash (`/api/gemini/adaptive-intelligence`) | Multi-variable impact modeling across guests, seating, catering, and venue. |
| **Task Deadline Day Shifting** | TypeScript Code (`shiftTaskDeadlines`) | Exact millisecond/day delta math when event date changes. |
| **Risk Severity Matrix** | TypeScript Code (`calculateRiskSeverity`) | Formula: $\text{Likelihood} \times \text{Impact} = 1\text{ to }9$. |
| **Detecting Vendor Hidden Costs & Omissions** | Gemini 3.8 Flash (`/api/gemini/vendor-analysis`) | Semantic reading of inclusions/exclusions to identify missing garbage fees, GST, staff ratios. |

---

## 3. Data Persistence Model

Data is persisted on the server file system in `/data/events.json`.
1. **Survivability:** Survives page reloads, browser closures, and hot restarts.
2. **Client Synchronized Cache:** `api.ts` maintains a cached copy in `localStorage` ensuring instant zero-latency rendering upon initial mount.
3. **Immutable Revision History:** Every approved proposal stores a full snapshot of the previous state in the `event.revisions` array with timestamp and trigger reason, enabling instant rollback.

---

## 4. Security & API Key Protection

1. **Server-Only Secret Handling:** `GEMINI_API_KEY` is loaded exclusively inside `server.ts` via `process.env.GEMINI_API_KEY`.
2. **Zero Browser Exposure:** The client bundle never imports `@google/genai` or references `process.env`.
3. **User-Agent Telemetry:** The Gemini client is configured with `User-Agent: 'aistudio-build'` as mandated by AI Studio guidelines.
4. **Privacy-Preserving AI Context:** Personal contact details (guest phone numbers, emails) are filtered and never sent to Gemini prompts.
