import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  ArrowRight,
  TrendingDown,
  Store,
  ShieldAlert,
} from 'lucide-react';
import { CopilotMessage, FestivoEvent } from '../../types';
import { api } from '../../services/api';
import { SimulationBadge } from '../Common/SimulationBadge';
import { NavTab } from '../Navigation/Sidebar';

interface CopilotViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({
  event,
  onUpdateEvent,
  onNavigateTab,
}) => {
  const req = event.requirements;
  const messages = event.copilotMessages || [];

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    `How can I reduce expenses by ₹15,000 without ruining the celebration?`,
    `What critical milestones should I complete this week?`,
    `What happens if 30 additional guests attend?`,
    `What are the highest risks in my current event plan?`,
    `What questions should I ask Royal Spice Caterers before signing?`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery('');
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    onUpdateEvent({ copilotMessages: updatedMessages });
    setIsLoading(true);

    try {
      const response = await api.askCopilot(updatedMessages, event, query);
      const assistantMsg: CopilotMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        isSimulated: response.isSimulated,
      };

      onUpdateEvent({ copilotMessages: [...updatedMessages, assistantMsg] });
    } catch (err) {
      console.error('Copilot error:', err);
      const errorMsg: CopilotMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content:
          'I apologize, but I encountered an error connecting to the event reasoning engine. Please ensure your network is connected and try asking again.',
        timestamp: new Date().toISOString(),
      };
      onUpdateEvent({ copilotMessages: [...updatedMessages, errorMsg] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-[#E5DDD2] shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D112C] to-[#1E0B24] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5 text-[#F97356]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-[#2D112C]">
                Festivo AI Copilot
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F2ECE3] text-[#4A3D43]">
                Grounded in {req.name}
              </span>
            </div>
            <p className="text-xs text-[#695A60]">
              Active context: {req.guestCount} guests · {req.currency}{' '}
              {req.totalBudget.toLocaleString()} · {req.date}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Clear chat history for this event?')) {
              onUpdateEvent({ copilotMessages: [] });
            }
          }}
          className="text-xs text-[#7B6A71] hover:text-[#DC2626] font-medium"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECE3] flex items-center justify-center mx-auto text-[#E0533C]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-[#2D112C]">
              Your Dedicated Celebration Strategist
            </h4>
            <p className="text-xs text-[#695A60] leading-relaxed">
              Ask anything about Aarav's celebration—budget allocations, vendor contracts, timeline scheduling, or operational trade-offs.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#2D112C] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#F97356]" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#2D112C] text-white shadow-2xs rounded-tr-xs'
                      : 'bg-[#FAF7F2] text-[#241B26] border border-[#E5DDD2] rounded-tl-xs space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {!isUser && (
                    <div className="pt-2 border-t border-[#E5DDD2]/50 flex items-center justify-between text-[10px] text-[#8C7A83]">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <SimulationBadge isSimulated={msg.isSimulated} />
                    </div>
                  )}

                  {msg.suggestedAction && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (msg.suggestedAction?.type === 'open_what_changed') {
                            onNavigateTab('adaptive');
                          } else if (msg.suggestedAction?.type === 'open_budget') {
                            onNavigateTab('budget');
                          } else if (msg.suggestedAction?.type === 'open_vendors') {
                            onNavigateTab('vendors');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D112C] text-white font-semibold text-xs hover:bg-[#3D183B] transition-colors"
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#F97356]" />
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#EBE2D7] text-[#2D112C] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-[#2D112C] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#F97356]" />
            </div>
            <div className="bg-[#FAF7F2] border border-[#E5DDD2] rounded-2xl p-4 text-xs flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#2D112C]/20 border-t-[#2D112C] rounded-full animate-spin" />
              <span className="text-[#695A60]">
                Reasoning across your event data with Gemini 3.8 Flash...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions Carousel */}
      <div className="px-4 py-2 border-t border-[#E5DDD2] bg-[#FAF7F2]/60 overflow-x-auto flex items-center gap-2">
        <span className="text-[10px] text-[#8C7A83] uppercase tracking-wider font-semibold whitespace-nowrap">
          Suggested:
        </span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-md bg-white border border-[#DDD3C5] hover:bg-[#FAF7F2] text-[11px] text-[#4F3F46] whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-[#E5DDD2] bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about ${req.name}'s budget, vendors, timeline, or contingencies...`}
          className="flex-1 text-xs bg-[#FAF7F2] border border-[#DDD3C5] rounded-xl px-4 py-3 text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-3 rounded-xl bg-[#2D112C] text-white hover:bg-[#3D183B] disabled:opacity-40 transition-colors shadow-2xs"
          title="Send query"
        >
          <Send className="w-4 h-4 text-[#F97356]" />
        </button>
      </form>
    </div>
  );
};
