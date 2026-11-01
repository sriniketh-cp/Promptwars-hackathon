/**
 * Festivo AI - Domain Types and Interfaces
 */

export type EventType =
  | 'birthday'
  | 'wedding'
  | 'anniversary'
  | 'college_festival'
  | 'corporate'
  | 'community'
  | 'cultural'
  | 'other';

export interface EventRequirements {
  id: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  endDate?: string;
  city: string;
  guestCount: number;
  totalBudget: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | string;
  theme: string;
  venuePreference?: string;
  isOutdoor: boolean;
  dietaryPreferences: string[];
  accessibilityNeeds: string[];
  culturalPreferences?: string;
  ageGroups: string[];
  priorities: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintSection {
  title: string;
  content: string;
  isAiGenerated: boolean;
}

export interface EventBlueprint {
  summary: string;
  themeRationale: string;
  suggestedVenueCharacteristics: string;
  budgetRationale: string;
  cateringConsiderations: string;
  guestManagementRecommendations: string;
  vendorRequirements: string;
  planningTimelineSummary: string;
  contingencyPlans: string;
  costSavingOpportunities: string[];
  assumptionsRequiringConfirmation: string[];
  generatedAt: string;
  isAiGenerated: boolean;
  isSimulated?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  estimatedCost: number;
  confirmedQuote: number;
  actualExpense: number;
  notes: string;
  isFixedCost: boolean;
}

export type RsvpStatus = 'invited' | 'confirmed' | 'pending' | 'declined';

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: RsvpStatus;
  plusOnes: number;
  dietary: string;
  accessibility: string;
  seatingNotes?: string;
  tableNumber?: string;
}

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'videography'
  | 'dj_entertainment'
  | 'florist'
  | 'transportation'
  | 'equipment'
  | 'other';

export interface VendorQuotation {
  id: string;
  vendorName: string;
  quotedPrice: number;
  includedServices: string[];
  excludedServices: string[];
  taxesAndFees: number;
  depositRequired: number;
  paymentMilestones: string;
  cancellationTerms: string;
  validUntil: string;
  availabilityNotes: string;
  notes?: string;
}

export interface VendorQuoteAnalysis {
  summary: string;
  pros: string[];
  cons: string[];
  missingInfo: string[];
  hiddenCostsWarnings: string[];
  contractClarifications: string[];
  questionsToAsk: string[];
  recommendation: string;
  isSimulated?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: 'contacted' | 'quoted' | 'shortlisted' | 'confirmed' | 'declined';
  notes: string;
  quotes: VendorQuotation[];
  selectedQuoteId?: string;
  aiAnalysis?: VendorQuoteAnalysis;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';

export interface EventTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  owner: string;
  relatedCategory?: string;
  dependencies: string[]; // Task IDs
  completionNotes?: string;
  isMilestone?: boolean;
}

export type RiskLikelihood = 'low' | 'medium' | 'high';
export type RiskImpact = 'low' | 'medium' | 'high';

export interface EventRisk {
  id: string;
  description: string;
  category: 'weather' | 'budget' | 'vendor' | 'guest' | 'venue' | 'permits' | 'logistics' | 'other';
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  severityScore: number; // 1-9 scale deterministically computed
  affectedTasks: string[];
  mitigationStrategy: string;
  contingencyPlan: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
}

export interface ProposedBudgetAdjustment {
  categoryName: string;
  originalAmount: number;
  proposedAmount: number;
  delta: number;
  rationale: string;
  approved: boolean;
}

export interface ProposedTaskAdjustment {
  taskId?: string;
  title: string;
  action: 'reschedule' | 'add' | 'modify' | 'remove';
  originalDueDate?: string;
  newDueDate?: string;
  rationale: string;
  approved: boolean;
}

export interface ProposedRiskAdjustment {
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
  approved: boolean;
}

export interface PlanRevisionProposal {
  id: string;
  eventId: string;
  timestamp: string;
  triggerReason: string;
  originalRequirements: Partial<EventRequirements>;
  updatedRequirements: Partial<EventRequirements>;
  impactAssessment: string;
  affectedBudgetCategories: ProposedBudgetAdjustment[];
  affectedTasks: ProposedTaskAdjustment[];
  newRisks: ProposedRiskAdjustment[];
  tradeOffs: string[];
  alternativeSolutions: string[];
  assumptionsAndUncertainties: string[];
  decisionsRequiringConfirmation: string[];
  isApplied: boolean;
  appliedAt?: string;
  isSimulated?: boolean;
}

export interface EventPlanRevision {
  id: string;
  eventId: string;
  timestamp: string;
  reason: string;
  snapshot: FestivoEvent;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isSimulated?: boolean;
  fallbackReason?: string;
  suggestedAction?: {
    type: 'open_budget' | 'open_what_changed' | 'open_vendors' | 'add_task';
    label: string;
    payload?: Record<string, unknown>;
  };
}

export interface FestivoEvent {
  requirements: EventRequirements;
  blueprint: EventBlueprint;
  budgetCategories: BudgetCategory[];
  guests: Guest[];
  vendors: Vendor[];
  tasks: EventTask[];
  risks: EventRisk[];
  revisions: EventPlanRevision[];
  copilotMessages: CopilotMessage[];
}

export interface CurrencyFormatOptions {
  currency: string;
  locale?: string;
}
