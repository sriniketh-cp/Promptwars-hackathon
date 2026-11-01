import React, { useState } from 'react';
import {
  Store,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Building2,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  Vendor,
  VendorCategory,
  VendorQuotation,
  FestivoEvent,
} from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/calculations';
import { SimulationBadge } from '../Common/SimulationBadge';

interface VendorCoordinationViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
}

export const VendorCoordinationView: React.FC<VendorCoordinationViewProps> = ({
  event,
  onUpdateEvent,
}) => {
  const req = event.requirements;
  const vendors = event.vendors || [];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVendorId, setActiveVendorId] = useState<string | null>(
    vendors[0]?.id || null
  );

  // Add Vendor State
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('catering');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  // Add Quote State
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [quotePrice, setQuotePrice] = useState<number>(50000);
  const [quoteIncluded, setQuoteIncluded] = useState('');
  const [quoteExcluded, setQuoteExcluded] = useState('');
  const [quoteTaxes, setQuoteTaxes] = useState<number>(2500);
  const [quoteDeposit, setQuoteDeposit] = useState<number>(15000);
  const [quoteMilestones, setQuoteMilestones] = useState('30% advance, balance post-event');
  const [quoteCancellation, setQuoteCancellation] = useState('Full refund up to 14 days before event');
  const [quoteValidity, setQuoteValidity] = useState('2026-11-20');
  const [quoteAvailability, setQuoteAvailability] = useState('Confirmed available on event date');

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeVendor = vendors.find((v) => v.id === activeVendorId) || vendors[0];

  const handleCreateVendor = () => {
    if (!vendorName.trim()) return;
    const newV: Vendor = {
      id: `v-${Date.now()}`,
      name: vendorName.trim(),
      category: vendorCategory,
      contactPerson,
      phone: contactPhone,
      email: contactEmail,
      status: 'contacted',
      notes: vendorNotes,
      quotes: [],
    };
    const updated = [...vendors, newV];
    onUpdateEvent({ vendors: updated });
    setActiveVendorId(newV.id);
    setShowAddVendor(false);
    setVendorName('');
    setContactPerson('');
    setContactPhone('');
    setContactEmail('');
  };

  const handleAddQuote = () => {
    if (!activeVendor) return;
    const newQuote: VendorQuotation = {
      id: `q-${Date.now()}`,
      vendorName: activeVendor.name,
      quotedPrice: Number(quotePrice) || 0,
      includedServices: quoteIncluded ? quoteIncluded.split('\n').filter(Boolean) : ['Standard service delivery'],
      excludedServices: quoteExcluded ? quoteExcluded.split('\n').filter(Boolean) : ['None specified'],
      taxesAndFees: Number(quoteTaxes) || 0,
      depositRequired: Number(quoteDeposit) || 0,
      paymentMilestones: quoteMilestones,
      cancellationTerms: quoteCancellation,
      validUntil: quoteValidity,
      availabilityNotes: quoteAvailability,
    };

    const updated = vendors.map((v) => {
      if (v.id === activeVendor.id) {
        return {
          ...v,
          quotes: [...(v.quotes || []), newQuote],
          status: 'quoted' as const,
        };
      }
      return v;
    });

    onUpdateEvent({ vendors: updated });
    setShowAddQuote(false);
  };

  const handleRunAiAnalysis = async (vendor: Vendor) => {
    if (!vendor || !vendor.quotes || vendor.quotes.length === 0) return;
    setIsAnalyzing(true);

    try {
      const analysis = await api.analyzeVendorQuotes(vendor.quotes, vendor.category, req);
      const updated = vendors.map((v) => {
        if (v.id === vendor.id) {
          return {
            ...v,
            aiAnalysis: analysis,
          };
        }
        return v;
      });
      onUpdateEvent({ vendors: updated });
    } catch (err) {
      console.error('Failed to analyze vendor quotes:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteVendor = (id: string) => {
    const updated = vendors.filter((v) => v.id !== id);
    onUpdateEvent({ vendors: updated });
    if (activeVendorId === id) {
      setActiveVendorId(updated[0]?.id || null);
    }
  };

  const categoriesList: VendorCategory[] = [
    'venue',
    'catering',
    'decoration',
    'photography',
    'videography',
    'dj_entertainment',
    'florist',
    'transportation',
    'equipment',
    'other',
  ];

  const filteredVendors =
    selectedCategory === 'all'
      ? vendors
      : vendors.filter((v) => v.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <Store className="w-6 h-6 text-[#E0533C]" />
            <span>Vendor Coordination & Quote Intelligence</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Log vendor quotations, perform side-by-side comparisons, and detect hidden costs with Gemini.
          </p>
        </div>

        <button
          onClick={() => setShowAddVendor(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-[#F97356]" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#2D112C] text-white'
              : 'bg-white text-[#695A60] border border-[#DDD3C5] hover:bg-[#FAF7F2]'
          }`}
        >
          All Categories ({vendors.length})
        </button>
        {categoriesList.map((cat) => {
          const count = vendors.filter((v) => v.category === cat).length;
          if (count === 0 && selectedCategory !== cat) return null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2D112C] text-white'
                  : 'bg-white text-[#695A60] border border-[#DDD3C5] hover:bg-[#FAF7F2]'
              }`}
            >
              {cat.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Add Vendor Form Modal/Card */}
      {showAddVendor && (
        <div className="p-5 rounded-xl bg-white border border-[#2D112C]/20 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-[#2D112C] uppercase tracking-wider">
            Register New Vendor
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="vendor-name-input" className="block text-[11px] text-[#695A60] mb-1">Vendor Name *</label>
              <input
                id="vendor-name-input"
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g., Royal Bloom Florists"
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
              />
            </div>
            <div>
              <label htmlFor="vendor-category-select" className="block text-[11px] text-[#695A60] mb-1">Service Category *</label>
              <select
                id="vendor-category-select"
                value={vendorCategory}
                onChange={(e) => setVendorCategory(e.target.value as VendorCategory)}
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vendor-contact-input" className="block text-[11px] text-[#695A60] mb-1">Contact Person</label>
              <input
                id="vendor-contact-input"
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g., Jane Doe"
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
              />
            </div>
            <div>
              <label htmlFor="vendor-phone-input" className="block text-[11px] text-[#695A60] mb-1">Phone Number</label>
              <input
                id="vendor-phone-input"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
              />
            </div>
            <div>
              <label htmlFor="vendor-email-input" className="block text-[11px] text-[#695A60] mb-1">Email Address</label>
              <input
                id="vendor-email-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="vendor@example.com"
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
              />
            </div>
            <div>
              <label htmlFor="vendor-notes-input" className="block text-[11px] text-[#695A60] mb-1">Special Notes</label>
              <input
                id="vendor-notes-input"
                type="text"
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="Recommended by friend, tasting required"
                className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddVendor(false)}
              className="px-3 py-1.5 text-xs text-[#7B6A71] hover:text-[#2D112C]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateVendor}
              className="px-4 py-1.5 text-xs font-semibold bg-[#2D112C] text-white rounded-lg hover:bg-[#3D183B]"
            >
              Save Vendor
            </button>
          </div>
        </div>
      )}

      {/* Main Vendor Split View */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-[#E5DDD2] space-y-3">
          <Store className="w-10 h-10 text-[#DDD3C5] mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#2D112C]">
            No Vendors in this Category
          </h3>
          <p className="text-xs text-[#695A60] max-w-sm mx-auto">
            Add vendors and record their quotations to compare packages side-by-side.
          </p>
          <button
            onClick={() => setShowAddVendor(true)}
            className="px-4 py-2 bg-[#2D112C] text-white text-xs font-semibold rounded-lg"
          >
            Add First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vendor Directory List (1 Column) */}
          <div className="space-y-3">
            {filteredVendors.map((v) => {
              const isSelected = activeVendor?.id === v.id;
              return (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Select vendor ${v.name}`}
                  onClick={() => setActiveVendorId(v.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setActiveVendorId(v.id);
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C] ${
                    isSelected
                      ? 'bg-white border-[#2D112C] shadow-sm ring-1 ring-[#2D112C]'
                      : 'bg-white border-[#E5DDD2] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                        {v.name}
                      </h4>
                      <p className="text-xs text-[#695A60] capitalize mt-0.5">
                        {v.category.replace('_', ' ')} · {v.quotes?.length || 0} quotes
                      </p>
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

                  {v.contactPerson && (
                    <div className="text-[11px] text-[#7B6A71] mt-2">
                      Contact: {v.contactPerson} ({v.phone || 'No phone'})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Vendor Quotes & Side-by-Side Analysis (2 Columns) */}
          {activeVendor && (
            <div className="lg:col-span-2 space-y-6">
              {/* Vendor Detail Card */}
              <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5DDD2]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-[#2D112C]">
                        {activeVendor.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F2ECE3] text-[#4A3D43] capitalize">
                        {activeVendor.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#695A60] mt-0.5">
                      {activeVendor.notes || 'No specific notes recorded'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddQuote(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2D112C] text-white hover:bg-[#3D183B]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#F97356]" />
                      <span>Add Quote</span>
                    </button>

                    <button
                      onClick={() => handleDeleteVendor(activeVendor.id)}
                      className="p-1.5 rounded-lg text-[#7B6A71] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                      title="Delete vendor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add Quote Form */}
                {showAddQuote && (
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DDD3C5] space-y-3">
                    <h5 className="text-xs font-bold text-[#2D112C] uppercase tracking-wider">
                      Enter Quotation Details
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#695A60] mb-1">Quoted Price *</label>
                        <input
                          type="number"
                          value={quotePrice}
                          onChange={(e) => setQuotePrice(Number(e.target.value))}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-[#DDD3C5] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#695A60] mb-1">Taxes & Additional Fees</label>
                        <input
                          type="number"
                          value={quoteTaxes}
                          onChange={(e) => setQuoteTaxes(Number(e.target.value))}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-[#DDD3C5] bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-[#695A60] mb-1">Included Services (one per line)</label>
                        <textarea
                          rows={3}
                          value={quoteIncluded}
                          onChange={(e) => setQuoteIncluded(e.target.value)}
                          placeholder="Full buffet 120 pax&#10;2 live counters&#10;Service staff included"
                          className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-[#695A60] mb-1">Excluded Services (one per line)</label>
                        <textarea
                          rows={2}
                          value={quoteExcluded}
                          onChange={(e) => setQuoteExcluded(e.target.value)}
                          placeholder="Waste haulage&#10;Overtime past 11 PM"
                          className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#695A60] mb-1">Payment Milestones</label>
                        <input
                          type="text"
                          value={quoteMilestones}
                          onChange={(e) => setQuoteMilestones(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#695A60] mb-1">Cancellation Terms</label>
                        <input
                          type="text"
                          value={quoteCancellation}
                          onChange={(e) => setQuoteCancellation(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowAddQuote(false)}
                        className="px-3 py-1.5 text-xs text-[#7B6A71]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddQuote}
                        className="px-4 py-1.5 text-xs font-semibold bg-[#2D112C] text-white rounded-lg"
                      >
                        Save Quotation
                      </button>
                    </div>
                  </div>
                )}

                {/* Quotations List */}
                {activeVendor.quotes?.length === 0 ? (
                  <p className="text-xs text-[#7B6A71] italic text-center py-4">
                    No quotations entered yet for {activeVendor.name}. Click "Add Quote" above to record one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#2D112C]">
                        Quotations on File ({activeVendor.quotes.length})
                      </h4>
                      <button
                        onClick={() => handleRunAiAnalysis(activeVendor)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFF0ED] text-[#C53F28] hover:bg-[#FFE4DE] border border-[#F9C3B8] transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAnalyzing ? 'Analyzing...' : 'Analyze with Gemini'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeVendor.quotes.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#2D112C]">
                              Package #{idx + 1}
                            </span>
                            <div className="text-base font-mono font-bold text-[#2D112C] tabular-nums">
                              {formatCurrency(q.quotedPrice, req.currency)}
                            </div>
                          </div>

                          <div className="text-[11px] text-[#695A60] space-y-1">
                            <div>
                              <strong>Taxes/Fees:</strong> {formatCurrency(q.taxesAndFees, req.currency)}
                            </div>
                            <div>
                              <strong>Payment:</strong> {q.paymentMilestones}
                            </div>
                            <div>
                              <strong>Cancellation:</strong> {q.cancellationTerms}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#E5DDD2] text-[11px]">
                            <strong className="text-[#166534]">Included:</strong>
                            <ul className="list-disc pl-4 text-[#4F3F46] mt-0.5 space-y-0.5">
                              {q.includedServices?.map((inc, i) => (
                                <li key={i}>{inc}</li>
                              ))}
                            </ul>
                          </div>

                          {q.excludedServices?.length > 0 && (
                            <div className="pt-2 border-t border-[#E5DDD2] text-[11px]">
                              <strong className="text-[#991B1B]">Excluded:</strong>
                              <ul className="list-disc pl-4 text-[#695A60] mt-0.5 space-y-0.5">
                                {q.excludedServices?.map((exc, i) => (
                                  <li key={i}>{exc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Quote Analysis Panel */}
              {activeVendor.aiAnalysis && (
                <div className="bg-white rounded-xl p-5 border border-[#2D112C]/20 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5DDD2]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#E0533C]" />
                      <h4 className="font-serif font-bold text-base text-[#2D112C]">
                        Gemini Vendor Quote Intelligence
                      </h4>
                    </div>
                    <SimulationBadge isSimulated={activeVendor.aiAnalysis.isSimulated} />
                  </div>

                  <p className="text-xs text-[#4F3F46] leading-relaxed">
                    {activeVendor.aiAnalysis.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Pros & Cons */}
                    <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                      <div className="font-bold text-[#166534]">Identified Advantages</div>
                      <ul className="list-disc pl-4 space-y-1 text-[#4F3F46]">
                        {activeVendor.aiAnalysis.pros?.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                      <div className="font-bold text-[#991B1B]">Trade-offs & Constraints</div>
                      <ul className="list-disc pl-4 space-y-1 text-[#4F3F46]">
                        {activeVendor.aiAnalysis.cons?.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Hidden Costs Warnings */}
                    <div className="p-3.5 rounded-lg bg-[#FFF9F6] border border-[#F97356]/40 space-y-2">
                      <div className="font-bold text-[#C53F28] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Potential Hidden Cost Traps</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[#695A60]">
                        {activeVendor.aiAnalysis.hiddenCostsWarnings?.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Questions to Ask */}
                    <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
                      <div className="font-bold text-[#2D112C] flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[#2D112C]" />
                        <span>Questions to Ask Before Signing</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[#695A60]">
                        {activeVendor.aiAnalysis.questionsToAsk?.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF0ED] border border-[#F97356]/30 text-xs">
                    <strong className="text-[#C53F28]">Recommended Next Step: </strong>
                    <span className="text-[#4F3F46]">{activeVendor.aiAnalysis.recommendation}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
