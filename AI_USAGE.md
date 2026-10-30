# Festivo AI — AI Usage & Responsibility Breakdown

This document provides a transparent accounting of responsibilities across the application, distinguishing work performed by Gemini, deterministic code, human decisions, and external libraries.

---

## 1. Matrix of Responsibilities

| Responsibility | Performed By | Verification Method |
| :--- | :--- | :--- |
| **Monetary Ledgers & Sums** | Deterministic TypeScript Code | Unit Tests in `tests/unit_tests.ts` |
| **₹50,000 Budget Reduction Math** | Deterministic TypeScript Code | Exact arithmetic ($200,000 - 150,000 = 50,000$) |
| **Fixed vs. Flexible Cost Classification** | Application Code & Schema | Explicit boolean `isFixedCost` & contract locks |
| **Date Delta Deadline Shifting** | Deterministic TypeScript Code | Calendar millisecond/day calculations |
| **Risk Severity Calculation** | Deterministic TypeScript Code | Formula: $\text{Likelihood (1--3)} \times \text{Impact (1--3)}$ |
| **Personalized Event Blueprint** | Gemini 3.8 Flash | Structured JSON schema validation |
| **Budget Reduction Trade-Offs** | Gemini 3.8 Flash | Natural language reasoning on compromises |
| **Adaptive "What Changed?" Ripple Analysis** | Gemini 3.8 Flash | Multi-variable cross-domain reasoning |
| **Vendor Contract Trap Detection** | Gemini 3.8 Flash | Semantic analysis of exclusions and terms |
| **Contextual Copilot Responses** | Gemini 3.8 Flash | Grounded strictly on active event state |
| **Approving or Rejecting Revisions** | Human User | Interactive checkboxes in proposal modals |
| **Committing Plan Changes** | Human User | Explicit "Apply Selected Changes" button |
| **Restoring Previous Snapshots** | Human User | Click "Restore" on historical snapshots |

---

## 2. Hallucination Mitigation Rules

1. **No Probabilistic Arithmetic:** Gemini is never prompted to compute sums, remaining balances, or percentage allocations. All numbers displayed in the financial ledger come directly from `calculations.ts`.
2. **Transparent Simulation Tagging:** If live inference is unavailable or running in offline mode, outputs are clearly labeled with a visible amber badge: `"Demo Simulation"`. Responses are never disguised as live Gemini output.
3. **No Phantom Edits:** When Gemini's Copilot suggests a change, it produces a proposal for user approval. It is architecturally impossible for the model to mutate persistent storage without explicit user confirmation.
4. **Zero Vendor Fabrication:** Availability notes and contact details are explicitly flagged as manually entered or user-supplied rather than verified real-time bookings.
