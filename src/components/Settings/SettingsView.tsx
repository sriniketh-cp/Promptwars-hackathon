import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FestivoEvent } from '../../types';
import { api } from '../../services/api';

interface SettingsViewProps {
  activeEvent: FestivoEvent | null;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeEvent,
  onUpdateEvent,
  onResetDemo,
}) => {
  const [serverStatus, setServerStatus] = useState<{
    status: string;
    hasApiKey: boolean;
    model: string;
  } | null>(null);

  useEffect(() => {
    api.getHealth().then(setServerStatus);
  }, []);

  const changeCurrency = (curr: string) => {
    if (!activeEvent) return;
    onUpdateEvent({
      requirements: {
        ...activeEvent.requirements,
        currency: curr,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5DDD2]">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#E0533C]" />
          <span>Platform Settings & System Architecture</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
          Configure currency standards, verify persistent storage health, and inspect Gemini API telemetry.
        </p>
      </div>

      {/* Currency Preference */}
      <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs space-y-3">
        <h3 className="font-serif font-bold text-base text-[#2D112C]">
          Default Currency & Locale
        </h3>
        <p className="text-xs text-[#695A60]">
          Active currency used for financial ledgers, per-plate catering quotes, and export documents.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {[
            { code: 'INR', label: '₹ INR (Indian Rupee, Lakhs/Crores)' },
            { code: 'USD', label: '$ USD (US Dollar)' },
            { code: 'EUR', label: '€ EUR (Euro)' },
            { code: 'GBP', label: '£ GBP (British Pound)' },
          ].map((curr) => {
            const isSelected = activeEvent?.requirements.currency === curr.code;
            return (
              <button
                key={curr.code}
                onClick={() => changeCurrency(curr.code)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#2D112C] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#4F3F46] border border-[#DDD3C5] hover:bg-[#EBE2D7]'
                }`}
              >
                {curr.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Engine Status */}
      <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs space-y-4">
        <h3 className="font-serif font-bold text-base text-[#2D112C] flex items-center gap-2">
          <Server className="w-5 h-5 text-[#2D112C]" />
          <span>Backend & AI Engine Verification</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
            <div className="font-bold text-[#2D112C] flex items-center justify-between">
              <span>Generative AI Engine</span>
              <Sparkles className="w-4 h-4 text-[#E0533C]" />
            </div>
            <div className="space-y-1 text-[#695A60]">
              <div>Model: <strong className="font-mono text-[#2D112C]">gemini-3.6-flash</strong></div>
              <div>SDK: <strong className="font-mono text-[#2D112C]">@google/genai &gt;= 2.25.0</strong></div>
              <div>Call Pattern: <strong className="text-[#2D112C]">Server-Side Only (Express proxy)</strong></div>
              <div className="flex items-center gap-1.5 pt-1">
                {serverStatus?.hasApiKey ? (
                  <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Live API Key Attached
                  </span>
                ) : (
                  <span className="text-[#D97706] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Demo Simulation Mode Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] space-y-2">
            <div className="font-bold text-[#2D112C] flex items-center justify-between">
              <span>Data Persistence & Storage</span>
              <Database className="w-4 h-4 text-[#2D112C]" />
            </div>
            <div className="space-y-1 text-[#695A60]">
              <div>Primary Store: <strong className="font-mono text-[#2D112C]">/data/events.json</strong> (File-backed)</div>
              <div>Client Sync: <strong className="font-mono text-[#2D112C]">localStorage cache</strong></div>
              <div>Survivability: <strong className="text-[#16A34A]">Survives page reloads & restart</strong></div>
              <div className="text-[11px] text-[#8C7A83] pt-1">
                All edits, revisions, tasks, and guests are saved automatically.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-xl p-6 border border-[#E5DDD2] shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-sm text-[#2D112C]">
            Reset Demonstration Event
          </h3>
          <p className="text-xs text-[#695A60] mt-0.5">
            Restores the canonical 120-guest birthday event with ₹2,00,000 budget and sample quotes.
          </p>
        </div>

        <button
          onClick={onResetDemo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#FAF7F2] text-[#E0533C] border border-[#F9C3B8] hover:bg-[#FFF0ED] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Data</span>
        </button>
      </div>
    </div>
  );
};
