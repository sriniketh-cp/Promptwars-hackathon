import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { aiActivityTracker, AIActivityItem } from '../../services/aiActivityTracker';

interface AIActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIActivityPanel: React.FC<AIActivityPanelProps> = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState<AIActivityItem[]>([]);
  const [expandedInputId, setExpandedInputId] = useState<string | null>(null);
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setActivities(aiActivityTracker.getActivities());
    const unsubscribe = aiActivityTracker.subscribe(() => {
      setActivities(aiActivityTracker.getActivities());
    });
    return unsubscribe;
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div role="dialog" aria-modal="true" aria-labelledby="ai-activity-title" className="relative w-full max-w-2xl bg-[#FAF7F2] border-l border-[#E5DDD2] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D112C] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4 text-[#E0533C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="ai-activity-title" className="font-serif font-bold text-base text-[#2D112C]">
                  Live AI Activity & Operation Trace
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  Live Trace
                </span>
              </div>
              <p className="text-xs text-[#695A60]">
                Real-time inspection of actual Gemini operations, payloads, and structured responses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activities.length > 0 && (
              <button
                onClick={() => aiActivityTracker.clearActivities()}
                className="p-1.5 text-xs text-[#7B6A71] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                title="Clear activity log"
                aria-label="Clear activity log"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#5E4E55] hover:text-[#2D112C] hover:bg-[#EBE2D7] rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-5 py-2.5 bg-[#F2ECE3] border-b border-[#E5DDD2] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#695A60]">Configured Model:</span>
            <span className="font-mono font-bold text-[#2D112C] bg-white px-2 py-0.5 rounded border border-[#DDD3C5]">
              gemini-3.6-flash
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#695A60]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Zero API secrets exposed • All payloads sanitized</span>
          </div>
        </div>

        {/* Content / Activities List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBE2D7] text-[#695A60] flex items-center justify-center mx-auto">
                <Terminal className="w-6 h-6 text-[#9E8E94]" />
              </div>
              <h4 className="font-serif font-bold text-sm text-[#2D112C]">
                No AI Operations Logged Yet
              </h4>
              <p className="text-xs text-[#695A60] max-w-sm mx-auto">
                Perform an AI action like running the <strong>"What Changed?" Adaptive Analysis</strong>,
                generating a blueprint in <strong>AI Event Architect</strong>, or chatting with the{' '}
                <strong>AI Event Copilot</strong> to inspect live operation traces here.
              </p>
            </div>
          ) : (
            activities.map((item, idx) => {
              const isInputExpanded = expandedInputId === item.id;
              const isResponseExpanded = expandedResponseId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-[#E5DDD2] shadow-2xs overflow-hidden transition-all hover:border-[#D4AF37]/50"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#E5DDD2] bg-[#FAF7F2] space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-[#2D112C]">
                            {item.operation}
                          </span>
                          <span className="font-mono text-[10px] text-[#7B6A71] bg-[#F2ECE3] px-1.5 py-0.5 rounded border border-[#DDD3C5]">
                            {item.endpoint}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#695A60] mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#9E8E94]" />
                            {item.timestamp}
                          </span>
                          {item.latencyMs !== undefined && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-medium text-[#2D112C]">
                                {item.latencyMs} ms
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-mono text-[10px] text-[#2D112C]">
                            Model: {item.model}
                          </span>
                        </div>
                      </div>

                      {/* Status and Mode Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.status === 'loading' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-ping" />
                            Executing...
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                            <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                            200 OK
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">
                            <AlertCircle className="w-3 h-3 text-[#DC2626]" />
                            Error
                          </span>
                        )}

                        {item.isSimulated !== undefined && (
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                              item.isSimulated
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#F3E8FF] text-[#6B21A8]'
                            }`}
                          >
                            {item.isSimulated ? 'Simulation Fallback' : 'Live Gemini AI'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Request Inputs & Structured Response */}
                  <div className="p-4 space-y-3 text-xs">
                    {/* Error Banner if error occurred */}
                    {item.errorMessage && (
                      <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{item.errorMessage}</span>
                      </div>
                    )}

                    {/* Section 1: User-Specific Input Sent to Gemini */}
                    <div className="border border-[#E5DDD2] rounded-lg overflow-hidden">
                      <div className="p-2.5 bg-[#F9F6F0] flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D112C]">
                          <Cpu className="w-3.5 h-3.5 text-[#E0533C]" />
                          <span>User-Specific Input Sent to Gemini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                JSON.stringify(item.input, null, 2),
                                `input-${item.id}`
                              )
                            }
                            className="text-[10px] flex items-center gap-1 text-[#695A60] hover:text-[#2D112C] transition-colors"
                          >
                            {copiedId === `input-${item.id}` ? (
                              <Check className="w-3 h-3 text-[#16A34A]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === `input-${item.id}` ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() =>
                              setExpandedInputId(isInputExpanded ? null : item.id)
                            }
                            className="text-[11px] text-[#695A60] hover:text-[#2D112C]"
                          >
                            {isInputExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Summary Preview */}
                      <div className="p-2.5 bg-white text-[11px] text-[#4F3F46] border-t border-[#E5DDD2]">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                          {Object.entries(item.input)
                            .slice(0, isInputExpanded ? undefined : 4)
                            .map(([k, v]) => (
                              <div key={k} className="truncate">
                                <span className="text-[#8C7A82]">{k}:</span>{' '}
                                <span className="text-[#2D112C] font-semibold">
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Expanded Raw JSON View */}
                      {isInputExpanded && (
                        <div className="p-3 bg-[#1E141D] text-[#FAF7F2] font-mono text-[10px] overflow-x-auto max-h-48 border-t border-[#E5DDD2]">
                          <pre>{JSON.stringify(item.input, null, 2)}</pre>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Structured Response Returned by Gemini */}
                    {item.response && (
                      <div className="border border-[#E5DDD2] rounded-lg overflow-hidden">
                        <div className="p-2.5 bg-[#F9F6F0] flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D112C]">
                            <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span>Actual Structured Response Returned</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  typeof item.response === 'string'
                                    ? item.response
                                    : JSON.stringify(item.response, null, 2),
                                  `resp-${item.id}`
                                )
                              }
                              className="text-[10px] flex items-center gap-1 text-[#695A60] hover:text-[#2D112C] transition-colors"
                            >
                              {copiedId === `resp-${item.id}` ? (
                                <Check className="w-3 h-3 text-[#16A34A]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === `resp-${item.id}` ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              onClick={() =>
                                setExpandedResponseId(isResponseExpanded ? null : item.id)
                              }
                              className="text-[11px] text-[#695A60] hover:text-[#2D112C]"
                            >
                              {isResponseExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Structured Highlights */}
                        {(() => {
                          const res = typeof item.response === 'object' && item.response !== null ? (item.response as Record<string, any>) : null;
                          return (
                            <div className="p-2.5 bg-white text-[11px] text-[#4F3F46] border-t border-[#E5DDD2] space-y-1.5">
                              {res ? (
                                <>
                                  {res.impactAssessment && (
                                    <div className="text-[11px]">
                                      <strong className="text-[#2D112C]">Impact Assessment:</strong>{' '}
                                      <span className="text-[#695A60] line-clamp-2">
                                        {String(res.impactAssessment)}
                                      </span>
                                    </div>
                                  )}
                                  {res.content && (
                                    <div className="text-[11px]">
                                      <strong className="text-[#2D112C]">Copilot Answer:</strong>{' '}
                                      <span className="text-[#695A60] line-clamp-2">
                                        {String(res.content)}
                                      </span>
                                    </div>
                                  )}
                                  {res.blueprint?.summary && (
                                    <div className="text-[11px]">
                                      <strong className="text-[#2D112C]">Blueprint Summary:</strong>{' '}
                                      <span className="text-[#695A60] line-clamp-2">
                                        {String(res.blueprint.summary)}
                                      </span>
                                    </div>
                                  )}
                                  {Array.isArray(res.affectedBudgetCategories) && (
                                    <div className="text-[10px] font-mono text-[#166534]">
                                      ✓ {res.affectedBudgetCategories.length} budget category adjustments proposed
                                    </div>
                                  )}
                                  {Array.isArray(res.tradeOffs) && (
                                    <div className="text-[10px] font-mono text-[#92400E]">
                                      ✓ {res.tradeOffs.length} operational trade-offs evaluated
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-[11px] text-[#695A60] line-clamp-3">
                                  {String(item.response || '')}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Raw JSON View */}
                        {isResponseExpanded && (
                          <div className="p-3 bg-[#1E141D] text-[#FAF7F2] font-mono text-[10px] overflow-x-auto max-h-64 border-t border-[#E5DDD2]">
                            <pre>
                              {typeof item.response === 'string'
                                ? item.response
                                : JSON.stringify(item.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between text-xs text-[#695A60]">
          <span>
            Showing <strong>{activities.length}</strong> recorded operation{activities.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

