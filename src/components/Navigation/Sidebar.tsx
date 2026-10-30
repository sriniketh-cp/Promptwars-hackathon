import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Wand2,
  PieChart,
  RefreshCw,
  Users,
  Store,
  CheckSquare,
  ShieldAlert,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';
import { BrandMark } from '../Common/BrandMark';
import { FestivoEvent } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'my-events'
  | 'architect'
  | 'budget'
  | 'adaptive'
  | 'guests'
  | 'vendors'
  | 'timeline'
  | 'risks'
  | 'copilot'
  | 'export'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  events: FestivoEvent[];
  activeEvent: FestivoEvent | null;
  onSelectEvent: (eventId: string) => void;
  onNewEvent: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  events,
  activeEvent,
  onSelectEvent,
  onNewEvent,
  isOpen,
  onClose,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-events', label: 'My Events', icon: CalendarDays },
    { id: 'architect', label: 'AI Event Architect', icon: Wand2 },
    { id: 'budget', label: 'Budget Optimizer', icon: PieChart },
    {
      id: 'adaptive',
      label: 'Adaptive Intelligence',
      icon: RefreshCw,
      badge: 'What changed?',
    },
    { id: 'guests', label: 'Guest Manager', icon: Users },
    { id: 'vendors', label: 'Vendor Coordination', icon: Store },
    { id: 'timeline', label: 'Timeline & Tasks', icon: CheckSquare },
    { id: 'risks', label: 'Risk Advisor', icon: ShieldAlert },
    { id: 'copilot', label: 'AI Event Copilot', icon: MessageSquare },
    { id: 'export', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#F6F1EA] border-r border-[#E5DDD2] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E5DDD2] bg-[#FAF7F2]">
          <BrandMark size="md" showTagline />
        </div>

        {/* Active Event Selector Card */}
        <div className="p-4 border-b border-[#E5DDD2] bg-[#F2ECE3]">
          <div className="text-[11px] font-semibold text-[#7E6E74] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Active Workspace</span>
            <button
              onClick={onNewEvent}
              className="text-[#E0533C] hover:text-[#C53F28] flex items-center gap-1 font-medium lowercase text-xs transition-colors"
              title="Create new event"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>new</span>
            </button>
          </div>

          {activeEvent ? (
            <div className="relative">
              <select
                value={activeEvent.requirements.id}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="w-full text-xs font-medium text-[#2D112C] bg-white border border-[#DDD3C5] rounded-lg py-2 pl-3 pr-8 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2D112C] appearance-none truncate cursor-pointer"
              >
                {events.map((ev) => (
                  <option key={ev.requirements.id} value={ev.requirements.id}>
                    {ev.requirements.name} ({ev.requirements.guestCount} guests)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8C7A83] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <button
              onClick={onNewEvent}
              className="w-full py-2 px-3 bg-white border border-dashed border-[#C5B7A6] rounded-lg text-xs font-medium text-[#5E4E55] hover:bg-[#FAF7F2] transition-colors text-left"
            >
              + Create your first event
            </button>
          )}

          {activeEvent && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#695A60]">
              <span className="font-mono tabular-nums">
                {activeEvent.requirements.date}
              </span>
              <span className="font-mono tabular-nums font-semibold text-[#2D112C]">
                {activeEvent.requirements.currency}{' '}
                {activeEvent.requirements.totalBudget.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as NavTab);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#2D112C] text-[#FAF7F2] shadow-sm font-semibold'
                    : 'text-[#4F3F46] hover:bg-[#EBE2D7] hover:text-[#2D112C]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#F97356]' : 'text-[#7B6A71]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-sans tracking-tight shrink-0 ${
                      isActive
                        ? 'bg-[#E0533C] text-white font-semibold'
                        : 'bg-[#E8DFD4] text-[#7C3627] font-medium'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] text-[11px] text-[#7E6F75]">
          <div className="flex items-center justify-between">
            <span>Festivo AI Workspace</span>
            <span className="font-mono text-[10px] text-[#9E8E94]">v1.0-RC</span>
          </div>
          <p className="text-[10px] text-[#9A8A91] mt-0.5">
            PromptWars 05 · Google for Developers
          </p>
        </div>
      </aside>
    </>
  );
};
