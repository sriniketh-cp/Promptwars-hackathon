# Festivo AI — Intelligent Celebration & Event Planning Platform

> **Plan smarter. Celebrate better.**
> Built for Google for Developers' **PromptWars Challenge 05: Celebration & Event Planner**.

---

## 1. Problem Statement

Event planning is universally stressful, fragmented, and vulnerable to sudden real-world changes. Organizers struggle with:
1. **Unrealistic & Rigid Plans:** Generic planning checklists fail to adapt when real constraints change.
2. **The "Change Ripple Effect":** When budgets drop, guest counts expand, or dates move, planners must manually recalculate per-head costs, renegotiate vendor contracts, shift deadlines, and identify new risks across dozens of disconnected spreadsheets.
3. **Hidden Vendor Costs & Contract Traps:** Quotations often hide critical exclusions (waste disposal fees, power surcharges, overtime clauses, GST taxes).
4. **AI Hallucinations in Financial Calculations:** Generic AI chatbots frequently invent inconsistent numbers, propose mathematically impossible budgets, or silently overwrite established plans.

**Festivo AI** solves this with **Adaptive Event Intelligence**: a workspace pairing deterministic financial ledgers and date mathematics in application code with reasoning powered by **Gemini 3.8 Flash**.

---

## 2. Product Overview & Key Features

Festivo AI provides an end-to-end event planning workspace supporting birthdays, weddings, anniversaries, college festivals, corporate events, and community celebrations:

### 1. Dashboard
- Live event countdown timer.
- Total budget, planned allocations, verified vendor commitments, and remaining funds.
- Guest RSVP breakdown and expected attendance forecast.
- Priority milestones and high-severity risk indicators.
- Quick navigation to adaptive workflows.

### 2. AI Event Architect (Feature One)
- Multi-step event creation wizard with progressive disclosure.
- Generates structured event blueprints using server-side Gemini 3.8 Flash with structured JSON schemas (`responseMimeType: "application/json"`).
- Outputs theme rationale, venue selection profiles, catering considerations, timeline summaries, and cost-saving opportunities.
- Allows editing and regenerating individual sections without replacing the entire plan.

### 3. Intelligent Budget Optimizer (Feature Two)
- **Authoritative financial calculations in application code:** All addition, subtraction, percentages, and variance tracking are executed deterministically in TypeScript, never delegated to probabilistic LLMs.
- Distinguishes **fixed infrastructure costs** (venue deposit, equipment) from **variable per-guest costs** (catering per plate, favors).
- **Required Demo Workflow:** Demonstrates reducing an event budget from ₹2,00,000 to ₹1,50,000:
  - Application code calculates the exact ₹50,000 reduction (-25%).
  - Identifies flexible vs. locked categories.
  - Gemini analyzes trade-offs and suggests concrete substitutions.
  - User reviews and approves line items before changes are applied.

### 4. Adaptive Event Intelligence — "What Changed?" (Feature Three - Signature Feature)
- Models dynamic changes in guest count, budget, date, venue, or theme.
- **Example Scenario Tested:** 120 guests @ ₹2,00,000 → 160 guests @ ₹1,50,000 outdoor.
- Analyzes the inverse pressure of more guests with less money (per-head budget drops from ₹1,667 to ₹938, a reduction of -₹729/guest).
- Proposes structured adjustments: catering menu format shift, decor refocusing, task rescheduling, and crowd-density risk mitigation.
- **Revision Control & Restore:** Never silently overwrites plans. Stores immutable snapshots with reasons and timestamps, allowing instant one-click restoration.

### 5. Vendor Quotation Intelligence (Feature Four)
- Comprehensive quotation registry for caterers, venues, decorators, photographers, DJs, and florists.
- Side-by-side comparison of pricing, deposit terms, cancellation policies, and inclusion/exclusion lists.
- Gemini analysis identifies hidden cost traps (cleanup penalties, power generator exclusions, GST), missing staff ratios, and essential questions to ask before signing.

### 6. Guest Manager (Feature Five)
- Full RSVP tracking (Invited, Confirmed, Pending, Declined).
- Records dietary restrictions (Jain, Vegetarian, Gluten-Free) and accessibility needs (wheelchair access).
- Table and seating assignments.
- Import and Export using standard CSV.

### 7. Timeline & Task Milestones (Feature Six)
- Chronological milestone timeline with owner assignment and priority grouping.
- **Deterministic Date Shifting:** When event dates move, application code shifts all milestone deadlines by the exact day delta and flags overdue dependencies.

### 8. Risk Register & Contingency Advisor (Feature Seven)
- Threat register with deterministic severity scoring:
  $$\text{Severity} = \text{Likelihood (1--3)} \times \text{Impact (1--3)} = 1\text{ to }9$$
- Contextual mitigations and operational contingency plans for weather disruption, capacity bottlenecks, decibel curfews, and budget overruns.

### 9. Grounded AI Event Copilot (Feature Eight)
- Conversational assistant strictly grounded in the user's active event state (exact numbers, locked vendors, tasks, and risks).
- Suggests actionable next steps and generates one-click links to run adaptive proposals.

### 10. Blueprint Report & Export (Feature Nine)
- Complete executive summary exportable as JSON or formatted for clean, professional PDF printing (`window.print()`).

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4.
- **Backend:** Express full-stack server mounted with Vite middleware in development.
- **Generative AI:** `@google/genai` TypeScript SDK (`>= 2.25.0`) calling `gemini-3.8-flash` on the server side with `User-Agent: 'aistudio-build'`.
- **Icons:** Lucide React.
- **Typography:** Plus Jakarta Sans (SaaS display & navigation) paired with JetBrains Mono (monospace tabular figures for financial ledgers).
- **Persistence:** Local file-backed store (`/data/events.json`) synchronized with client-side cache for instant offline & page-refresh resilience.

---

## 4. Local Development

### Prerequisites
- Node.js 18+ (tested on Node 22)
- npm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run the test suite
npm test

# 3. Start development server
npm run dev
```
The server will start at `http://localhost:3000`.

---

## 5. Environment Variables

| Variable | Description | Runtime Injection |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | Automatically injected server-side via AI Studio Secrets |
| `PORT` | HTTP Server Port (default 3000) | Injected by host environment |
| `APP_URL` | Canonical hosting URL | Injected by Cloud Run runtime |

*Note: The application includes a high-fidelity, transparently labeled demo simulation mode that allows complete exploration even if no external API key is configured.*
