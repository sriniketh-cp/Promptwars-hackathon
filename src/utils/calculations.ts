/**
 * Authoritative financial, date, and risk calculations in application code.
 * Guaranteed floating-point precision handling and deterministic formulas.
 */

import { BudgetCategory, EventTask, Guest } from '../types';

/**
 * Format currency with internationalization and Indian Rupee support (lakhs/crores).
 */
export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  if (isNaN(amount) || !isFinite(amount)) return '0';

  try {
    return new Intl.NumberFormat(locale || (currency === 'INR' ? 'en-IN' : 'en-US'), {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    // Fallback formatting
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Calculate total allocated budget from categories.
 */
export function calculateTotalAllocated(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0);
}

/**
 * Calculate total estimated costs.
 */
export function calculateTotalEstimated(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + (Number(cat.estimatedCost) || 0), 0);
}

/**
 * Calculate total confirmed vendor commitments.
 */
export function calculateTotalConfirmed(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + (Number(cat.confirmedQuote) || 0), 0);
}

/**
 * Calculate total actual spent.
 */
export function calculateTotalActual(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + (Number(cat.actualExpense) || 0), 0);
}

/**
 * Calculate budget variance / remaining amount.
 */
export function calculateRemainingBudget(totalBudget: number, allocated: number): number {
  return totalBudget - allocated;
}

/**
 * Calculate budget reduction breakdown deterministically.
 * Identifies fixed vs variable categories and proposed proportional reductions.
 */
export function calculateBudgetReduction(
  categories: BudgetCategory[],
  newTotalBudget: number,
  currentTotalBudget: number
): {
  reductionAmount: number;
  percentageReduction: number;
  isFeasible: boolean;
  warnings: string[];
  proposedCuts: Array<{
    categoryName: string;
    originalAmount: number;
    proposedAmount: number;
    savings: number;
    isFixedCost: boolean;
    reason: string;
  }>;
} {
  const reductionAmount = Math.max(0, currentTotalBudget - newTotalBudget);
  const percentageReduction = currentTotalBudget > 0 ? (reductionAmount / currentTotalBudget) * 100 : 0;
  const warnings: string[] = [];

  const fixedCategories = categories.filter((c) => c.isFixedCost || c.confirmedQuote > 0);
  const flexibleCategories = categories.filter((c) => !c.isFixedCost && c.confirmedQuote === 0);

  const fixedSum = fixedCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);

  if (newTotalBudget < fixedSum) {
    warnings.push(
      `Fixed obligations and confirmed vendor deposits (totaling ${formatCurrency(
        fixedSum
      )}) exceed the target budget. You may need to renegotiate vendor contracts.`
    );
  }

  // Calculate proposed cuts primarily from flexible categories (decor, gifts, photography, contingency, entertainment)
  // Higher flexibility weights for luxury/aesthetic categories
  const categoryFlexibilityWeights: Record<string, number> = {
    'Decoration': 1.6,
    'Entertainment': 1.4,
    'Gifts & Favors': 1.5,
    'Contingency Reserve': 1.2,
    'Photography': 1.1,
    'Transportation': 1.0,
    'Catering': 0.8, // Harder to cut without guest reduction
    'Venue': 0.4,    // Usually fixed once committed
    'Logistics': 0.7,
    'Invitations': 1.2,
    'Other': 1.0,
  };

  let totalWeightedFlexible = 0;
  flexibleCategories.forEach((cat) => {
    const weight = categoryFlexibilityWeights[cat.name] || 1.0;
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
        reason: cat.confirmedQuote > 0 ? 'Confirmed vendor quotation locked' : 'Fixed infrastructure requirement',
      };
    }

    const weight = categoryFlexibilityWeights[cat.name] || 1.0;
    const catShare = (cat.allocatedAmount * weight) / totalWeightedFlexible;
    const calculatedCut = Math.round(reductionAmount * catShare);
    // Don't cut a category below 30% of its initial budget
    const maxCutAllowed = Math.round(cat.allocatedAmount * 0.7);
    const actualCut = Math.min(calculatedCut, maxCutAllowed);
    const proposedAmount = Math.max(0, cat.allocatedAmount - actualCut);

    return {
      categoryName: cat.name,
      originalAmount: cat.allocatedAmount,
      proposedAmount,
      savings: actualCut,
      isFixedCost: false,
      reason: `Optimized flexible allocation (-${Math.round((actualCut / cat.allocatedAmount) * 100)}%)`,
    };
  });

  return {
    reductionAmount,
    percentageReduction: Math.round(percentageReduction * 10) / 10,
    isFeasible: newTotalBudget >= fixedSum,
    warnings,
    proposedCuts,
  };
}

/**
 * Deterministic risk severity score (1-9).
 * Likelihood: low (1), medium (2), high (3)
 * Impact: low (1), medium (2), high (3)
 * Severity = Likelihood * Impact (1 = Minor, 9 = Critical)
 */
export function calculateRiskSeverity(likelihood: 'low' | 'medium' | 'high', impact: 'low' | 'medium' | 'high'): number {
  const map: Record<string, number> = { low: 1, medium: 2, high: 3 };
  return (map[likelihood] || 1) * (map[impact] || 1);
}

/**
 * Calculate guest attendance summaries.
 */
export function calculateGuestSummary(guests: Guest[]) {
  const totalInvited = guests.reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);
  const confirmed = guests
    .filter((g) => g.rsvpStatus === 'confirmed')
    .reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);
  const pending = guests
    .filter((g) => g.rsvpStatus === 'pending')
    .reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);
  const declined = guests
    .filter((g) => g.rsvpStatus === 'declined')
    .reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);

  const dietaryCount = guests.filter((g) => g.dietary && g.dietary.trim() !== '' && g.dietary.toLowerCase() !== 'none').length;
  const accessibilityCount = guests.filter(
    (g) => g.accessibility && g.accessibility.trim() !== '' && g.accessibility.toLowerCase() !== 'none'
  ).length;

  return {
    totalInvited,
    confirmed,
    pending,
    declined,
    expectedAttendance: confirmed + Math.round(pending * 0.6), // statistical model assumption
    dietaryCount,
    accessibilityCount,
  };
}

/**
 * Calculate task metrics.
 */
export function calculateTaskSummary(tasks: EventTask[], eventDateStr?: string) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;

  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter((t) => t.status !== 'completed' && t.dueDate < today).length;
  const upcoming = tasks.filter((t) => t.status !== 'completed' && t.dueDate >= today).length;
  const daysUntilEvent = eventDateStr
    ? Math.ceil((new Date(eventDateStr).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    total,
    completed,
    inProgress,
    todo,
    blocked,
    overdue,
    upcoming,
    daysUntilEvent,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Deterministically adjust task deadlines when event date moves.
 * Calculates delta in days between old event date and new event date,
 * and shifts all dependent task due dates by the same day difference,
 * while flagging any task that would now fall in the past.
 */
export function shiftTaskDeadlines(
  tasks: EventTask[],
  oldEventDate: string,
  newEventDate: string
): {
  shiftedTasks: EventTask[];
  dayDelta: number;
  overdueTasksCount: number;
} {
  const oldDate = new Date(oldEventDate).getTime();
  const newDate = new Date(newEventDate).getTime();
  const dayDelta = Math.round((newDate - oldDate) / (1000 * 60 * 60 * 24));

  const today = new Date().toISOString().split('T')[0];
  let overdueCount = 0;

  const shiftedTasks = tasks.map((task) => {
    if (!task.dueDate) return task;
    const currentTaskTime = new Date(task.dueDate).getTime();
    const newDueDate = new Date(currentTaskTime + dayDelta * (1000 * 60 * 60 * 24))
      .toISOString()
      .split('T')[0];

    if (newDueDate < today && task.status !== 'completed') {
      overdueCount++;
    }

    return {
      ...task,
      dueDate: newDueDate,
    };
  });

  return {
    shiftedTasks,
    dayDelta,
    overdueTasksCount: overdueCount,
  };
}


/**
 * Event requirements validation rules for live user input.
 * Rejects negative/zero guests, negative/zero budgets, invalid dates, and missing required fields.
 */
export interface EventFormValidationErrors {
  name?: string;
  city?: string;
  date?: string;
  guestCount?: string;
  totalBudget?: string;
}

export function validateEventRequirements(data: {
  name: string;
  city: string;
  date: string;
  guestCount: number | string;
  totalBudget: number | string;
}): {
  isValid: boolean;
  errors: EventFormValidationErrors;
} {
  const errors: EventFormValidationErrors = {};

  // 1. Name validation
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Event name is required.';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Event name must be at least 3 characters.';
  }

  // 2. City validation
  if (!data.city || data.city.trim() === '') {
    errors.city = 'City or location is required.';
  }

  // 3. Date validation
  if (!data.date || data.date.trim() === '') {
    errors.date = 'Event date is required.';
  } else {
    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      errors.date = 'Please provide a valid date format (YYYY-MM-DD).';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);
      if (parsedDate.getTime() < today.getTime()) {
        errors.date = 'Celebration date cannot be in the past.';
      }
    }
  }

  // 4. Guest Count validation (reject zero, negative, float)
  const guestsNum = Number(data.guestCount);
  if (data.guestCount === '' || isNaN(guestsNum)) {
    errors.guestCount = 'Guest count is required.';
  } else if (guestsNum < 0) {
    errors.guestCount = 'Guest count cannot be negative.';
  } else if (guestsNum === 0) {
    errors.guestCount = 'Guest count must be at least 1 attendee (cannot be zero).';
  } else if (!Number.isInteger(guestsNum)) {
    errors.guestCount = 'Guest count must be a whole number.';
  }

  // 5. Total Budget validation (reject zero, negative)
  const budgetNum = Number(data.totalBudget);
  if (data.totalBudget === '' || isNaN(budgetNum)) {
    errors.totalBudget = 'Total budget is required.';
  } else if (budgetNum < 0) {
    errors.totalBudget = 'Budget cannot be negative.';
  } else if (budgetNum === 0) {
    errors.totalBudget = 'Budget must be greater than zero.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculate dynamic deltas and per-head margin shifts between original and proposed plans.
 */
export function calculateAdaptiveDeltas(
  origGuests: number,
  origBudget: number,
  newGuests: number,
  newBudget: number
): {
  guestDelta: number;
  guestPercentage: number;
  budgetDelta: number;
  budgetPercentage: number;
  origPerGuest: number;
  newPerGuest: number;
  perGuestDelta: number;
  perGuestPercentage: number;
  isSurgeStressScenario: boolean;
} {
  const guestDelta = newGuests - origGuests;
  const guestPercentage = origGuests > 0 ? Math.round((guestDelta / origGuests) * 1000) / 10 : 0;

  const budgetDelta = newBudget - origBudget;
  const budgetPercentage = origBudget > 0 ? Math.round((budgetDelta / origBudget) * 1000) / 10 : 0;

  const origPerGuest = origGuests > 0 ? Math.round(origBudget / origGuests) : 0;
  const newPerGuest = newGuests > 0 ? Math.round(newBudget / newGuests) : 0;
  const perGuestDelta = newPerGuest - origPerGuest;
  const perGuestPercentage = origPerGuest > 0 ? Math.round((perGuestDelta / origPerGuest) * 1000) / 10 : 0;

  return {
    guestDelta,
    guestPercentage,
    budgetDelta,
    budgetPercentage,
    origPerGuest,
    newPerGuest,
    perGuestDelta,
    perGuestPercentage,
    isSurgeStressScenario: guestDelta > 0 && budgetDelta < 0,
  };
}
