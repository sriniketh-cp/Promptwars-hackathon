import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface SimulationBadgeProps {
  isSimulated?: boolean;
  reason?: string;
  className?: string;
}

export const SimulationBadge: React.FC<SimulationBadgeProps> = ({ isSimulated, reason, className = '' }) => {
  if (isSimulated) {
    const displayLabel = reason
      ? reason.includes('429') || reason.toLowerCase().includes('quota')
        ? 'Quota Exceeded'
        : reason.toLowerCase().includes('timeout')
        ? 'Latency Timeout'
        : 'Demo Simulation'
      : 'Demo Simulation';

    return (
      <span
        title={reason || 'Running in high-fidelity deterministic demo simulation mode'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FFF7E8] text-[#9A6700] border border-[#F0D597] ${className}`}
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Demo Simulation</span>
        {reason && (
          <span className="text-[10px] text-[#A66C00] font-mono truncate max-w-[220px]" title={reason}>
            · {displayLabel}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      title="Live inference generated via Gemini 3.6 Flash server-side integration"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F3EBF4] text-[#4A1D45] border border-[#D8C2D5] ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-[#E0533C] shrink-0" />
      <span>Gemini 3.6 Flash</span>
    </span>
  );
};
