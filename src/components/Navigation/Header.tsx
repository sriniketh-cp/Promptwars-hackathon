import React from 'react';
import { Menu, Plus, RefreshCw, Sparkles, Activity } from 'lucide-react';
import { FestivoEvent } from '../../types';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  activeEvent: FestivoEvent | null;
  onOpenMobileMenu: () => void;
  onNewEvent: () => void;
  onOpenAdaptive: () => void;
  onOpenAiActivity: () => void;
  isSimulated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeEvent,
  onOpenMobileMenu,
  onNewEvent,
  onOpenAdaptive,
  onOpenAiActivity,
  isSimulated = false,
}) => {
  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Event Overview',
    'my-events': 'Event Directory',
    architect: 'AI Event Architect',
    budget: 'Budget Optimizer',
    adaptive: 'Adaptive Intelligence ("What Changed?")',
    guests: 'Guest Management',
    vendors: 'Vendor Quotation Intelligence',
    timeline: 'Timeline & Task Milestones',
    risks: 'Risk & Contingency Advisor',
    copilot: 'AI Event Copilot',
    export: 'Blueprint Report & Export',
    settings: 'Platform Settings',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DDD2] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-[#5E4E55] hover:bg-[#EBE2D7] lg:hidden focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-[#7B6A71] min-w-0">
          <span className="font-medium text-[#2D112C] hidden sm:inline whitespace-nowrap">
            {activeEvent ? activeEvent.requirements.name : 'Festivo AI'}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">
            /
          </span>
          <span className="font-semibold text-[#2D112C] truncate">
            {tabTitles[currentTab] || 'Workspace'}
          </span>
        </div>
      </div>

      {/* Right: Engine Status + AI Activity + Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Model status tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2ECE3] text-[#4A3D43] text-xs font-mono border border-[#DDD3C5]">
          <Sparkles className="w-3 h-3 text-[#E0533C]" />
          <span>gemini-3.6-flash</span>
          {isSimulated && (
            <span className="text-[10px] text-[#A66C00] font-sans font-medium">· Demo mode</span>
          )}
        </div>

        {/* Live AI Activity Trigger Button */}
        <button
          onClick={onOpenAiActivity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] border border-[#D4AF37]/40 shadow-2xs transition-colors whitespace-nowrap"
          title="Inspect real-time Gemini operation trace, user inputs, and structured responses"
          aria-label="Inspect real-time Gemini AI operation trace, user inputs, and structured responses"
        >
          <Activity className="w-3.5 h-3.5 text-[#E0533C]" />
          <span>AI Activity</span>
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
        </button>

        {activeEvent && (
          <button
            onClick={onOpenAdaptive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FFF0ED] text-[#C53F28] hover:bg-[#FFE4DE] border border-[#F9C3B8] transition-colors whitespace-nowrap"
            title="Simulate a requirements change"
            aria-label="Simulate a requirements change with Adaptive Intelligence"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">What changed?</span>
            <span className="sm:hidden">Adapt</span>
          </button>
        )}

        <button
          onClick={onNewEvent}
          aria-label="Create new event"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E0533C] text-white hover:bg-[#C9432D] shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Event</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
};
