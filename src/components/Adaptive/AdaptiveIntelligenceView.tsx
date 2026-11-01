import React, { useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  History,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ListTodo,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import {
  FestivoEvent,
  EventRequirements,
  PlanRevisionProposal,
  EventPlanRevision,
} from '../../types';
import { api } from '../../services/api';
import { formatCurrency, shiftTaskDeadlines, calculateAdaptiveDeltas } from '../../utils/calculations';
import { SimulationBadge } from '../Common/SimulationBadge';

interface AdaptiveIntelligenceViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
}

export const AdaptiveIntelligenceView: React.FC<AdaptiveIntelligenceViewProps> = ({
  event,
  onUpdateEvent,
}) => {
  const currentReq = event.requirements;

  // Form State for proposed changes
  const [proposedGuests, setProposedGuests] = useState<number>(currentReq.guestCount);
  const [proposedBudget, setProposedBudget] = useState<number>(currentReq.totalBudget);
  const [proposedDate, setProposedDate] = useState<string>(currentReq.date);
  const [proposedOutdoor, setProposedOutdoor] = useState<boolean>(currentReq.isOutdoor);
  const [changeReason, setChangeReason] = useState<string>('Guest surge & budget revision');

  // Proposal State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeProposal, setActiveProposal] = useState<PlanRevisionProposal | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick Preset: Prompt Scenario (120 guests @ ₹2,00,000 -> 160 guests @ ₹1,50,000)
  const loadExampleScenario = () => {
    setProposedGuests(160);
    setProposedBudget(150000);
    setProposedDate(currentReq.date);
    setProposedOutdoor(true);
    setChangeReason('Surge from 120 to 160 guests (+40) while reducing budget from ₹2,00,000 to ₹1,50,000 (-₹50,000)');
  };

  // Compute live mathematical deltas using authoritative application code
  const deltas = calculateAdaptiveDeltas(
    currentReq.guestCount,
    currentReq.totalBudget,
    Number(proposedGuests) || currentReq.guestCount,
    Number(proposedBudget) || currentReq.totalBudget
  );

  // Run the analysis
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setStatusMessage(null);
    setActiveProposal(null);

    const updatedPartial: Partial<EventRequirements> = {
      guestCount: Number(proposedGuests),
      totalBudget: Number(proposedBudget),
      date: proposedDate,
      isOutdoor: proposedOutdoor,
      theme: currentReq.theme,
    };

    try {
      const proposal = await api.runAdaptiveIntelligence(
        event,
        updatedPartial,
        changeReason
      );
      setActiveProposal(proposal);
    } catch (err) {
      console.error('Failed to run adaptive intelligence:', err);
      setStatusMessage('Error executing adaptive analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle selection on proposed changes
  const toggleBudgetAdjustment = (idx: number) => {
    if (!activeProposal) return;
    const items = [...activeProposal.affectedBudgetCategories];
    items[idx].approved = !items[idx].approved;
    setActiveProposal({ ...activeProposal, affectedBudgetCategories: items });
  };

  const toggleTaskAdjustment = (idx: number) => {
    if (!activeProposal) return;
    const items = [...activeProposal.affectedTasks];
    items[idx].approved = !items[idx].approved;
    setActiveProposal({ ...activeProposal, affectedTasks: items });
  };

  const toggleRiskAdjustment = (idx: number) => {
    if (!activeProposal) return;
    const items = [...activeProposal.newRisks];
    items[idx].approved = !items[idx].approved;
    setActiveProposal({ ...activeProposal, newRisks: items });
  };

  const approveAll = () => {
    if (!activeProposal) return;
    setActiveProposal({
      ...activeProposal,
      affectedBudgetCategories: activeProposal.affectedBudgetCategories.map((c) => ({ ...c, approved: true })),
      affectedTasks: activeProposal.affectedTasks.map((t) => ({ ...t, approved: true })),
      newRisks: activeProposal.newRisks.map((r) => ({ ...r, approved: true })),
    });
  };

  const rejectProposal = () => {
    setActiveProposal(null);
    setStatusMessage('Proposed revision was rejected. Original event plan remains unchanged.');
  };

  // Apply approved changes to the active event plan
  const handleApplyApproved = () => {
    if (!activeProposal) return;

    // 1. Create a historical snapshot of the current state before applying
    const revisionSnapshot: EventPlanRevision = {
      id: `rev-${Date.now()}`,
      eventId: currentReq.id,
      timestamp: new Date().toISOString(),
      reason: activeProposal.triggerReason,
      snapshot: JSON.parse(JSON.stringify(event)),
    };

    // 2. Apply updated requirements
    const updatedReq: EventRequirements = {
      ...currentReq,
      ...activeProposal.updatedRequirements,
      updatedAt: new Date().toISOString(),
    };

    // 3. Apply approved budget adjustments
    const budgetMap = new Map(
      activeProposal.affectedBudgetCategories
        .filter((c) => c.approved)
        .map((c) => [c.categoryName, c.proposedAmount])
    );

    const updatedCategories = (event.budgetCategories || []).map((cat) => {
      if (budgetMap.has(cat.name)) {
        return {
          ...cat,
          allocatedAmount: budgetMap.get(cat.name)!,
        };
      }
      return cat;
    });

    // 4. Apply date shifts or task adjustments
    let updatedTasks = [...(event.tasks || [])];
    if (activeProposal.updatedRequirements.date && activeProposal.updatedRequirements.date !== currentReq.date) {
      // Deterministic date shift using application code
      const { shiftedTasks } = shiftTaskDeadlines(
        updatedTasks,
        currentReq.date,
        activeProposal.updatedRequirements.date
      );
      updatedTasks = shiftedTasks;
    }

    // Apply approved task modifications or additions
    activeProposal.affectedTasks.filter((t) => t.approved).forEach((adj) => {
      if (adj.action === 'add') {
        updatedTasks.push({
          id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          title: adj.title,
          description: adj.rationale,
          dueDate: adj.newDueDate || updatedReq.date,
          priority: 'high',
          status: 'todo',
          owner: 'Host',
          dependencies: [],
          isMilestone: false,
        });
      } else if (adj.taskId) {
        const tIndex = updatedTasks.findIndex((t) => t.id === adj.taskId);
        if (tIndex !== -1) {
          updatedTasks[tIndex] = {
            ...updatedTasks[tIndex],
            dueDate: adj.newDueDate || updatedTasks[tIndex].dueDate,
            description: `${updatedTasks[tIndex].description} (${adj.rationale})`,
          };
        }
      }
    });

    // 5. Apply approved new risks
    const updatedRisks = [...(event.risks || [])];
    activeProposal.newRisks.filter((r) => r.approved).forEach((rAdj) => {
      const score = rAdj.severity === 'high' ? 6 : rAdj.severity === 'medium' ? 4 : 2;
      updatedRisks.push({
        id: `risk-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        description: rAdj.description,
        category: 'logistics',
        likelihood: 'medium',
        impact: rAdj.severity,
        severityScore: score,
        affectedTasks: [],
        mitigationStrategy: rAdj.mitigation,
        contingencyPlan: 'Review operational reserves and verify vendor buffer capacity.',
        status: 'identified',
      });
    });

    // Save and commit
    onUpdateEvent({
      requirements: updatedReq,
      budgetCategories: updatedCategories,
      tasks: updatedTasks,
      risks: updatedRisks,
      revisions: [...(event.revisions || []), revisionSnapshot],
    });

    setActiveProposal(null);
    setStatusMessage('Approved revisions were successfully committed and saved to the event plan! A restore checkpoint was created in revision history.');
  };

  // Restore a previous revision snapshot
  const restoreRevision = (rev: EventPlanRevision) => {
    if (!rev.snapshot) return;
    onUpdateEvent(rev.snapshot);
    setStatusMessage(`Restored event plan back to revision saved on ${new Date(rev.timestamp).toLocaleString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#E0533C]" />
            <span>Adaptive Event Intelligence</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Signature Feature: Model shifts in budget, guest count, or venue constraints, evaluate trade-offs, and inspect revisions.
          </p>
        </div>

        {/* Quick Example Button */}
        <button
          onClick={loadExampleScenario}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FFF0ED] text-[#C53F28] hover:bg-[#FFE4DE] border border-[#F9C3B8] transition-colors shadow-2xs whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Challenge Scenario (160 guests / ₹1.5L)</span>
        </button>
      </div>

      {statusMessage && (
        <div role="status" aria-live="polite" className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[#166534] hover:text-[#14532D]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Grid: Current vs Proposed ("What Changed?") */}
      <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD2]">
          <h3 className="font-serif font-bold text-base text-[#2D112C] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#E0533C]" />
            <span>Specify Changed Parameters</span>
          </h3>
          <span className="text-xs text-[#695A60]">
            Original values are preserved until you approve the proposal.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Guest Count Input */}
          <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#695A60]">Expected Guests</span>
              <span className="font-mono text-[#7B6A71]">Current: {currentReq.guestCount}</span>
            </div>
            <input
              id="proposed-guests-input"
              aria-label="Proposed guest count"
              type="number"
              min="5"
              value={proposedGuests}
              onChange={(e) => setProposedGuests(Number(e.target.value))}
              className="w-full text-base font-mono font-bold text-[#2D112C] bg-white border border-[#DDD3C5] rounded-lg p-2 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
            />
            <div className="text-[11px] font-mono">
              Delta:{' '}
              <span
                className={`font-semibold ${
                  proposedGuests > currentReq.guestCount
                    ? 'text-[#DC2626]'
                    : proposedGuests < currentReq.guestCount
                    ? 'text-[#16A34A]'
                    : 'text-[#695A60]'
                }`}
              >
                {proposedGuests - currentReq.guestCount >= 0 ? '+' : ''}
                {proposedGuests - currentReq.guestCount} guests
              </span>
            </div>
          </div>

          {/* Budget Input */}
          <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#695A60]">Ceiling Budget</span>
              <span className="font-mono text-[#7B6A71]">
                Current: {formatCurrency(currentReq.totalBudget, currentReq.currency)}
              </span>
            </div>
            <input
              id="proposed-budget-input"
              aria-label="Proposed budget ceiling"
              type="number"
              min="1000"
              value={proposedBudget}
              onChange={(e) => setProposedBudget(Number(e.target.value))}
              className="w-full text-base font-mono font-bold text-[#2D112C] bg-white border border-[#DDD3C5] rounded-lg p-2 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
            />
            <div className="text-[11px] font-mono">
              Delta:{' '}
              <span
                className={`font-semibold ${
                  proposedBudget < currentReq.totalBudget
                    ? 'text-[#DC2626]'
                    : proposedBudget > currentReq.totalBudget
                    ? 'text-[#16A34A]'
                    : 'text-[#695A60]'
                }`}
              >
                {proposedBudget - currentReq.totalBudget >= 0 ? '+' : ''}
                {formatCurrency(proposedBudget - currentReq.totalBudget, currentReq.currency)}
              </span>
            </div>
          </div>

          {/* Event Date Input */}
          <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#695A60]">Celebration Date</span>
              <span className="font-mono text-[#7B6A71]">Current: {currentReq.date}</span>
            </div>
            <input
              id="proposed-date-input"
              aria-label="Proposed celebration date"
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full text-sm font-mono font-bold text-[#2D112C] bg-white border border-[#DDD3C5] rounded-lg p-2 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
            />
            <div className="text-[11px] text-[#695A60]">
              {proposedDate !== currentReq.date ? 'Date shifted — will recalculate task milestones' : 'Same date'}
            </div>
          </div>
        </div>

        {/* Change Reason / Context Input */}
        <div>
          <label htmlFor="change-reason-input" className="block text-xs font-semibold text-[#2D112C] mb-1">
            Reason for Change / Context for AI Reasoner
          </label>
          <input
            id="change-reason-input"
            type="text"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="e.g., Guest list expanded, budget constrained by venue surcharge, date moved forward"
            className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg p-2.5 text-[#2D112C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
          />
        </div>

        {/* Live Mathematical Calculation Breakdown */}
        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D112C] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#E0533C]" />
              Live Mathematical Impact Analysis
            </span>
            {deltas.isSurgeStressScenario && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                Stress Scenario: Volume Surge + Budget Compression
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-[#E5DDD2]">
              <div className="text-[11px] text-[#695A60]">Guest Attendance Shift</div>
              <div className="text-base font-mono font-bold text-[#2D112C] mt-0.5">
                {currentReq.guestCount} → {proposedGuests}
              </div>
              <div className={`text-[11px] font-mono mt-0.5 font-semibold ${
                deltas.guestDelta > 0 ? 'text-[#DC2626]' : deltas.guestDelta < 0 ? 'text-[#16A34A]' : 'text-[#695A60]'
              }`}>
                {deltas.guestDelta >= 0 ? '+' : ''}{deltas.guestDelta} guests ({deltas.guestPercentage >= 0 ? '+' : ''}{deltas.guestPercentage}%)
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E5DDD2]">
              <div className="text-[11px] text-[#695A60]">Total Ceiling Budget</div>
              <div className="text-base font-mono font-bold text-[#2D112C] mt-0.5">
                {formatCurrency(currentReq.totalBudget, currentReq.currency)} → {formatCurrency(proposedBudget, currentReq.currency)}
              </div>
              <div className={`text-[11px] font-mono mt-0.5 font-semibold ${
                deltas.budgetDelta < 0 ? 'text-[#DC2626]' : deltas.budgetDelta > 0 ? 'text-[#16A34A]' : 'text-[#695A60]'
              }`}>
                {deltas.budgetDelta >= 0 ? '+' : ''}{formatCurrency(deltas.budgetDelta, currentReq.currency)} ({deltas.budgetPercentage >= 0 ? '+' : ''}{deltas.budgetPercentage}%)
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E5DDD2]">
              <div className="text-[11px] text-[#695A60]">Per-Guest Spending Capacity</div>
              <div className="text-base font-mono font-bold text-[#2D112C] mt-0.5">
                {formatCurrency(deltas.origPerGuest, currentReq.currency)} → {formatCurrency(deltas.newPerGuest, currentReq.currency)}
              </div>
              <div className={`text-[11px] font-mono mt-0.5 font-semibold ${
                deltas.perGuestDelta < 0 ? 'text-[#DC2626]' : deltas.perGuestDelta > 0 ? 'text-[#16A34A]' : 'text-[#695A60]'
              }`}>
                {deltas.perGuestDelta >= 0 ? '+' : ''}{formatCurrency(deltas.perGuestDelta, currentReq.currency)} ({deltas.perGuestPercentage >= 0 ? '+' : ''}{deltas.perGuestPercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E5DDD2]">
          <div className="text-xs text-[#695A60]">
            Ready to evaluate multi-variable ripple effects across catering, venue, decor, and tasks.
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] disabled:opacity-50 transition-colors shadow-2xs whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating Impact with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#F97356]" />
                <span>Run "What Changed?" Intelligence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structured Proposal Review Container */}
      {activeProposal && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#E0533C]/30 shadow-lg space-y-6">
          {/* Proposal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
            <div>
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className="font-bold text-[#E0533C] uppercase tracking-wider">
                  Proposed Plan Revision
                </span>
                <span className="text-[#8C7A83]">·</span>
                <span className="text-[#695A60]">Requires User Confirmation</span>
                <SimulationBadge isSimulated={activeProposal.isSimulated} />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#2D112C]">
                Impact Assessment & Adaptation Proposal
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={rejectProposal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#7B6A71] hover:text-[#DC2626] border border-[#DDD3C5] hover:bg-[#FEE2E2]/30 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Reject Proposal</span>
              </button>

              <button
                onClick={approveAll}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#2D112C] bg-[#FAF7F2] border border-[#DDD3C5] hover:bg-[#EBE2D7] transition-colors"
              >
                Select All
              </button>

              <button
                onClick={handleApplyApproved}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] shadow-xs transition-colors"
              >
                <Check className="w-4 h-4 text-[#F97356]" />
                <span>Apply Selected Changes</span>
              </button>
            </div>
          </div>

          {/* Impact Narrative */}
          <div className="p-4 rounded-xl bg-[#FFF9F6] border border-[#F97356]/30 text-xs text-[#4F3F46] leading-relaxed">
            <h4 className="font-bold text-[#C53F28] uppercase text-[11px] tracking-wider mb-1">
              Gemini Impact Assessment
            </h4>
            <p>{activeProposal.impactAssessment}</p>
          </div>

          {/* Affected Budget Categories */}
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2D112C] mb-3 flex items-center justify-between">
              <span>Affected Budget Categories ({activeProposal.affectedBudgetCategories.length})</span>
              <span className="text-xs font-normal text-[#695A60]">
                Uncheck any category you do not wish to adjust
              </span>
            </h4>
            <div className="space-y-2.5">
              {activeProposal.affectedBudgetCategories.map((cat, idx) => (
                <label
                  key={idx}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    cat.approved
                      ? 'bg-[#FFF9F6] border-[#F97356]/40'
                      : 'bg-white border-[#E5DDD2] opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!cat.approved}
                      onChange={() => toggleBudgetAdjustment(idx)}
                      aria-label={`Toggle adjustment for ${cat.categoryName}`}
                      className="mt-0.5 accent-[#2D112C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2D112C]">
                          {cat.categoryName}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold ${
                            cat.delta < 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'
                          }`}
                        >
                          {cat.delta < 0 ? '' : '+'}
                          {formatCurrency(cat.delta, currentReq.currency)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#695A60] mt-0.5">
                        {cat.rationale}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs">
                    <div className="text-[#695A60] line-through">
                      {formatCurrency(cat.originalAmount, currentReq.currency)}
                    </div>
                    <div className="font-bold text-[#2D112C]">
                      {formatCurrency(cat.proposedAmount, currentReq.currency)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Affected Tasks & Newly Identified Risks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tasks */}
            <div className="p-4 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#2D112C] flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#E0533C]" />
                <span>Task & Deadline Adjustments</span>
              </h4>
              <div className="space-y-2">
                {activeProposal.affectedTasks.map((t, idx) => (
                  <label
                    key={idx}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                      t.approved ? 'bg-white border-[#DDD3C5]' : 'bg-[#F2ECE3] border-[#E5DDD2] opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!t.approved}
                      onChange={() => toggleTaskAdjustment(idx)}
                      aria-label={`Toggle task adjustment for ${t.title}`}
                      className="mt-0.5 accent-[#2D112C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                    />
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-[#2D112C] truncate">
                        {t.title}
                      </div>
                      <p className="text-[11px] text-[#695A60]">{t.rationale}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="p-4 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#2D112C] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                <span>Newly Identified Risks & Mitigations</span>
              </h4>
              <div className="space-y-2">
                {activeProposal.newRisks.map((r, idx) => (
                  <label
                    key={idx}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                      r.approved ? 'bg-white border-[#DDD3C5]' : 'bg-[#F2ECE3] border-[#E5DDD2] opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!r.approved}
                      onChange={() => toggleRiskAdjustment(idx)}
                      aria-label={`Toggle risk adjustment for ${r.description}`}
                      className="mt-0.5 accent-[#2D112C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                    />
                    <div className="text-xs min-w-0">
                      <div className="font-semibold text-[#2D112C]">{r.description}</div>
                      <p className="text-[11px] text-[#695A60]">
                        <span className="font-medium text-[#2D112C]">Mitigation: </span>
                        {r.mitigation}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Trade-offs & Decisions Requiring Confirmation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl border border-[#E5DDD2] bg-white space-y-2">
              <h5 className="font-bold text-[#2D112C]">Explicit Trade-offs</h5>
              <ul className="list-disc pl-4 space-y-1 text-[#695A60]">
                {activeProposal.tradeOffs.map((to, i) => (
                  <li key={i}>{to}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-[#E5DDD2] bg-white space-y-2">
              <h5 className="font-bold text-[#2D112C]">Decisions Requiring Confirmation</h5>
              <ul className="list-disc pl-4 space-y-1 text-[#695A60]">
                {activeProposal.decisionsRequiringConfirmation.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Revision History & Restore Section */}
      <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD2]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#2D112C]" />
            <h3 className="font-serif font-bold text-base text-[#2D112C]">
              Revision History & Restore Checkpoints
            </h3>
          </div>
          <span className="text-xs text-[#695A60]">
            {(event.revisions || []).length} Recorded Snapshots
          </span>
        </div>

        <p className="text-xs text-[#695A60]">
          Every time you approve an adaptive proposal or adjust the budget, Festivo AI stores an immutable revision. You can inspect previous versions and restore them at any time.
        </p>

        <div className="space-y-2.5">
          {(event.revisions || []).map((rev, idx) => (
            <div
              key={rev.id || idx}
              className="p-3.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#2D112C]">
                    Revision #{idx + 1}
                  </span>
                  <span className="text-xs text-[#8C7A83]">·</span>
                  <span className="text-xs text-[#695A60] truncate">{rev.reason}</span>
                </div>
                <div className="text-[11px] text-[#8C7A83] font-mono mt-0.5">
                  {new Date(rev.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {rev.snapshot && rev.snapshot.requirements && (
                  <button
                    onClick={() => restoreRevision(rev)}
                    aria-label={`Restore Revision #${idx + 1}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#2D112C] border border-[#DDD3C5] hover:bg-[#F2ECE3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#E0533C]" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
