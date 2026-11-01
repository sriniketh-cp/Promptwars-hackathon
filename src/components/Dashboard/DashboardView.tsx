import React from 'react';
import {
  Calendar,
  Users,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Building2,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { FestivoEvent } from '../../types';
import {
  formatCurrency,
  calculateTotalAllocated,
  calculateTotalConfirmed,
  calculateTotalActual,
  calculateRemainingBudget,
  calculateGuestSummary,
  calculateTaskSummary,
} from '../../utils/calculations';
import { SimulationBadge } from '../Common/SimulationBadge';
import { NavTab } from '../Navigation/Sidebar';

interface DashboardViewProps {
  event: FestivoEvent | null;
  onNavigateTab: (tab: NavTab) => void;
  onNewEvent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  event,
  onNavigateTab,
  onNewEvent,
}) => {
  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F2ECE3] border border-[#DDD3C5] flex items-center justify-center mx-auto mb-4 text-[#8C7A83]">
          <Calendar className="w-8 h-8 text-[#E0533C]" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#2D112C] mb-2">
          No Event Selected
        </h2>
        <p className="text-sm text-[#695A60] max-w-md mx-auto mb-6">
          Create a personalized event blueprint with our AI Event Architect or select a sample celebration from the directory.
        </p>
        <button
          onClick={onNewEvent}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 text-[#F97356]" />
          <span>Launch AI Event Architect</span>
        </button>
      </div>
    );
  }

  const req = event.requirements;
  const categories = event.budgetCategories || [];
  const totalAllocated = calculateTotalAllocated(categories);
  const totalConfirmed = calculateTotalConfirmed(categories);
  const totalActual = calculateTotalActual(categories);
  const remainingBudget = calculateRemainingBudget(req.totalBudget, totalAllocated);
  const budgetUtilization = req.totalBudget > 0 ? Math.round((totalAllocated / req.totalBudget) * 100) : 0;

  const guestSummary = calculateGuestSummary(event.guests || []);
  const taskSummary = calculateTaskSummary(event.tasks || [], req.date);

  // Countdown calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(req.date);
  const timeDiff = eventDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // Top risks sorted by severity
  const sortedRisks = [...(event.risks || [])].sort((a, b) => b.severityScore - a.severityScore);

  // Next 3 tasks
  const nextTasks = (event.tasks || [])
    .filter((t) => t.status !== 'completed')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero Event Banner */}
      <div className="bg-gradient-to-r from-[#2D112C] via-[#3B1838] to-[#250E24] rounded-2xl p-6 sm:p-8 text-[#FAF7F2] shadow-md border border-[#D4AF37]/20 relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E0533C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="uppercase tracking-wider font-semibold text-[#F4DE86]">
                {req.type}
              </span>
              <span className="text-white/40" aria-hidden="true">·</span>
              <span className="text-white/80">{req.city}</span>
              <span className="text-white/40" aria-hidden="true">·</span>
              <span className="text-white/80">{req.isOutdoor ? 'Outdoor Venue' : 'Indoor Venue'}</span>
              <SimulationBadge isSimulated={event.blueprint?.isSimulated} className="ml-1" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {req.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-normal leading-relaxed">
              {event.blueprint?.summary || req.theme}
            </p>
          </div>

          {/* Countdown & Quick Action */}
          <div className="flex sm:items-center gap-4 shrink-0 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
            <div className="text-center sm:text-right">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#F4DE86] tabular-nums">
                {daysRemaining > 0 ? daysRemaining : daysRemaining === 0 ? 'Today' : 'Past'}
              </div>
              <div className="text-[11px] text-white/70 uppercase tracking-wider font-medium">
                {daysRemaining >= 0 ? 'Days to celebration' : 'Days ago'}
              </div>
            </div>
            <div className="h-10 w-px bg-white/15 hidden sm:block" />
            <button
              onClick={() => onNavigateTab('adaptive')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#E0533C] text-white hover:bg-[#F97356] transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>What changed?</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Card */}
        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#695A60] mb-2">
            <span className="font-medium">Total Budget</span>
            <Wallet className="w-4 h-4 text-[#E0533C]" />
          </div>
          <div className="text-xl font-bold text-[#2D112C] font-mono tabular-nums">
            {formatCurrency(req.totalBudget, req.currency)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#695A60]">
            <span>Allocated:</span>
            <span className="font-mono tabular-nums font-semibold text-[#2D112C]">
              {formatCurrency(totalAllocated, req.currency)} ({budgetUtilization}%)
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-[#EBE2D7] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUtilization > 100
                  ? 'bg-[#DC2626]'
                  : budgetUtilization >= 90
                  ? 'bg-[#D97706]'
                  : 'bg-[#2D112C]'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Remaining Funds Card */}
        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#695A60] mb-2">
            <span className="font-medium">Remaining Funds</span>
            <TrendingDown className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              remainingBudget < 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'
            }`}
          >
            {formatCurrency(remainingBudget, req.currency)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#695A60]">
            <span>Actual Payments Paid:</span>
            <span className="font-mono tabular-nums font-semibold text-[#2D112C]">
              {formatCurrency(totalActual, req.currency)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#695A60]">
            <span>Vendor Commitments:</span>
            <span className="font-mono tabular-nums font-medium text-[#2D112C]">
              {formatCurrency(totalConfirmed, req.currency)}
            </span>
          </div>
        </div>

        {/* Guest RSVP Card */}
        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#695A60] mb-2">
            <span className="font-medium">Guest Headcount</span>
            <Users className="w-4 h-4 text-[#2D112C]" />
          </div>
          <div className="text-xl font-bold text-[#2D112C] font-mono tabular-nums">
            {req.guestCount} <span className="text-xs font-normal text-[#695A60]">Target Pax</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#695A60]">
            <span>Confirmed: {guestSummary.confirmed}</span>
            <span>Pending: {guestSummary.pending}</span>
            <span>Declined: {guestSummary.declined}</span>
          </div>
          <div className="mt-2 w-full bg-[#EBE2D7] h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-[#16A34A] h-full"
              style={{
                width: `${
                  guestSummary.totalInvited > 0
                    ? (guestSummary.confirmed / guestSummary.totalInvited) * 100
                    : 0
                }%`,
              }}
            />
            <div
              className="bg-[#D97706] h-full"
              style={{
                width: `${
                  guestSummary.totalInvited > 0
                    ? (guestSummary.pending / guestSummary.totalInvited) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Task Progress Card */}
        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#695A60] mb-2">
            <span className="font-medium">Tasks Completion</span>
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-bold text-[#2D112C] font-mono tabular-nums">
            {taskSummary.completionPercentage}%{' '}
            <span className="text-xs font-normal text-[#695A60]">
              ({taskSummary.completed}/{taskSummary.total})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#695A60]">Overdue:</span>
            <span className="font-mono tabular-nums font-semibold text-[#DC2626]">
              {taskSummary.overdue} tasks
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-[#695A60]">Upcoming:</span>
            <span className="font-mono tabular-nums font-medium text-[#2D112C]">
              {taskSummary.upcoming} tasks
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Budget Allocation vs Timeline & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Allocation Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5DDD2]">
            <div>
              <h3 className="font-serif font-bold text-base text-[#2D112C]">
                Category-Wise Budget
              </h3>
              <p className="text-xs text-[#695A60]">Authoritative financial allocations</p>
            </div>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-xs text-[#E0533C] hover:text-[#C53F28] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Manage Budget</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {categories.map((cat) => {
              const catPercent = req.totalBudget > 0 ? Math.round((cat.allocatedAmount / req.totalBudget) * 100) : 0;
              return (
                <div key={cat.id} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#2D112C]">{cat.name}</span>
                      {cat.isFixedCost && (
                        <span className="text-[10px] text-[#7E6F75] font-mono">
                          (fixed)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-[#695A60]">{catPercent}%</span>
                      <span className="font-semibold text-[#2D112C]">
                        {formatCurrency(cat.allocatedAmount, req.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#EBE2D7] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2D112C] h-full group-hover:bg-[#E0533C] transition-colors"
                      style={{ width: `${Math.min(catPercent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks & Milestones */}
        <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5DDD2]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#2D112C]">
                  Priority Deadlines
                </h3>
                <p className="text-xs text-[#695A60]">Upcoming critical path milestones</p>
              </div>
              <button
                onClick={() => onNavigateTab('timeline')}
                className="text-xs text-[#E0533C] hover:text-[#C53F28] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {nextTasks.length === 0 ? (
                <p className="text-xs text-[#7B6A71] italic py-4 text-center">
                  All scheduled tasks completed!
                </p>
              ) : (
                nextTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#2D112C] truncate">
                          {task.title}
                        </span>
                        {task.isMilestone && (
                          <span className="text-[10px] text-[#A66C00] font-medium font-sans">
                            · Milestone
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#695A60] line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-medium text-[#2D112C] tabular-nums">
                        {task.dueDate}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[#E0533C]">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick CTA to Copilot */}
          <div className="mt-4 pt-3 border-t border-[#E5DDD2] flex items-center justify-between text-xs">
            <span className="text-[#695A60] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E0533C]" />
              Need personalized advice for this event?
            </span>
            <button
              onClick={() => onNavigateTab('copilot')}
              className="text-[#2D112C] font-semibold hover:text-[#E0533C] transition-colors"
            >
              Ask Copilot →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Risks & Vendors Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risks Snapshot (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5DDD2]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <h3 className="font-serif font-bold text-base text-[#2D112C]">
                Active Risk Register
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('risks')}
              className="text-xs text-[#E0533C] hover:text-[#C53F28] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Inspect All Risks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sortedRisks.slice(0, 2).map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#2D112C]">
                    {r.description}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      r.severityScore >= 6
                        ? 'bg-[#FEE2E2] text-[#991B1B]'
                        : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}
                  >
                    Severity {r.severityScore}/9
                  </span>
                </div>
                <div className="text-[11px] text-[#695A60] grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#E5DDD2]/50">
                  <div>
                    <span className="font-medium text-[#2D112C]">Mitigation: </span>
                    {r.mitigationStrategy}
                  </div>
                  <div>
                    <span className="font-medium text-[#2D112C]">Contingency: </span>
                    {r.contingencyPlan}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendors Snapshot (1 Column) */}
        <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5DDD2]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2D112C]" />
                <h3 className="font-serif font-bold text-base text-[#2D112C]">
                  Vendor Status
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('vendors')}
                className="text-xs text-[#E0533C] hover:text-[#C53F28] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(event.vendors || []).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#2D112C]">{v.name}</div>
                    <div className="text-[11px] text-[#695A60] capitalize">
                      {v.category} · {v.quotes?.length || 0} quotes
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                      v.status === 'confirmed'
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : v.status === 'shortlisted'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#F3EBF4] text-[#4A1D45]'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5DDD2] text-center">
            <button
              onClick={() => onNavigateTab('vendors')}
              className="w-full py-2 bg-[#F2ECE3] hover:bg-[#EBE2D7] text-[#2D112C] font-semibold text-xs rounded-lg transition-colors"
            >
              Compare Vendor Quotes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
