import React from 'react';
import { FileSpreadsheet, Printer, Download } from 'lucide-react';
import { FestivoEvent } from '../../types';
import {
  formatCurrency,
  calculateTotalAllocated,
  calculateTotalConfirmed,
  calculateTotalActual,
  calculateGuestSummary,
  calculateTaskSummary,
} from '../../utils/calculations';
import { BrandMark } from '../Common/BrandMark';

interface ReportsExportViewProps {
  event: FestivoEvent;
}

export const ReportsExportView: React.FC<ReportsExportViewProps> = ({ event }) => {
  const req = event.requirements;
  const categories = event.budgetCategories || [];
  const totalAllocated = calculateTotalAllocated(categories);
  const totalConfirmed = calculateTotalConfirmed(categories);
  const totalActual = calculateTotalActual(categories);
  const guestSummary = calculateGuestSummary(event.guests || []);
  const taskSummary = calculateTaskSummary(event.tasks || [], req.date);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(event, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute(
      'download',
      `${req.name.replace(/\s+/g, '_')}_Blueprint_Export.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#E0533C]" />
            <span>Event Report & Blueprint Export</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Full comprehensive event brief formatted for stakeholder review, PDF printing, and data portability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-[#2D112C] border border-[#DDD3C5] hover:bg-[#FAF7F2] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#7B6A71]" />
            <span>Export JSON Archive</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#F97356]" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Blueprint Document */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#E5DDD2] shadow-sm space-y-8 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-[#E5DDD2] pb-6">
          <div>
            <BrandMark size="lg" showTagline />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D112C] tracking-tight mt-4">
              {req.name}
            </h1>
            <p className="text-xs text-[#695A60] mt-1 font-mono">
              Generated via Festivo AI Platform · Last Updated: {new Date(req.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="text-right text-xs text-[#695A60] space-y-1">
            <div className="font-bold text-[#2D112C] text-sm capitalize">{req.type}</div>
            <div>Date: <strong className="text-[#2D112C]">{req.date}</strong></div>
            <div>Location: <strong className="text-[#2D112C]">{req.city}</strong></div>
            <div>Attendance: <strong className="text-[#2D112C]">{req.guestCount} guests</strong></div>
          </div>
        </div>

        {/* Executive Summary & Theme Rationale */}
        <div className="space-y-4 print-break-inside-avoid">
          <h2 className="font-serif font-bold text-lg text-[#2D112C] border-b border-[#E5DDD2] pb-1.5">
            1. Executive Overview & Theme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[#4F3F46]">
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2]">
              <strong className="text-[#2D112C] block mb-1">Event Vision</strong>
              <p>{event.blueprint?.summary || req.theme}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2]">
              <strong className="text-[#2D112C] block mb-1">Atmospheric Concept</strong>
              <p>{event.blueprint?.themeRationale || 'Custom styling and lighting curation'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <strong className="text-[#2D112C] block">Guest Status</strong>
                <span className="text-[#695A60]">
                  {guestSummary.confirmed} confirmed · {guestSummary.pending} pending · {guestSummary.declined} declined
                </span>
              </div>
              <div className="sm:text-right">
                <strong className="text-[#2D112C] block">Milestone Tracking</strong>
                <span className="text-[#695A60]">
                  {taskSummary.completed} of {taskSummary.total} completed ({taskSummary.todo} todo)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary & Allocations */}
        <div className="space-y-4 print-break-inside-avoid">
          <h2 className="font-serif font-bold text-lg text-[#2D112C] border-b border-[#E5DDD2] pb-1.5">
            2. Budget Ledger & Category Breakdown
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E5DDD2]">
              <span className="text-[#695A60] block text-[11px]">Total Ceiling</span>
              <strong className="font-mono text-[#2D112C] text-sm">
                {formatCurrency(req.totalBudget, req.currency)}
              </strong>
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E5DDD2]">
              <span className="text-[#695A60] block text-[11px]">Allocated</span>
              <strong className="font-mono text-[#2D112C] text-sm">
                {formatCurrency(totalAllocated, req.currency)}
              </strong>
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E5DDD2]">
              <span className="text-[#695A60] block text-[11px]">Vendor Commitments</span>
              <strong className="font-mono text-[#D97706] text-sm">
                {formatCurrency(totalConfirmed, req.currency)}
              </strong>
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E5DDD2]">
              <span className="text-[#695A60] block text-[11px]">Actual Disbursed</span>
              <strong className="font-mono text-[#16A34A] text-sm">
                {formatCurrency(totalActual, req.currency)}
              </strong>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5DDD2] text-[#695A60]">
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Allocated</th>
                <th className="py-2 text-right">Confirmed Quote</th>
                <th className="py-2 text-right">Actual Paid</th>
                <th className="py-2">Nature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD2]">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 font-medium text-[#2D112C]">{c.name}</td>
                  <td className="py-2 text-right font-mono text-[#2D112C]">
                    {formatCurrency(c.allocatedAmount, req.currency)}
                  </td>
                  <td className="py-2 text-right font-mono text-[#695A60]">
                    {c.confirmedQuote > 0 ? formatCurrency(c.confirmedQuote, req.currency) : '—'}
                  </td>
                  <td className="py-2 text-right font-mono text-[#16A34A]">
                    {c.actualExpense > 0 ? formatCurrency(c.actualExpense, req.currency) : '—'}
                  </td>
                  <td className="py-2 text-[#7B6A71]">{c.isFixedCost ? 'Fixed' : 'Flexible'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-4 print-break-inside-avoid">
          <h2 className="font-serif font-bold text-lg text-[#2D112C] border-b border-[#E5DDD2] pb-1.5">
            3. Actionable Milestones & Timeline
          </h2>
          <div className="space-y-2 text-xs">
            {(event.tasks || []).map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg border border-[#E5DDD2] flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[#2D112C]">{t.title}</span>
                  <span className="text-[#695A60] ml-2">({t.owner})</span>
                  <p className="text-[11px] text-[#695A60] mt-0.5">{t.description}</p>
                </div>
                <div className="text-right font-mono text-[11px] text-[#2D112C] shrink-0">
                  {t.dueDate} [{t.status}]
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Register & Contingency Architecture */}
        <div className="space-y-4 print-break-inside-avoid">
          <h2 className="font-serif font-bold text-lg text-[#2D112C] border-b border-[#E5DDD2] pb-1.5">
            4. Risk Register & Contingencies
          </h2>
          <div className="space-y-2 text-xs">
            {(event.risks || []).map((r) => (
              <div key={r.id} className="p-3 rounded-lg border border-[#E5DDD2] space-y-1">
                <div className="flex items-center justify-between font-semibold text-[#2D112C]">
                  <span>{r.description}</span>
                  <span className="font-mono text-[10px]">Severity: {r.severityScore}/9</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#695A60]">
                  <div><strong>Mitigation:</strong> {r.mitigationStrategy}</div>
                  <div><strong>Contingency:</strong> {r.contingencyPlan}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off & Document Footer */}
        <div className="pt-8 border-t border-[#E5DDD2] flex items-center justify-between text-xs text-[#8C7A83]">
          <div>
            <span>Festivo AI · PromptWars 05 Certification</span>
          </div>
          <div>
            <span>Verified Blueprint Snapshot #{event.revisions?.length || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
