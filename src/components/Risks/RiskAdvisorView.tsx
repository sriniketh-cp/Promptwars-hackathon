import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { EventRisk, FestivoEvent, RiskImpact, RiskLikelihood } from '../../types';
import { calculateRiskSeverity } from '../../utils/calculations';

interface RiskAdvisorViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
}

export const RiskAdvisorView: React.FC<RiskAdvisorViewProps> = ({
  event,
  onUpdateEvent,
}) => {
  const req = event.requirements;
  const risks = event.risks || [];

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventRisk['category']>('weather');
  const [likelihood, setLikelihood] = useState<RiskLikelihood>('medium');
  const [impact, setImpact] = useState<RiskImpact>('high');
  const [mitigationStrategy, setMitigationStrategy] = useState('');
  const [contingencyPlan, setContingencyPlan] = useState('');
  const [status, setStatus] = useState<EventRisk['status']>('identified');

  const openAdd = () => {
    setEditingId(null);
    setDescription('');
    setCategory('weather');
    setLikelihood('medium');
    setImpact('high');
    setMitigationStrategy('');
    setContingencyPlan('');
    setStatus('identified');
    setShowAddModal(true);
  };

  const openEdit = (r: EventRisk) => {
    setEditingId(r.id);
    setDescription(r.description);
    setCategory(r.category);
    setLikelihood(r.likelihood);
    setImpact(r.impact);
    setMitigationStrategy(r.mitigationStrategy);
    setContingencyPlan(r.contingencyPlan);
    setStatus(r.status);
    setShowAddModal(true);
  };

  const handleSaveRisk = () => {
    if (!description.trim()) return;
    const severityScore = calculateRiskSeverity(likelihood, impact);

    if (editingId) {
      const updated = risks.map((r) => {
        if (r.id === editingId) {
          return {
            ...r,
            description: description.trim(),
            category,
            likelihood,
            impact,
            severityScore,
            mitigationStrategy,
            contingencyPlan,
            status,
          };
        }
        return r;
      });
      onUpdateEvent({ risks: updated });
    } else {
      const newRisk: EventRisk = {
        id: `risk-${Date.now()}`,
        description: description.trim(),
        category,
        likelihood,
        impact,
        severityScore,
        affectedTasks: [],
        mitigationStrategy,
        contingencyPlan,
        status,
      };
      onUpdateEvent({ risks: [...risks, newRisk] });
    }

    setShowAddModal(false);
  };

  const handleDeleteRisk = (id: string) => {
    const updated = risks.filter((r) => r.id !== id);
    onUpdateEvent({ risks: updated });
  };

  // Sort by severity (high to low)
  const sortedRisks = [...risks].sort((a, b) => b.severityScore - a.severityScore);

  const filteredRisks =
    filterCategory === 'all'
      ? sortedRisks
      : sortedRisks.filter((r) => r.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#E0533C]" />
            <span>Risk Register & Contingency Advisor</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Identify operational threats, calculate severity matrices deterministically, and establish proactive contingencies.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-[#F97356]" />
          <span>Add Custom Risk</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Critical & High Severity (Score 6–9)</span>
          <div className="text-xl font-bold font-mono text-[#DC2626] tabular-nums mt-1">
            {risks.filter((r) => r.severityScore >= 6).length} threats
          </div>
          <p className="text-[11px] text-[#695A60] mt-1">
            Immediate mitigation protocols required
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Moderate Severity (Score 3–5)</span>
          <div className="text-xl font-bold font-mono text-[#D97706] tabular-nums mt-1">
            {risks.filter((r) => r.severityScore >= 3 && r.severityScore < 6).length} threats
          </div>
          <p className="text-[11px] text-[#695A60] mt-1">
            Active monitoring and vendor buffer clauses
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs">
          <span className="text-xs text-[#695A60] font-medium">Mitigated / Resolved</span>
          <div className="text-xl font-bold font-mono text-[#16A34A] tabular-nums mt-1">
            {risks.filter((r) => r.status === 'resolved').length} threats
          </div>
          <p className="text-[11px] text-[#695A60] mt-1">
            Verified contingency plans locked
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['all', 'weather', 'budget', 'vendor', 'guest', 'venue', 'permits', 'logistics'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-[#2D112C] text-white'
                : 'bg-white text-[#695A60] border border-[#DDD3C5] hover:bg-[#FAF7F2]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Risk Cards Grid */}
      <div className="space-y-3">
        {filteredRisks.map((risk) => {
          const isHigh = risk.severityScore >= 6;
          const isMed = risk.severityScore >= 3 && risk.severityScore < 6;

          return (
            <div
              key={risk.id}
              className={`p-5 rounded-xl border transition-all space-y-3 ${
                isHigh
                  ? 'bg-[#FFF5F5] border-[#FCA5A5]'
                  : isMed
                  ? 'bg-white border-[#E5DDD2] shadow-2xs'
                  : 'bg-[#FAF7F2] border-[#E5DDD2]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      isHigh ? 'text-[#DC2626]' : isMed ? 'text-[#D97706]' : 'text-[#7B6A71]'
                    }`}
                  />
                  <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                    {risk.description}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F2ECE3] text-[#4A3D43] capitalize">
                    {risk.category}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                      isHigh
                        ? 'bg-[#FEE2E2] text-[#991B1B]'
                        : isMed
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#DCFCE7] text-[#166534]'
                    }`}
                  >
                    Severity Score: {risk.severityScore}/9 ({risk.likelihood} likelihood × {risk.impact} impact)
                  </div>

                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                      risk.status === 'resolved'
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : risk.status === 'mitigating'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}
                  >
                    {risk.status}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(risk)}
                      className="p-1 rounded text-[#7B6A71] hover:text-[#2D112C]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRisk(risk.id)}
                      className="p-1 rounded text-[#7B6A71] hover:text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mitigation & Contingency Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E5DDD2] text-xs">
                <div className="p-3 rounded-lg bg-white/80 border border-[#E5DDD2] space-y-1">
                  <span className="font-bold text-[#2D112C] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Proactive Mitigation Strategy</span>
                  </span>
                  <p className="text-[#4F3F46] leading-relaxed">
                    {risk.mitigationStrategy || 'No mitigation strategy specified'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/80 border border-[#E5DDD2] space-y-1">
                  <span className="font-bold text-[#2D112C] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Operational Contingency Plan</span>
                  </span>
                  <p className="text-[#4F3F46] leading-relaxed">
                    {risk.contingencyPlan || 'No contingency plan specified'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Risk Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5DDD2] shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-base text-[#2D112C]">
              {editingId ? 'Edit Threat Evaluation' : 'Register Event Risk'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                  Risk Description *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Heavy rain shower flooding lawn"
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                  >
                    <option value="weather">Weather</option>
                    <option value="budget">Budget</option>
                    <option value="vendor">Vendor</option>
                    <option value="guest">Guest</option>
                    <option value="venue">Venue</option>
                    <option value="permits">Permits</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Likelihood
                  </label>
                  <select
                    value={likelihood}
                    onChange={(e) => setLikelihood(e.target.value as RiskLikelihood)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                  >
                    <option value="low">Low (1)</option>
                    <option value="medium">Medium (2)</option>
                    <option value="high">High (3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Impact
                  </label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(e.target.value as RiskImpact)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                  >
                    <option value="low">Low (1)</option>
                    <option value="medium">Medium (2)</option>
                    <option value="high">High (3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                  Proactive Mitigation Strategy
                </label>
                <textarea
                  rows={2}
                  value={mitigationStrategy}
                  onChange={(e) => setMitigationStrategy(e.target.value)}
                  placeholder="Actions taken beforehand to prevent the risk..."
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                  Contingency Plan (If risk occurs)
                </label>
                <textarea
                  rows={2}
                  value={contingencyPlan}
                  onChange={(e) => setContingencyPlan(e.target.value)}
                  placeholder="Immediate fallback protocol during the event..."
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                >
                  <option value="identified">Identified</option>
                  <option value="mitigating">Mitigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="accepted">Accepted</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DDD2]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs text-[#7B6A71] hover:text-[#2D112C]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRisk}
                className="px-5 py-2 text-xs font-semibold bg-[#2D112C] text-white rounded-lg hover:bg-[#3D183B]"
              >
                Save Risk Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
