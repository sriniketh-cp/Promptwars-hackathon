import React from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { FestivoEvent } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { SimulationBadge } from '../Common/SimulationBadge';

interface MyEventsViewProps {
  events: FestivoEvent[];
  activeEvent: FestivoEvent | null;
  onSelectEvent: (id: string) => void;
  onNewEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onResetDemo: () => void;
}

export const MyEventsView: React.FC<MyEventsViewProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onNewEvent,
  onDeleteEvent,
  onResetDemo,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#E0533C]" />
            <span>My Events & Celebration Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Manage your celebration workspaces, switch active plans, or clone existing event blueprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-[#2D112C] border border-[#DDD3C5] hover:bg-[#FAF7F2] transition-colors"
            title="Reset default 120-guest birthday event"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#E0533C]" />
            <span>Reset Demo Event</span>
          </button>

          <button
            onClick={onNewEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#F97356]" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((ev) => {
          const req = ev.requirements;
          const isActive = activeEvent?.requirements.id === req.id;

          return (
            <div
              key={req.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-white border-[#2D112C] shadow-sm ring-2 ring-[#2D112C]/20'
                  : 'bg-white border-[#E5DDD2] shadow-2xs hover:border-[#DDD3C5]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#E0533C] px-2 py-0.5 rounded bg-[#FAF0ED] border border-[#F97356]/20">
                    {req.type}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-[#2D112C] line-clamp-1">
                    {req.name}
                  </h3>
                  <p className="text-xs text-[#695A60] line-clamp-2 mt-1 leading-relaxed">
                    {ev.blueprint?.summary || req.theme}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E5DDD2] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#8C7A83] block">Date</span>
                    <strong className="font-mono text-[#2D112C]">{req.date}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8C7A83] block">Location</span>
                    <strong className="text-[#2D112C] truncate block">{req.city}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8C7A83] block">Guests</span>
                    <strong className="font-mono text-[#2D112C]">{req.guestCount} pax</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8C7A83] block">Budget</span>
                    <strong className="font-mono text-[#2D112C]">
                      {formatCurrency(req.totalBudget, req.currency)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#E5DDD2] flex items-center justify-between">
                <button
                  onClick={() => onSelectEvent(req.id)}
                  disabled={isActive}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F2ECE3] text-[#7B6A71] cursor-default'
                      : 'bg-[#2D112C] text-white hover:bg-[#3D183B]'
                  }`}
                >
                  {isActive ? 'Currently Active' : 'Switch to Event'}
                </button>

                {events.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete event "${req.name}"?`)) {
                        onDeleteEvent(req.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#7B6A71] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
