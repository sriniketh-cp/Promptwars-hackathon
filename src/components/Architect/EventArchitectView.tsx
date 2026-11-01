import React, { useState } from 'react';
import {
  Wand2,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ListTodo,
  DollarSign,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  EventRequirements,
  EventType,
  FestivoEvent,
  EventBlueprint,
  BudgetCategory,
  EventTask,
  EventRisk,
} from '../../types';
import { api } from '../../services/api';
import { formatCurrency, validateEventRequirements } from '../../utils/calculations';
import { sanitizeInput } from '../../utils/security';
import { SimulationBadge } from '../Common/SimulationBadge';

interface EventArchitectViewProps {
  onEventCreated: (event: FestivoEvent) => void;
  activeEvent: FestivoEvent | null;
}

export const EventArchitectView: React.FC<EventArchitectViewProps> = ({
  onEventCreated,
  activeEvent,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Required, 2: Optional, 3: Generated Blueprint
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('birthday');
  const [date, setDate] = useState('2026-11-28');
  const [city, setCity] = useState('');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [totalBudget, setTotalBudget] = useState<number>(150000);
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState('Warm Autumn Garden with Acoustic Ambiance');

  // Optional Fields
  const [venuePreference, setVenuePreference] = useState('');
  const [isOutdoor, setIsOutdoor] = useState(true);
  const [dietary, setDietary] = useState('Vegetarian & Non-Veg, Jain counter');
  const [accessibility, setAccessibility] = useState('Step-free entrance & wheelchair access');
  const [culturalPreferences, setCulturalPreferences] = useState('');
  const [priorities, setPriorities] = useState('Delicious food, acoustic music, candid photography');
  const [notes, setNotes] = useState('');

  // Generated Plan State
  const [generatedPlan, setGeneratedPlan] = useState<{
    blueprint: EventBlueprint;
    budgetCategories: BudgetCategory[];
    tasks: EventTask[];
    risks: EventRisk[];
    isSimulated?: boolean;
  } | null>(null);

  // Section Editing State
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  // Live Field Touched State for Inline Validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Compute live validation rules
  const validation = validateEventRequirements({
    name,
    city,
    date,
    guestCount,
    totalBudget,
  });

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNextToOptional = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all required fields as touched
    setTouched({
      name: true,
      city: true,
      date: true,
      guestCount: true,
      totalBudget: true,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setErrorMsg(firstError || 'Please resolve the highlighted validation errors before continuing.');
      return;
    }

    setErrorMsg(null);
    setStep(2);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    const requirements: EventRequirements = {
      id: `festivo-evt-${Date.now()}`,
      name,
      type,
      date,
      city,
      guestCount: Number(guestCount),
      totalBudget: Number(totalBudget),
      currency,
      theme,
      venuePreference: venuePreference || undefined,
      isOutdoor,
      dietaryPreferences: dietary ? dietary.split(',').map((s) => s.trim()) : [],
      accessibilityNeeds: accessibility ? accessibility.split(',').map((s) => s.trim()) : [],
      culturalPreferences: culturalPreferences || undefined,
      ageGroups: ['Mixed ages', 'Families', 'Young adults'],
      priorities: priorities ? priorities.split(',').map((s) => s.trim()) : [],
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const result = await api.generateBlueprint(requirements);

      // Normalize budget categories
      const normalizedCategories: BudgetCategory[] = (result.budgetCategories || []).map(
        (c: { name: string; allocatedAmount: number; notes?: string; isFixedCost?: boolean }, i: number) => ({
          id: `cat-${i}-${Date.now()}`,
          name: c.name,
          allocatedAmount: Number(c.allocatedAmount) || 0,
          estimatedCost: Number(c.allocatedAmount) || 0,
          confirmedQuote: 0,
          actualExpense: 0,
          notes: c.notes || '',
          isFixedCost: !!c.isFixedCost,
        })
      );

      // Normalize tasks
      const normalizedTasks: EventTask[] = (result.tasks || []).map((t: { title: string; description?: string; dueDate?: string; priority?: EventTask['priority']; relatedCategory?: string; isMilestone?: boolean }, i: number) => ({
        id: `task-${i}-${Date.now()}`,
        title: t.title,
        description: t.description || '',
        dueDate: t.dueDate || requirements.date,
        priority: (t.priority as any) || 'medium',
        status: 'todo',
        owner: 'Event Host',
        relatedCategory: t.relatedCategory || 'General',
        dependencies: [],
        isMilestone: !!t.isMilestone,
      }));

      // Normalize risks
      const normalizedRisks: EventRisk[] = (result.risks || []).map((r: { description: string; category?: EventRisk['category']; likelihood?: string; impact?: string; mitigationStrategy?: string; contingencyPlan?: string }, i: number) => {
        const likelihood = (r.likelihood?.toLowerCase() || 'medium') as any;
        const impact = (r.impact?.toLowerCase() || 'medium') as any;
        const score = (likelihood === 'high' ? 3 : likelihood === 'medium' ? 2 : 1) *
          (impact === 'high' ? 3 : impact === 'medium' ? 2 : 1);

        return {
          id: `risk-${i}-${Date.now()}`,
          description: r.description,
          category: (r.category as any) || 'logistics',
          likelihood,
          impact,
          severityScore: score,
          affectedTasks: [],
          mitigationStrategy: r.mitigationStrategy || '',
          contingencyPlan: r.contingencyPlan || '',
          status: 'identified',
        };
      });

      setGeneratedPlan({
        blueprint: {
          ...result.blueprint,
          generatedAt: new Date().toISOString(),
          isAiGenerated: true,
          isSimulated: result.isSimulated,
        },
        budgetCategories: normalizedCategories,
        tasks: normalizedTasks,
        risks: normalizedRisks,
        isSimulated: result.isSimulated,
      });

      setStep(3);
    } catch (err: unknown) {
      console.error('Failed to generate blueprint:', err);
      setErrorMsg('Failed to generate blueprint. Please verify your connection or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndActivate = () => {
    if (!generatedPlan) return;

    const requirements: EventRequirements = {
      id: `festivo-evt-${Date.now()}`,
      name,
      type,
      date,
      city,
      guestCount: Number(guestCount),
      totalBudget: Number(totalBudget),
      currency,
      theme,
      venuePreference,
      isOutdoor,
      dietaryPreferences: dietary ? dietary.split(',').map((s) => s.trim()) : [],
      accessibilityNeeds: accessibility ? accessibility.split(',').map((s) => s.trim()) : [],
      culturalPreferences,
      ageGroups: ['Mixed ages'],
      priorities: priorities ? priorities.split(',').map((s) => s.trim()) : [],
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newEvent: FestivoEvent = {
      requirements,
      blueprint: generatedPlan.blueprint,
      budgetCategories: generatedPlan.budgetCategories,
      guests: [
        {
          id: `g-${Date.now()}-1`,
          name: 'Primary Host & Family',
          rsvpStatus: 'confirmed',
          plusOnes: 2,
          dietary: 'Standard',
          accessibility: 'None',
        },
      ],
      vendors: [],
      tasks: generatedPlan.tasks,
      risks: generatedPlan.risks,
      revisions: [
        {
          id: `rev-${Date.now()}`,
          eventId: requirements.id,
          timestamp: new Date().toISOString(),
          reason: 'Initial blueprint creation via AI Event Architect',
          snapshot: {} as FestivoEvent,
        },
      ],
      copilotMessages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Congratulations! Your personalized blueprint for "${name}" has been generated and activated. You have ${formatCurrency(
            totalBudget,
            currency
          )} allocated across ${generatedPlan.budgetCategories.length} categories. What would you like to review first?`,
          timestamp: new Date().toISOString(),
          isSimulated: generatedPlan.isSimulated,
        },
      ],
    };

    onEventCreated(newEvent);
  };

  const startEditSection = (key: string, currentText: string) => {
    setEditingSection(key);
    setEditedContent(currentText);
  };

  const saveEditedSection = (key: keyof EventBlueprint) => {
    if (!generatedPlan) return;
    setGeneratedPlan({
      ...generatedPlan,
      blueprint: {
        ...generatedPlan.blueprint,
        [key]: editedContent,
      },
    });
    setEditingSection(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-[#E0533C]" />
            <span>AI Event Architect</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Transform high-level celebration ideas into a verified, structured event blueprint.
          </p>
        </div>

        {/* Wizard Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <div
            className={`px-3 py-1 rounded-md transition-colors ${
              step === 1 ? 'bg-[#2D112C] text-white' : 'bg-[#EBE2D7] text-[#4F3F46]'
            }`}
          >
            1. Essentials
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9E8E94]" />
          <div
            className={`px-3 py-1 rounded-md transition-colors ${
              step === 2 ? 'bg-[#2D112C] text-white' : 'bg-[#EBE2D7] text-[#4F3F46]'
            }`}
          >
            2. Preferences
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9E8E94]" />
          <div
            className={`px-3 py-1 rounded-md transition-colors ${
              step === 3 ? 'bg-[#2D112C] text-white' : 'bg-[#EBE2D7] text-[#4F3F46]'
            }`}
          >
            3. Blueprint
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Required Information */}
      {step === 1 && (
        <form onSubmit={handleNextToOptional} className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs space-y-6">
          <div className="border-b border-[#E5DDD2] pb-3">
            <h3 className="font-serif font-bold text-base text-[#2D112C]">
              Core Event Requirements
            </h3>
            <p className="text-xs text-[#695A60]">
              Please provide essential parameters required to build your blueprint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Name */}
            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onBlur={() => markTouched('name')}
                onChange={(e) => {
                  setName(e.target.value);
                  markTouched('name');
                }}
                placeholder="e.g., Sarah's 30th Birthday Soirée"
                className={`w-full text-xs rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none transition-colors border ${
                  touched.name && validation.errors.name
                    ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-1 focus:ring-[#DC2626]'
                    : touched.name && !validation.errors.name
                    ? 'border-[#16A34A] bg-[#F0FDF4] focus:ring-1 focus:ring-[#16A34A]'
                    : 'bg-[#FAF7F2] border-[#DDD3C5] focus:ring-1 focus:ring-[#2D112C]'
                }`}
              />
              {touched.name && validation.errors.name && (
                <p className="text-[11px] font-medium text-[#DC2626] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validation.errors.name}</span>
                </p>
              )}
            </div>

            {/* Celebration Type */}
            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Celebration Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
              >
                <option value="birthday">Birthday Party / Milestone</option>
                <option value="wedding">Wedding / Reception</option>
                <option value="anniversary">Anniversary Celebration</option>
                <option value="college_festival">College Fest / Campus Event</option>
                <option value="corporate">Corporate Gala / Product Launch</option>
                <option value="community">Community Celebration</option>
                <option value="other">Other Celebration</option>
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onBlur={() => markTouched('date')}
                onChange={(e) => {
                  setDate(e.target.value);
                  markTouched('date');
                }}
                className={`w-full text-xs rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none transition-colors border ${
                  touched.date && validation.errors.date
                    ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-1 focus:ring-[#DC2626]'
                    : touched.date && !validation.errors.date
                    ? 'border-[#16A34A] bg-[#F0FDF4] focus:ring-1 focus:ring-[#16A34A]'
                    : 'bg-[#FAF7F2] border-[#DDD3C5] focus:ring-1 focus:ring-[#2D112C]'
                }`}
              />
              {touched.date && validation.errors.date && (
                <p className="text-[11px] font-medium text-[#DC2626] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validation.errors.date}</span>
                </p>
              )}
            </div>

            {/* City / Location */}
            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                City / Location *
              </label>
              <input
                type="text"
                required
                value={city}
                onBlur={() => markTouched('city')}
                onChange={(e) => {
                  setCity(e.target.value);
                  markTouched('city');
                }}
                placeholder="e.g., Bengaluru, Mumbai, London, New York"
                className={`w-full text-xs rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none transition-colors border ${
                  touched.city && validation.errors.city
                    ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-1 focus:ring-[#DC2626]'
                    : touched.city && !validation.errors.city
                    ? 'border-[#16A34A] bg-[#F0FDF4] focus:ring-1 focus:ring-[#16A34A]'
                    : 'bg-[#FAF7F2] border-[#DDD3C5] focus:ring-1 focus:ring-[#2D112C]'
                }`}
              />
              {touched.city && validation.errors.city && (
                <p className="text-[11px] font-medium text-[#DC2626] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validation.errors.city}</span>
                </p>
              )}
            </div>

            {/* Expected Guests */}
            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Expected Guests * (Min 1, no negatives or zero)
              </label>
              <input
                type="number"
                required
                value={guestCount}
                onBlur={() => markTouched('guestCount')}
                onChange={(e) => {
                  setGuestCount(e.target.value === '' ? 0 : Number(e.target.value));
                  markTouched('guestCount');
                }}
                placeholder="e.g., 120"
                className={`w-full text-xs font-mono rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none transition-colors border ${
                  touched.guestCount && validation.errors.guestCount
                    ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-1 focus:ring-[#DC2626]'
                    : touched.guestCount && !validation.errors.guestCount
                    ? 'border-[#16A34A] bg-[#F0FDF4] focus:ring-1 focus:ring-[#16A34A]'
                    : 'bg-[#FAF7F2] border-[#DDD3C5] focus:ring-1 focus:ring-[#2D112C]'
                }`}
              />
              {touched.guestCount && validation.errors.guestCount && (
                <p className="text-[11px] font-medium text-[#DC2626] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validation.errors.guestCount}</span>
                </p>
              )}
            </div>

            {/* Total Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#2D112C]">
                  Total Budget * (Must be &gt; 0, no negatives)
                </label>
                <div className="flex items-center gap-1">
                  {['INR', 'USD', 'EUR', 'GBP'].map((curr) => (
                    <button
                      type="button"
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        currency === curr
                          ? 'bg-[#2D112C] text-white font-semibold'
                          : 'bg-[#EBE2D7] text-[#4F3F46]'
                      }`}
                    >
                      {curr === 'INR' ? '₹ INR' : curr}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                required
                value={totalBudget}
                onBlur={() => markTouched('totalBudget')}
                onChange={(e) => {
                  setTotalBudget(e.target.value === '' ? 0 : Number(e.target.value));
                  markTouched('totalBudget');
                }}
                placeholder="e.g., 200000"
                className={`w-full text-xs font-mono rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none transition-colors border ${
                  touched.totalBudget && validation.errors.totalBudget
                    ? 'border-[#DC2626] bg-[#FEF2F2] focus:ring-1 focus:ring-[#DC2626]'
                    : touched.totalBudget && !validation.errors.totalBudget
                    ? 'border-[#16A34A] bg-[#F0FDF4] focus:ring-1 focus:ring-[#16A34A]'
                    : 'bg-[#FAF7F2] border-[#DDD3C5] focus:ring-1 focus:ring-[#2D112C]'
                }`}
              />
              {touched.totalBudget && validation.errors.totalBudget && (
                <p className="text-[11px] font-medium text-[#DC2626] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validation.errors.totalBudget}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D112C] mb-1">
              Atmosphere & Theme Concept *
            </label>
            <input
              type="text"
              required
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., Warm Autumn Garden Soirée with fairy lights and acoustic live duo"
              className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E5DDD2]">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2D112C] text-white rounded-lg text-xs font-semibold hover:bg-[#3D183B] transition-colors"
            >
              <span>Continue to Preferences</span>
              <ArrowRight className="w-4 h-4 text-[#F97356]" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Optional Progressive Disclosure */}
      {step === 2 && (
        <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs space-y-6">
          <div className="border-b border-[#E5DDD2] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#2D112C]">
                Personalized Preferences (Optional)
              </h3>
              <p className="text-xs text-[#695A60]">
                These details help Gemini tailor catering, venue characteristics, and risk controls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-[#7B6A71] hover:text-[#2D112C]"
            >
              ← Back to Essentials
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Setting (Outdoor vs Indoor)
              </label>
              <div className="flex items-center gap-3 mt-1.5">
                <label className="flex items-center gap-2 text-xs text-[#2D112C] cursor-pointer">
                  <input
                    type="radio"
                    name="outdoor"
                    checked={isOutdoor}
                    onChange={() => setIsOutdoor(true)}
                    className="accent-[#2D112C]"
                  />
                  <span>Outdoor (Lawn / Terrace / Courtyard)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#2D112C] cursor-pointer">
                  <input
                    type="radio"
                    name="outdoor"
                    checked={!isOutdoor}
                    onChange={() => setIsOutdoor(false)}
                    className="accent-[#2D112C]"
                  />
                  <span>Indoor (Banquet / Hall / Gallery)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Venue Type Preference
              </label>
              <input
                type="text"
                value={venuePreference}
                onChange={(e) => setVenuePreference(e.target.value)}
                placeholder="e.g., Boutique heritage garden, rooftop with skyline view"
                className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Dietary & Catering Needs
              </label>
              <input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="e.g., 50% Veg, 50% Non-veg, Jain prep, Vegan options"
                className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Accessibility Requirements
              </label>
              <input
                type="text"
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value)}
                placeholder="e.g., Wheelchair ramp, step-free restrooms, elder seating"
                className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Key Planning Priorities
              </label>
              <input
                type="text"
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                placeholder="e.g., High-end photography, interactive live dessert station, acoustic duo"
                className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                Special Restrictions / Additional Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Music must end by 10 PM. Cake cutting planned at 8:30 PM."
                className="w-full text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg px-3.5 py-2.5 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5DDD2]">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs text-[#7B6A71] hover:text-[#2D112C] underline"
            >
              Skip optional & generate now
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2D112C] text-white rounded-lg text-xs font-semibold hover:bg-[#3D183B] disabled:opacity-50 transition-colors shadow-xs"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Blueprint with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F97356]" />
                  <span>Generate Event Blueprint</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Generated Structured Blueprint */}
      {step === 3 && generatedPlan && (
        <div className="space-y-6">
          {/* Blueprint Header */}
          <div className="bg-[#FAF7F2] rounded-xl p-6 border border-[#E5DDD2] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-[#E0533C]">
                  Blueprint Ready
                </span>
                <span className="text-[#8C7A83]">·</span>
                <span className="text-[#695A60]">{name}</span>
                <SimulationBadge isSimulated={generatedPlan.isSimulated} />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#2D112C]">
                Personalized Celebration Architecture
              </h3>
              <p className="text-xs text-[#695A60] mt-0.5">
                {guestCount} guests · {formatCurrency(totalBudget, currency)} · {city}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#5E4E55] bg-white border border-[#DDD3C5] hover:bg-[#F2ECE3] transition-colors"
              >
                Modify Requirements
              </button>
              <button
                onClick={handleSaveAndActivate}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] shadow-xs transition-colors"
              >
                <Check className="w-4 h-4 text-[#F97356]" />
                <span>Save & Activate Workspace</span>
              </button>
            </div>
          </div>

          {/* Interactive Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Executive Summary */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                  Event Summary & Vision
                </h4>
                {editingSection !== 'summary' ? (
                  <button
                    onClick={() => startEditSection('summary', generatedPlan.blueprint.summary)}
                    className="text-xs text-[#7B6A71] hover:text-[#2D112C] flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => saveEditedSection('summary')}
                    className="text-xs text-[#16A34A] font-semibold flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                )}
              </div>
              {editingSection === 'summary' ? (
                <textarea
                  rows={4}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              ) : (
                <p className="text-xs text-[#4F3F46] leading-relaxed">
                  {generatedPlan.blueprint.summary}
                </p>
              )}
            </div>

            {/* Section 2: Theme Rationale */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                  Theme & Atmospheric Rationale
                </h4>
                {editingSection !== 'themeRationale' ? (
                  <button
                    onClick={() => startEditSection('themeRationale', generatedPlan.blueprint.themeRationale)}
                    className="text-xs text-[#7B6A71] hover:text-[#2D112C] flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => saveEditedSection('themeRationale')}
                    className="text-xs text-[#16A34A] font-semibold flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                )}
              </div>
              {editingSection === 'themeRationale' ? (
                <textarea
                  rows={4}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              ) : (
                <p className="text-xs text-[#4F3F46] leading-relaxed">
                  {generatedPlan.blueprint.themeRationale}
                </p>
              )}
            </div>

            {/* Section 3: Suggested Venue Characteristics */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                  Venue Selection Profile
                </h4>
              </div>
              <p className="text-xs text-[#4F3F46] leading-relaxed">
                {generatedPlan.blueprint.suggestedVenueCharacteristics}
              </p>
            </div>

            {/* Section 4: Catering & Culinary Strategy */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                  Catering & Dietary Architecture
                </h4>
              </div>
              <p className="text-xs text-[#4F3F46] leading-relaxed">
                {generatedPlan.blueprint.cateringConsiderations}
              </p>
            </div>

            {/* Section 5: Cost-Saving Opportunities */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs">
              <h4 className="font-serif font-bold text-sm text-[#2D112C] mb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#16A34A]" />
                <span>Cost-Saving Opportunities</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#4F3F46]">
                {generatedPlan.blueprint.costSavingOpportunities?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#16A34A] font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 6: Contingency & Risk Plans */}
            <div className="bg-white rounded-xl p-5 border border-[#E5DDD2] shadow-2xs">
              <h4 className="font-serif font-bold text-sm text-[#2D112C] mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                <span>Contingency & Weather Readiness</span>
              </h4>
              <p className="text-xs text-[#4F3F46] leading-relaxed">
                {generatedPlan.blueprint.contingencyPlans}
              </p>
            </div>
          </div>

          {/* Budget Categories & Tasks Preview Table */}
          <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs">
            <h4 className="font-serif font-bold text-base text-[#2D112C] mb-3">
              Allocated Budget Categories ({generatedPlan.budgetCategories.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {generatedPlan.budgetCategories.map((cat, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#2D112C]">{cat.name}</div>
                    <div className="text-[11px] text-[#695A60]">{cat.notes}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#2D112C] tabular-nums">
                    {formatCurrency(cat.allocatedAmount, currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
