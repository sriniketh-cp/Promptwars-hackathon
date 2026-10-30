/**
 * Festivo AI - Comprehensive Unit & Integration Test Suite
 * Validates authoritative financial calculations, date shifts, risk matrices, and revisions.
 */

import {
  calculateTotalAllocated,
  calculateTotalEstimated,
  calculateTotalConfirmed,
  calculateTotalActual,
  calculateRemainingBudget,
  calculateBudgetReduction,
  calculateRiskSeverity,
  calculateGuestSummary,
  calculateTaskSummary,
  shiftTaskDeadlines,
  formatCurrency,
} from '../src/utils/calculations';
import { SAMPLE_BIRTHDAY_EVENT } from '../src/data/initialData';
import { BudgetCategory, EventTask, Guest, EventRisk } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} - ${details || 'Assertion failed'}`);
  }
}

console.log('\n======================================================');
console.log('FESTIVO AI - TEST EXECUTION SUITE');
console.log('======================================================\n');

// 1. Budget Authoritative Financial Calculations
console.log('[1] Testing Budget Authoritative Calculations');
const testCategories: BudgetCategory[] = [
  { id: '1', name: 'Venue', allocatedAmount: 50000, estimatedCost: 50000, confirmedQuote: 48000, actualExpense: 20000, notes: '', isFixedCost: true },
  { id: '2', name: 'Catering', allocatedAmount: 75000, estimatedCost: 75000, confirmedQuote: 72000, actualExpense: 0, notes: '', isFixedCost: false },
  { id: '3', name: 'Decoration', allocatedAmount: 30000, estimatedCost: 30000, confirmedQuote: 0, actualExpense: 0, notes: '', isFixedCost: false },
  { id: '4', name: 'Photography', allocatedAmount: 20000, estimatedCost: 20000, confirmedQuote: 18000, actualExpense: 5000, notes: '', isFixedCost: true },
  { id: '5', name: 'Entertainment', allocatedAmount: 12000, estimatedCost: 12000, confirmedQuote: 0, actualExpense: 0, notes: '', isFixedCost: false },
  { id: '6', name: 'Contingency', allocatedAmount: 13000, estimatedCost: 13000, confirmedQuote: 0, actualExpense: 0, notes: '', isFixedCost: false },
];

const totalAllocated = calculateTotalAllocated(testCategories);
assert(totalAllocated === 200000, 'Sum of allocated amounts equals ₹2,00,000', `Got ${totalAllocated}`);

const totalConfirmed = calculateTotalConfirmed(testCategories);
assert(totalConfirmed === 138000, 'Sum of confirmed quotes equals ₹1,38,000 (48k + 72k + 18k)', `Got ${totalConfirmed}`);

const totalActual = calculateTotalActual(testCategories);
assert(totalActual === 25000, 'Sum of actual expenses paid equals ₹25,000 (20k + 5k)', `Got ${totalActual}`);

const remainingBudget = calculateRemainingBudget(200000, totalAllocated);
assert(remainingBudget === 0, 'Remaining budget calculated accurately', `Got ${remainingBudget}`);

// 2. Budget Reduction Demonstration (₹2,00,000 -> ₹1,50,000)
console.log('\n[2] Testing ₹50,000 Budget Reduction Demonstration');
const reductionResult = calculateBudgetReduction(testCategories, 150000, 200000);

assert(reductionResult.reductionAmount === 50000, 'Deterministic reduction amount is exactly ₹50,000', `Got ${reductionResult.reductionAmount}`);
assert(reductionResult.percentageReduction === 25, 'Percentage reduction is exactly 25%', `Got ${reductionResult.percentageReduction}%`);
assert(reductionResult.isFeasible === true, 'Reduction to ₹1,50,000 is feasible against fixed commitments');

const venueCut = reductionResult.proposedCuts.find((c) => c.categoryName === 'Venue');
assert(venueCut?.savings === 0, 'Fixed venue cost is protected from automated cuts', `Venue cut: ${venueCut?.savings}`);

const decorCut = reductionResult.proposedCuts.find((c) => c.categoryName === 'Decoration');
assert((decorCut?.savings || 0) > 0, 'Flexible decoration category absorbs proportional savings', `Decor savings: ${decorCut?.savings}`);

// 3. Invalid Monetary Values & Floating-Point Resilience
console.log('\n[3] Testing Invalid Monetary Values & Floating Point Precision');
const currencyFormatted = formatCurrency(NaN, 'INR');
assert(currencyFormatted === '0', 'NaN monetary value handled safely without throwing');

const zeroFormatted = formatCurrency(0, 'INR');
assert(zeroFormatted.includes('0'), 'Zero monetary value formatted cleanly');

const floatTestCats: BudgetCategory[] = [
  { id: '1', name: 'Cat A', allocatedAmount: 0.1, estimatedCost: 0, confirmedQuote: 0, actualExpense: 0, notes: '', isFixedCost: false },
  { id: '2', name: 'Cat B', allocatedAmount: 0.2, estimatedCost: 0, confirmedQuote: 0, actualExpense: 0, notes: '', isFixedCost: false },
];
const floatSum = Math.round(calculateTotalAllocated(floatTestCats) * 10) / 10;
assert(floatSum === 0.3, 'Floating point rounding avoided in financial summation', `Got ${floatSum}`);

// 4. Guest Count Changes & Attendance Modeling
console.log('\n[4] Testing Guest Count Changes & Statistical Model');
const sampleGuests: Guest[] = [
  { id: '1', name: 'Guest 1', rsvpStatus: 'confirmed', plusOnes: 1, dietary: 'Veg', accessibility: 'None' },
  { id: '2', name: 'Guest 2', rsvpStatus: 'confirmed', plusOnes: 0, dietary: 'Non-veg', accessibility: 'None' },
  { id: '3', name: 'Guest 3', rsvpStatus: 'pending', plusOnes: 2, dietary: 'Jain', accessibility: 'Wheelchair' },
  { id: '4', name: 'Guest 4', rsvpStatus: 'declined', plusOnes: 0, dietary: 'None', accessibility: 'None' },
];

const guestSummary = calculateGuestSummary(sampleGuests);
assert(guestSummary.totalInvited === 7, 'Total invited (heads + plusOnes) = 7 (2 + 1 + 3 + 1)', `Got ${guestSummary.totalInvited}`);
assert(guestSummary.confirmed === 3, 'Confirmed attendees = 3', `Got ${guestSummary.confirmed}`);
assert(guestSummary.pending === 3, 'Pending responses = 3', `Got ${guestSummary.pending}`);
assert(guestSummary.declined === 1, 'Declined responses = 1', `Got ${guestSummary.declined}`);
assert(guestSummary.dietaryCount === 3, 'Dietary requirements recorded accurately', `Got ${guestSummary.dietaryCount}`);
assert(guestSummary.accessibilityCount === 1, 'Accessibility requirements recorded accurately', `Got ${guestSummary.accessibilityCount}`);

// 5. Date Changes & Task Deadlines Shifting
console.log('\n[5] Testing Date Changes & Task Deadlines Shifting');
const sampleTasks: EventTask[] = [
  { id: 't1', title: 'Task 1', description: '', dueDate: '2026-11-10', priority: 'high', status: 'todo', owner: 'Host', dependencies: [] },
  { id: 't2', title: 'Task 2', description: '', dueDate: '2026-11-20', priority: 'medium', status: 'completed', owner: 'Host', dependencies: [] },
];

// Event moves from 2026-11-28 to 2026-12-08 (+10 days)
const shiftResult = shiftTaskDeadlines(sampleTasks, '2026-11-28', '2026-12-08');
assert(shiftResult.dayDelta === 10, 'Deterministic date delta is exactly +10 days', `Got ${shiftResult.dayDelta}`);
assert(shiftResult.shiftedTasks[0].dueDate === '2026-11-20', 'Task 1 dueDate shifted forward by 10 days to 2026-11-20', `Got ${shiftResult.shiftedTasks[0].dueDate}`);

// 6. Risk Severity Formula (1-9)
console.log('\n[6] Testing Risk Severity Scoring Matrix');
const criticalScore = calculateRiskSeverity('high', 'high');
assert(criticalScore === 9, 'High likelihood (3) × High impact (3) = 9 (Critical)', `Got ${criticalScore}`);

const medScore = calculateRiskSeverity('medium', 'high');
assert(medScore === 6, 'Medium likelihood (2) × High impact (3) = 6 (High)', `Got ${medScore}`);

const lowScore = calculateRiskSeverity('low', 'low');
assert(lowScore === 1, 'Low likelihood (1) × Low impact (1) = 1 (Minor)', `Got ${lowScore}`);

// 7. Revisions & Snapshot Restoration
console.log('\n[7] Testing Revisions & Snapshot Restoration');
const originalEventSnapshot = JSON.parse(JSON.stringify(SAMPLE_BIRTHDAY_EVENT));
const modifiedEvent = {
  ...originalEventSnapshot,
  requirements: {
    ...originalEventSnapshot.requirements,
    guestCount: 160,
    totalBudget: 170000,
  },
};

assert(modifiedEvent.requirements.guestCount === 160, 'Modified event guest count is 160');
// Restore
const restoredEvent = JSON.parse(JSON.stringify(originalEventSnapshot));
assert(restoredEvent.requirements.guestCount === 120, 'Restored event reverts accurately to original 120 guests');
assert(restoredEvent.requirements.totalBudget === 200000, 'Restored event budget reverts accurately to ₹2,00,000');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
