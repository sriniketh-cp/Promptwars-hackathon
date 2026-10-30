# Festivo AI — Prompt Engineering & Flow Architecture

This document documents the prompt flows, structured schemas, model parameters, and safety boundaries used across Festivo AI's Gemini integration.

---

## 1. Overview of AI Workflows

Festivo AI implements separate, single-responsibility prompt workflows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Festivo AI Prompt Pipelines                           │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Event Blueprint Generator  │ Normalizes user inputs into 13-part blueprint│
│ 2. Budget Adaptation Engine   │ Explains trade-offs of budget reductions    │
│ 3. "What Changed?" Engine     │ Signature multi-variable impact proposal    │
│ 4. Vendor Quote Specialist    │ Exposes hidden costs and contract traps     │
│ 5. Grounded Event Copilot     │ Conversational assistant bound to event data│
└───────────────────────────────┴─────────────────────────────────────────────┘
```

All generation uses **`gemini-3.8-flash`** via the modern `@google/genai` TypeScript SDK on the server tier.

---

## 2. Prompt Flow 1: Event Blueprint Generation

### Endpoint: `POST /api/gemini/generate-blueprint`
- **Goal:** Transform required essentials (Name, Type, Date, City, Guests, Budget) and optional preferences into a structured celebration architecture.
- **Input Context:** Event requirements, city context, dietary rules, outdoor vs indoor constraints, priorities.
- **System Instruction:** `"You are Festivo AI Architect, generating pristine JSON celebration plans."`
- **Output Schema:** Enforced via `responseMimeType: "application/json"` and `responseSchema`:
  - `blueprint`: Summary, theme rationale, venue characteristics, budget rationale, catering considerations, vendor requirements, timeline summary, contingency plans, cost-saving opportunities, assumptions.
  - `budgetCategories`: Array of name, allocatedAmount, notes, isFixedCost.
  - `tasks`: Actionable milestones with priority and deadlines.
  - `risks`: Contextual threat assessment with mitigation and contingency plans.

---

## 3. Prompt Flow 2: Budget Adaptation & Trade-Offs

### Endpoint: `POST /api/gemini/budget-adaptation`
- **Goal:** Analyze budget reductions (such as the required ₹2,00,000 → ₹1,50,000 demonstration).
- **Hybrid Pattern:**
  1. TypeScript code first computes the authoritative reduction:
     $$\Delta = \text{Current} - \text{Target} = ₹50,000$$
  2. Fixed categories (Venue rental, locked quotes) are marked locked.
  3. Flexible categories are allocated weighted reductions.
  4. Gemini receives the deterministic mathematical cut and generates realistic trade-off explanations, menu compromises (e.g. comfort food stations over multi-course plated dining), and vendor negotiation tactics.

---

## 4. Prompt Flow 3: Adaptive Event Intelligence ("What Changed?")

### Endpoint: `POST /api/gemini/adaptive-intelligence`
- **Goal:** The signature feature analyzing simultaneous requirement changes (e.g., 120 guests @ ₹2,00,000 → 160 guests @ ₹1,70,000 outdoor).
- **Prompt Structure:**
  - Original Plan: Requirements, Budget categories, Current Tasks.
  - Updated Plan: New guest count, budget, date, venue.
  - User's stated reason.
- **Directives:**
  - Explicitly identify the per-head budget compression ($₹1,667 \rightarrow ₹1,063$).
  - Distinguish fixed infrastructure from variable food/plate/seating costs.
  - Flag operational bottlenecks (buffet congestion with 160 guests on a lawn).
  - Return actionable items with boolean approval flags so the user can accept or reject individual recommendations.

---

## 5. Prompt Flow 4: Vendor Quotation Intelligence

### Endpoint: `POST /api/gemini/vendor-analysis`
- **Goal:** Side-by-side comparison of competing vendor quotes.
- **Directives:**
  - Examine included vs. excluded services.
  - Flag common industry omissions (post-event garbage clearance, overtime charges past 11 PM, power generator fuel).
  - Formulate sharp questions the client must ask before signing.
  - Recommend the optimal contract strategy without fabricating vendor details.

---

## 6. Prompt Flow 5: Grounded Event Copilot

### Endpoint: `POST /api/gemini/copilot`
- **Goal:** Conversational advice anchored strictly to the active event state.
- **Grounding Rules:**
  - Prompt dynamically injects the active event's exact financials, locked vendor contracts, tasks due, and active risks.
  - Forbids inventing conflicting dates or budgets.
  - If a change is recommended, formats it as a suggestion for user confirmation rather than claiming the plan has been edited.
