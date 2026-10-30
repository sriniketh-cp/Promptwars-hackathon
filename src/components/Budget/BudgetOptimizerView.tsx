import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { BudgetCategory, FestivoEvent } from '../../types';
import {
  formatCurrency,
  calculateTotalAllocated,
  calculateTotalEstimated,
  calculateTotalConfirmed,
  calculateTotalActual,
  calculateRemainingBudget,
  calculateBudgetReduction,
} from '../../utils/calculations';
import { api } from '../../services/api';
import { SimulationBadge } from '../Common/SimulationBadge';

interface BudgetOptimizerViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
}

export const BudgetOptimizerView: React.FC<BudgetOptimizerViewProps> = ({
  event,
  onUpdateEvent,
}) => {
  const req = event.requirements;
  const categories = event.budgetCategories || [];

  // Totals calculated strictly in application code
  const totalAllocated = calculateTotalAllocated(categories);
  const totalEstimated = calculateTotalEstimated(categories);
  const totalConfirmed = calculateTotalConfirmed(categories);
  const totalActual = calculateTotalActual(categories);
  const remainingBudget = calculateRemainingBudget(req.totalBudget, totalAllocated);
  const percentAllocated = req.totalBudget > 0 ? Math.round((totalAllocated / req.totalBudget) * 100) : 0;
  const isOverBudget = totalAllocated > req.totalBudget;

  // Editing Category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editEstimated, setEditEstimated] = useState<number>(0);
  const [editConfirmed, setEditConfirmed] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editIsFixed, setEditIsFixed] = useState(false);

  // New Category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState<number>(10000);
  const [newCatFixed, setNewCatFixed] = useState(false);

  // Budget Reduction / Adaptation State
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [targetBudgetInput, setTargetBudgetInput] = useState<number>(150000);
  const [priorityNotes, setPriorityNotes] = useState('Preserve catering taste and venue quality');
  const [isAdapting, setIsAdapting] = useState(false);
  const [reductionProposal, setReductionProposal] = useState<{
    overview: string;
    reductionAmount: number;
    percentageReduction: number;
    proposedCuts: Array<{
      categoryName: string;
      originalAmount: number;
      proposedAmount: number;
      savings: number;
      tradeOffDescription: string;
      actionableRecommendation: string;
      approved?: boolean;
    }>;
    tradeOffsSummary: string[];
    negotiationTips: string[];
    isSimulated?: boolean;
  } | null>(null);

  // Start editing category
  const startEdit = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditAllocated(cat.allocatedAmount);
    setEditEstimated(cat.estimatedCost);
    setEditConfirmed(cat.confirmedQuote);
    setEditActual(cat.actualExpense);
    setEditNotes(cat.notes);
    setEditIsFixed(cat.isFixedCost);
  };

  const saveEdit = (id: string) => {
    const updated = categories.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: editName,
          allocatedAmount: Number(editAllocated) || 0,
          estimatedCost: Number(editEstimated) || 0,
          confirmedQuote: Number(editConfirmed) || 0,
          actualExpense: Number(editActual) || 0,
          notes: editNotes,
          isFixedCost: editIsFixed,
        };
      }
      return c;
    });
    onUpdateEvent({ budgetCategories: updated });
    setEditingId(null);
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    onUpdateEvent({ budgetCategories: updated });
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: BudgetCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      allocatedAmount: Number(newCatAmount) || 0,
      estimatedCost: Number(newCatAmount) || 0,
      confirmedQuote: 0,
      actualExpense: 0,
      notes: 'Custom allocation',
      isFixedCost: newCatFixed,
    };
    onUpdateEvent({ budgetCategories: [...categories, newCat] });
    setNewCatName('');
    setShowAddCategory(false);
  };

  // Run the required reduction demonstration (e.g. ₹2,00,000 -> ₹1,50,000)
  const handleRunReductionDemo = async (targetAmt: number) => {
    setIsAdapting(true);
    setReductionProposal(null);
    setShowReductionModal(true);
    setTargetBudgetInput(targetAmt);

    try {
      const res = await api.adaptBudget(event, targetAmt, priorityNotes);
      setReductionProposal({
        ...res,
        proposedCuts: (res.proposedCuts || []).map((c: any) => ({
          ...c,
          approved: true, // Default to approved for clear user review
        })),
      });
    } catch (e) {
      console.error('Failed to adapt budget:', e);
    } finally {
      setIsAdapting(false);
    }
  };

  // Toggle item approval in reduction proposal
  const toggleCutApproval = (index: number) => {
    if (!reductionProposal) return;
    const cuts = [...reductionProposal.proposedCuts];
    cuts[index].approved = !cuts[index].approved;
    setReductionProposal({
      ...reductionProposal,
      proposedCuts: cuts,
    });
  };

  // Apply approved changes to event budget
  const applyReductionProposal = () => {
    if (!reductionProposal) return;

    // Apply cuts to budget categories
    const cutMap = new Map(
      reductionProposal.proposedCuts
        .filter((c) => c.approved)
        .map((c) => [c.categoryName, c.proposedAmount])
    );

    const updatedCategories = categories.map((cat) => {
      if (cutMap.has(cat.name)) {
        return {
          ...cat,
          allocatedAmount: cutMap.get(cat.name)!,
        };
      }
      return cat;
    });

    // Save snapshot in revision history
    const newRevision = {
      id: `rev-${Date.now()}`,
      eventId: req.id,
      timestamp: new Date().toISOString(),
      reason: `Budget reduction from ${formatCurrency(req.totalBudget, req.currency)} to ${formatCurrency(
        targetBudgetInput,
        req.currency
      )} (-${formatCurrency(reductionProposal.reductionAmount, req.currency)})`,
      snapshot: { ...event },
    };

    onUpdateEvent({
      requirements: {
        ...req,
        totalBudget: targetBudgetInput,
      },
      budgetCategories: updatedCategories,
      revisions: [...(event.revisions || []), newRevision],
    });

    setShowReductionModal(false);
    setReductionProposal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Demo Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#E0533C]" />
            <span>Intelligent Budget Optimizer</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Authoritative financial ledger with deterministic variance calculations and Gemini trade-off reasoning.
          </p>
        </div>

        {/* Required Reduction Demo Trigger Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleRunReductionDemo(150000)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs"
            title="Demonstrate reducing budget from ₹2,00,000 to ₹1,50,000"
          >
            <TrendingDown className="w-3.5 h-3.5 text-[#F97356]" />
            <span>Demonstrate ₹50k Reduction</span>
          </button>

          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-[#2D112C] border border-[#DDD3C5] hover:bg-[#FAF7F2] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E0533C]" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Warning banner if over budget */}
      {isOverBudget && (
        <div className="p-3.5 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Budget Warning:</strong> Total allocated funds exceed target ceiling by{' '}
              {formatCurrency(totalAllocated - req.totalBudget, req.currency)} ({percentAllocated}% allocated).
            </span>
          </div>
          <button
            onClick={() => handleRunReductionDemo(req.totalBudget)}
            className="underline font-semibold whitespace-nowrap hover:text-[#7F1D1D]"
          >
            Rebalance with AI
          </button>
        </div>
      )}

      {/* 4 Financial Ledger Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Event Ceiling Budget</span>
          <div className="text-xl font-bold text-[#2D112C] font-mono tabular-nums mt-1">
            {formatCurrency(req.totalBudget, req.currency)}
          </div>
          <div className="text-[11px] text-[#695A60] mt-1">
            {formatCurrency(Math.round(req.totalBudget / req.guestCount), req.currency)} / guest capacity
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Planned Allocation</span>
          <div className="text-xl font-bold text-[#2D112C] font-mono tabular-nums mt-1">
            {formatCurrency(totalAllocated, req.currency)}
          </div>
          <div className="text-[11px] text-[#695A60] mt-1">
            {percentAllocated}% of ceiling allocated
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Confirmed Vendor Quotes</span>
          <div className="text-xl font-bold text-[#D97706] font-mono tabular-nums mt-1">
            {formatCurrency(totalConfirmed, req.currency)}
          </div>
          <div className="text-[11px] text-[#695A60] mt-1">
            {categories.filter((c) => c.confirmedQuote > 0).length} categories locked with contracts
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Actual Payments Disbursed</span>
          <div className="text-xl font-bold text-[#16A34A] font-mono tabular-nums mt-1">
            {formatCurrency(totalActual, req.currency)}
          </div>
          <div className="text-[11px] text-[#695A60] mt-1">
            Remaining unspent: {formatCurrency(req.totalBudget - totalActual, req.currency)}
          </div>
        </div>
      </div>

      {/* Add New Category Card */}
      {showAddCategory && (
        <div className="p-4 rounded-xl bg-white border border-[#2D112C]/20 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-[#2D112C] uppercase tracking-wider">
            Add Budget Category
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#695A60] mb-1">Category Name</label>
              <input
                type="text"
                placeholder="e.g., Transportation & Shuttle"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#695A60] mb-1">Allocated Amount</label>
              <input
                type="number"
                value={newCatAmount}
                onChange={(e) => setNewCatAmount(Number(e.target.value))}
                className="w-full text-xs font-mono p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-1.5 text-xs text-[#2D112C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCatFixed}
                  onChange={(e) => setNewCatFixed(e.target.checked)}
                  className="accent-[#2D112C]"
                />
                <span>Fixed Infrastructure Cost</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddCategory(false)}
              className="px-3 py-1.5 text-xs text-[#7B6A71] hover:text-[#2D112C]"
            >
              Cancel
            </button>
            <button
              onClick={addCategory}
              className="px-4 py-1.5 text-xs font-semibold bg-[#2D112C] text-white rounded-lg hover:bg-[#3D183B]"
            >
              Add Category
            </button>
          </div>
        </div>
      )}

      {/* Authoritative Financial Table */}
      <div className="bg-white rounded-xl border border-[#E5DDD2] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5DDD2] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[#2D112C]">
              Budget Ledger & Category Details
            </h3>
            <p className="text-xs text-[#695A60]">
              Monetary values verified in application code with zero rounding inaccuracies.
            </p>
          </div>
          <span className="text-xs text-[#7B6A71]">
            {categories.length} Active Categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5DDD2] bg-[#FAF7F2] text-[#695A60] font-semibold">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Allocated</th>
                <th className="py-3 px-4 text-right">Estimated</th>
                <th className="py-3 px-4 text-right">Confirmed Quote</th>
                <th className="py-3 px-4 text-right">Actual Paid</th>
                <th className="py-3 px-4">Cost Nature</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD2]">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                if (isEditing) {
                  return (
                    <tr key={cat.id} className="bg-[#FFFDF9]">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs p-1.5 border border-[#DDD3C5] rounded bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Notes"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full text-[11px] p-1 border border-[#DDD3C5] rounded bg-white mt-1 text-[#695A60]"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editAllocated}
                          onChange={(e) => setEditAllocated(Number(e.target.value))}
                          className="w-24 text-xs font-mono p-1.5 border border-[#DDD3C5] rounded bg-white text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editEstimated}
                          onChange={(e) => setEditEstimated(Number(e.target.value))}
                          className="w-24 text-xs font-mono p-1.5 border border-[#DDD3C5] rounded bg-white text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editConfirmed}
                          onChange={(e) => setEditConfirmed(Number(e.target.value))}
                          className="w-24 text-xs font-mono p-1.5 border border-[#DDD3C5] rounded bg-white text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editActual}
                          onChange={(e) => setEditActual(Number(e.target.value))}
                          className="w-24 text-xs font-mono p-1.5 border border-[#DDD3C5] rounded bg-white text-right"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsFixed}
                            onChange={(e) => setEditIsFixed(e.target.checked)}
                            className="accent-[#2D112C]"
                          />
                          <span className="text-[11px]">Fixed Cost</span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="text-[#16A34A] hover:text-[#15803D] font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[#695A60] hover:text-[#2D112C]"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={cat.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2D112C]">{cat.name}</div>
                      {cat.notes && (
                        <div className="text-[11px] text-[#695A60]">{cat.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#2D112C] tabular-nums">
                      {formatCurrency(cat.allocatedAmount, req.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#695A60] tabular-nums">
                      {formatCurrency(cat.estimatedCost, req.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#D97706] font-medium tabular-nums">
                      {cat.confirmedQuote > 0
                        ? formatCurrency(cat.confirmedQuote, req.currency)
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#16A34A] font-medium tabular-nums">
                      {cat.actualExpense > 0
                        ? formatCurrency(cat.actualExpense, req.currency)
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {cat.isFixedCost ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#695A60]">
                            <Lock className="w-3 h-3 text-[#8C7A83]" />
                            <span>Fixed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#16A34A]">
                            <Unlock className="w-3 h-3 text-[#16A34A]" />
                            <span>Flexible</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1 rounded text-[#7B6A71] hover:text-[#2D112C] hover:bg-[#EBE2D7]"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1 rounded text-[#7B6A71] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Reduction Modal / Panel */}
      {showReductionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-[#E5DDD2] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD2]">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#E0533C]" />
                  <h3 className="font-serif font-bold text-lg text-[#2D112C]">
                    Budget Optimization & Trade-Off Analysis
                  </h3>
                </div>
                <p className="text-xs text-[#695A60] mt-0.5">
                  Target: {formatCurrency(targetBudgetInput, req.currency)} (Reduction of{' '}
                  {formatCurrency(req.totalBudget - targetBudgetInput, req.currency)})
                </p>
              </div>
              <SimulationBadge isSimulated={reductionProposal?.isSimulated} />
            </div>

            {isAdapting ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#2D112C]/20 border-t-[#2D112C] rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#695A60]">
                  Analyzing trade-offs with Gemini 3.8 Flash and calculating category distributions...
                </p>
              </div>
            ) : reductionProposal ? (
              <div className="space-y-4">
                {/* Overview Card */}
                <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] text-xs text-[#4F3F46] leading-relaxed">
                  {reductionProposal.overview}
                </div>

                {/* Proposed Cuts with Checkboxes */}
                <div>
                  <h4 className="text-xs font-bold text-[#2D112C] uppercase tracking-wider mb-2">
                    Proposed Line-Item Adjustments (Select items to approve)
                  </h4>
                  <div className="space-y-2">
                    {reductionProposal.proposedCuts.map((cut, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleCutApproval(idx)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          cut.approved
                            ? 'bg-[#FFF9F6] border-[#F97356]/40'
                            : 'bg-white border-[#E5DDD2] opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={!!cut.approved}
                            onChange={() => {}}
                            className="mt-0.5 accent-[#2D112C]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#2D112C]">
                                {cut.categoryName}
                              </span>
                              {cut.savings > 0 && (
                                <span className="text-[10px] font-mono font-semibold text-[#16A34A]">
                                  Save {formatCurrency(cut.savings, req.currency)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#695A60] mt-0.5">
                              {cut.tradeOffDescription}
                            </p>
                            <p className="text-[11px] text-[#7C3627] mt-0.5 font-medium">
                              Recommendation: {cut.actionableRecommendation}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono text-xs">
                          <div className="text-[#695A60] line-through">
                            {formatCurrency(cut.originalAmount, req.currency)}
                          </div>
                          <div className="font-bold text-[#2D112C]">
                            {formatCurrency(cut.proposedAmount, req.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade-offs & Negotiation Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2]">
                    <div className="font-bold text-[#2D112C] mb-1">Key Trade-offs</div>
                    <ul className="list-disc pl-4 space-y-1 text-[#695A60]">
                      {reductionProposal.tradeOffsSummary?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2]">
                    <div className="font-bold text-[#2D112C] mb-1">Vendor Negotiation Tips</div>
                    <ul className="list-disc pl-4 space-y-1 text-[#695A60]">
                      {reductionProposal.negotiationTips?.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Confirmation Action buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E5DDD2]">
                  <button
                    onClick={() => setShowReductionModal(false)}
                    className="px-4 py-2 text-xs text-[#7B6A71] hover:text-[#2D112C]"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={applyReductionProposal}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#2D112C] text-white hover:bg-[#3D183B] transition-colors shadow-xs"
                    >
                      <Check className="w-4 h-4 text-[#F97356]" />
                      <span>Approve & Apply Selected Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
