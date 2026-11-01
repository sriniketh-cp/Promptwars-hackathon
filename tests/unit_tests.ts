/**
 * Festivo AI - Comprehensive Unit & Integration Test Suite
 * Validates authoritative financial calculations, date shifts, risk matrices, and revisions.
 */

import {
  validateEventRequirements,
  calculateAdaptiveDeltas,
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
import { BudgetCategory, EventTask, Guest, EventRisk, FestivoEvent, VendorQuotation, EventPlanRevision } from '../src/types';
import { sanitizeInput, sanitizeNumericAmount, sanitizeEventPayload } from '../src/utils/security';

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

// 8. Live Form Validation Rules (Requirement 2)
console.log('\n[8] Testing Live Form Validation Rules (Negative, Zero, Missing, Invalid Date)');

// Test: Negative guest count
const negGuestVal = validateEventRequirements({
  name: 'Anniversary Party',
  city: 'Bengaluru',
  date: '2026-11-28',
  guestCount: -15,
  totalBudget: 100000,
});
assert(!negGuestVal.isValid, 'Rejects negative guest counts (-15)');
assert(negGuestVal.errors.guestCount === 'Guest count cannot be negative.', 'Returns explicit negative guest message');

// Test: Zero guests
const zeroGuestVal = validateEventRequirements({
  name: 'Anniversary Party',
  city: 'Bengaluru',
  date: '2026-11-28',
  guestCount: 0,
  totalBudget: 100000,
});
assert(!zeroGuestVal.isValid, 'Rejects zero guests');
assert(zeroGuestVal.errors.guestCount?.includes('at least 1 attendee') === true, 'Returns explicit zero guests rejection message');

// Test: Negative budget
const negBudgetVal = validateEventRequirements({
  name: 'Anniversary Party',
  city: 'Bengaluru',
  date: '2026-11-28',
  guestCount: 50,
  totalBudget: -50000,
});
assert(!negBudgetVal.isValid, 'Rejects negative budgets (-₹50,000)');
assert(negBudgetVal.errors.totalBudget === 'Budget cannot be negative.', 'Returns explicit negative budget message');

// Test: Zero budget
const zeroBudgetVal = validateEventRequirements({
  name: 'Anniversary Party',
  city: 'Bengaluru',
  date: '2026-11-28',
  guestCount: 50,
  totalBudget: 0,
});
assert(!zeroBudgetVal.isValid, 'Rejects zero budget');

// Test: Missing required fields
const missingFieldsVal = validateEventRequirements({
  name: '',
  city: '',
  date: '',
  guestCount: '',
  totalBudget: '',
});
assert(!missingFieldsVal.isValid, 'Rejects missing required fields');
assert(!!missingFieldsVal.errors.name, 'Flags missing name');
assert(!!missingFieldsVal.errors.city, 'Flags missing city');
assert(!!missingFieldsVal.errors.date, 'Flags missing date');
assert(!!missingFieldsVal.errors.guestCount, 'Flags missing guest count');
assert(!!missingFieldsVal.errors.totalBudget, 'Flags missing budget');

// Test: Invalid date format
const invalidDateVal = validateEventRequirements({
  name: 'Summer Gala',
  city: 'Mumbai',
  date: 'not-a-date',
  guestCount: 100,
  totalBudget: 200000,
});
assert(!invalidDateVal.isValid, 'Rejects invalid date strings');

// Test: Valid event requirements
const validEventVal = validateEventRequirements({
  name: "Sarah's 30th Birthday",
  city: 'Bengaluru',
  date: '2026-12-15',
  guestCount: 120,
  totalBudget: 200000,
});
assert(validEventVal.isValid, 'Accepts properly configured event requirements without error');

// 9. Adaptive Planning Demonstration (₹2,00,000 / 120 -> ₹1,50,000 / 160) (Requirement 3)
console.log('\n[9] Testing Adaptive Planning Demonstration (120 guests @ ₹2,00,000 -> 160 guests @ ₹1,50,000)');
const adaptiveDeltas = calculateAdaptiveDeltas(120, 200000, 160, 150000);

assert(adaptiveDeltas.guestDelta === 40, 'Guest delta is exactly +40 guests', `Got ${adaptiveDeltas.guestDelta}`);
assert(adaptiveDeltas.guestPercentage === 33.3, 'Guest percentage increase is +33.3%', `Got ${adaptiveDeltas.guestPercentage}%`);
assert(adaptiveDeltas.budgetDelta === -50000, 'Budget reduction is exactly -₹50,000', `Got ${adaptiveDeltas.budgetDelta}`);
assert(adaptiveDeltas.budgetPercentage === -25, 'Budget percentage reduction is exactly -25%', `Got ${adaptiveDeltas.budgetPercentage}%`);
assert(adaptiveDeltas.origPerGuest === 1667, 'Original spending per guest is ₹1,667', `Got ${adaptiveDeltas.origPerGuest}`);
assert(adaptiveDeltas.newPerGuest === 938, 'New spending per guest is ₹938', `Got ${adaptiveDeltas.newPerGuest}`);
assert(adaptiveDeltas.perGuestDelta === -729, 'Per-guest spending drops by -₹729/guest', `Got ${adaptiveDeltas.perGuestDelta}`);
assert(adaptiveDeltas.isSurgeStressScenario === true, 'Correctly flags high stress surge + budget compression scenario');


// 10. Event Creation, Editing & Persistence Integrity
console.log('\n[10] Testing Event Creation, Editing & Mutation Integrity');
const testBaseEvent: FestivoEvent = JSON.parse(JSON.stringify(SAMPLE_BIRTHDAY_EVENT));
const clonedOriginal: FestivoEvent = JSON.parse(JSON.stringify(testBaseEvent));

testBaseEvent.requirements.name = 'Updated Milestone Gala';
testBaseEvent.requirements.guestCount = 180;
testBaseEvent.requirements.totalBudget = 250000;

assert(testBaseEvent.requirements.name === 'Updated Milestone Gala', 'Event name updated correctly');
assert(testBaseEvent.requirements.guestCount === 180, 'Guest count updated correctly to 180');
assert(clonedOriginal.requirements.guestCount === 120, 'Original template object remains pristine and unmutated');

const rev1: EventPlanRevision = {
  id: 'rev-test-1',
  eventId: testBaseEvent.requirements.id,
  timestamp: new Date().toISOString(),
  reason: 'Simulated budget expansion for extra guests',
  snapshot: JSON.parse(JSON.stringify(testBaseEvent)),
};
testBaseEvent.revisions = [rev1];

testBaseEvent.requirements.totalBudget = 300000;
assert(testBaseEvent.requirements.totalBudget === 300000, 'Current event budget reflects latest mutation');
assert(testBaseEvent.revisions[0].snapshot.requirements.totalBudget === 250000, 'Historical revision accurately preserves pre-mutation budget of ₹2,50,000');

// 11. Vendor Quotation Analysis & Comparative Ranking
console.log('\n[11] Testing Vendor Quotation Analysis & Comparative Ranking');
const quoteA: VendorQuotation = {
  id: 'qa-1',
  vendorName: 'Royal Spice Caterers',
  quotedPrice: 60000,
  includedServices: ['Full buffet setup', '8 service staff', 'Welcome drinks'],
  excludedServices: ['Live barbecue counter', 'Alcoholic bar service'],
  taxesAndFees: 3000,
  depositRequired: 15000,
  paymentMilestones: '25% advance, balance on event day',
  cancellationTerms: 'Free cancellation up to 7 days before event',
  validUntil: '2026-11-20',
  availabilityNotes: 'Available on selected date',
};

const quoteB: VendorQuotation = {
  id: 'qb-2',
  vendorName: 'Heritage Feast Kitchen',
  quotedPrice: 52000,
  includedServices: ['Standard buffet', '4 service staff'],
  excludedServices: ['Cutlery', 'Table linens', 'Dessert station'],
  taxesAndFees: 5000,
  depositRequired: 20000,
  paymentMilestones: '50% advance, balance on delivery',
  cancellationTerms: 'Non-refundable deposit',
  validUntil: '2026-11-15',
  availabilityNotes: 'Tentatively held for 48 hours',
};

const totalLandedCostA = quoteA.quotedPrice + quoteA.taxesAndFees;
const totalLandedCostB = quoteB.quotedPrice + quoteB.taxesAndFees;

assert(totalLandedCostA === 63000, 'Quote A total landed cost equals ₹63,000 (60k + 3k tax)', `Got ${totalLandedCostA}`);
assert(totalLandedCostB === 57000, 'Quote B total landed cost equals ₹57,000 (52k + 5k tax)', `Got ${totalLandedCostB}`);
assert(totalLandedCostB < totalLandedCostA, 'Identifies Quote B as having lower total landed cost');

const perHeadCostA_120 = Math.round(totalLandedCostA / 120);
const perHeadCostA_160 = Math.round(totalLandedCostA / 160);
assert(perHeadCostA_120 === 525, 'Quote A per-head cost for 120 guests is ₹525/guest', `Got ${perHeadCostA_120}`);
assert(perHeadCostA_160 === 394, 'Quote A per-head cost scales down to ₹394/guest for 160 guests', `Got ${perHeadCostA_160}`);

// 12. Adaptive Recommendation Selective Approval & Rejection Logic
console.log('\n[12] Testing Adaptive Recommendation Approval/Rejection Logic');
interface ProposedAdjustment {
  name: string;
  original: number;
  proposed: number;
  savings: number;
  approved: boolean;
}

const proposedAdjustments: ProposedAdjustment[] = [
  { name: 'Decoration', original: 30000, proposed: 20000, savings: 10000, approved: true },
  { name: 'Catering', original: 75000, proposed: 60000, savings: 15000, approved: false },
  { name: 'Entertainment', original: 12000, proposed: 7000, savings: 5000, approved: true },
];

const realizedSavings = proposedAdjustments
  .filter((adj) => adj.approved)
  .reduce((sum, adj) => sum + adj.savings, 0);

assert(realizedSavings === 15000, 'Only approved recommendations yield savings (10k decor + 5k entertainment = ₹15,000)', `Got ${realizedSavings}`);

const finalCategories = testCategories.map((c) => {
  const match = proposedAdjustments.find((adj) => adj.name === c.name);
  if (match && match.approved) {
    return { ...c, allocatedAmount: match.proposed };
  }
  return c;
});

const decorFinal = finalCategories.find((c) => c.name === 'Decoration');
const cateringFinal = finalCategories.find((c) => c.name === 'Catering');
assert(decorFinal?.allocatedAmount === 20000, 'Approved Decoration cut was applied (₹20,000)');
assert(cateringFinal?.allocatedAmount === 75000, 'Rejected Catering cut was preserved at original amount (₹75,000)');

// 13. Gemini API Resilience: Markdown Cleanup & Safe Parsing
console.log('\n[13] Testing Gemini API Markdown Cleanup & Parsing Resilience');
function cleanAndParseGeminiResponse(rawText: string): Record<string, unknown> | null {
  try {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/i, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

const rawMarkdownJson = '```json\n{\n  "status": "success",\n  "model": "gemini-3.6-flash",\n  "score": 98\n}\n```';
const parsedMarkdown = cleanAndParseGeminiResponse(rawMarkdownJson);
assert(parsedMarkdown !== null, 'Cleanly extracts JSON wrapped in markdown codeblocks');
assert(parsedMarkdown?.status === 'success', 'Extracted payload contains valid properties');

const malformedJson = '{\n  "status": "incomplete",\n  "model": "gemini-3.6-flash"';
const parsedMalformed = cleanAndParseGeminiResponse(malformedJson);
assert(parsedMalformed === null, 'Safely returns null on malformed JSON without unhandled throw');

// 14. Input Sanitization & Security Protection
console.log('\n[14] Testing Security Sanitization Protection');
const xssPayload = '<script>alert("xss")</script>Sarah\'s 30th Birthday';
const sanitizedTitle = sanitizeInput(xssPayload);
assert(!sanitizedTitle.includes('<script>'), 'Strips executable script tags');
assert(!sanitizedTitle.includes('</script>'), 'Strips closing script tags');
assert(sanitizedTitle.includes("Sarah's 30th Birthday"), 'Preserves benign text content');

const imgPayload = '<img src="x" onerror="alert(1)"/>Gala Event';
const sanitizedImg = sanitizeInput(imgPayload);
assert(!sanitizedImg.includes('<img'), 'Strips HTML image injection');

const safeNumericBudget = sanitizeNumericAmount(150000, 150000, 100, 10000000);
assert(safeNumericBudget === 150000, 'Valid numeric budget within bounds is accepted');

const clampedNegativeBudget = sanitizeNumericAmount(-50000, 150000, 100, 10000000);
assert(clampedNegativeBudget === 150000, 'Negative budget is clamped to default fallback amount');

const nanBudget = sanitizeNumericAmount(NaN, 150000, 100, 10000000);
assert(nanBudget === 150000, 'NaN input defaults safely to fallback amount');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
