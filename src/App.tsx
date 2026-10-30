import React, { useState, useEffect } from 'react';
import { FestivoEvent } from './types';
import { api } from './services/api';
import { Sidebar, NavTab } from './components/Navigation/Sidebar';
import { Header } from './components/Navigation/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { MyEventsView } from './components/Events/MyEventsView';
import { EventArchitectView } from './components/Architect/EventArchitectView';
import { BudgetOptimizerView } from './components/Budget/BudgetOptimizerView';
import { AdaptiveIntelligenceView } from './components/Adaptive/AdaptiveIntelligenceView';
import { GuestManagerView } from './components/Guests/GuestManagerView';
import { VendorCoordinationView } from './components/Vendors/VendorCoordinationView';
import { TimelineTasksView } from './components/Timeline/TimelineTasksView';
import { RiskAdvisorView } from './components/Risks/RiskAdvisorView';
import { CopilotView } from './components/Copilot/CopilotView';
import { ReportsExportView } from './components/Export/ReportsExportView';
import { SettingsView } from './components/Settings/SettingsView';

export default function App() {
  const [events, setEvents] = useState<FestivoEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Load events on mount
  useEffect(() => {
    api.getEvents().then((loaded) => {
      setEvents(loaded);
      if (loaded.length > 0) {
        setActiveEventId(loaded[0].requirements.id);
      }
      setIsLoadingEvents(false);
    });
  }, []);

  const activeEvent = events.find((e) => e.requirements.id === activeEventId) || events[0] || null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Update active event
  const handleUpdateActiveEvent = async (updatedFields: Partial<FestivoEvent>) => {
    if (!activeEvent) return;
    const updated = {
      ...activeEvent,
      ...updatedFields,
      requirements: {
        ...activeEvent.requirements,
        ...updatedFields.requirements,
        updatedAt: new Date().toISOString(),
      },
    };

    // Update in memory
    const updatedList = events.map((e) =>
      e.requirements.id === activeEvent.requirements.id ? updated : e
    );
    setEvents(updatedList);

    // Sync to backend / storage
    try {
      await api.updateEvent(activeEvent.requirements.id, updated);
      showToast('Changes saved to persistent storage');
    } catch (err) {
      console.error('Failed to sync event update:', err);
    }
  };

  // Handle new event creation
  const handleEventCreated = async (newEvent: FestivoEvent) => {
    const saved = await api.createEvent(newEvent);
    setEvents((prev) => [...prev, saved]);
    setActiveEventId(saved.requirements.id);
    setCurrentTab('dashboard');
    showToast(`Created & activated "${saved.requirements.name}"`);
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    await api.deleteEvent(id);
    const remaining = events.filter((e) => e.requirements.id !== id);
    setEvents(remaining);
    if (activeEventId === id) {
      setActiveEventId(remaining[0]?.requirements.id || null);
    }
    showToast('Event deleted');
  };

  // Reset demo event
  const handleResetDemo = async () => {
    const demo = await api.resetDemoEvent('festivo-evt-demo-01');
    const filtered = events.filter((e) => e.requirements.id !== demo.requirements.id);
    const updated = [demo, ...filtered];
    setEvents(updated);
    setActiveEventId(demo.requirements.id);
    showToast('Reset sample event to default demonstration state');
  };

  if (isLoadingEvents) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#2D112C]/20 border-t-[#2D112C] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-serif font-bold text-[#2D112C]">
            Initializing Festivo AI Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2D112C] text-[#FAF7F2] text-xs px-4 py-2.5 rounded-xl shadow-lg border border-[#D4AF37]/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        events={events}
        activeEvent={activeEvent}
        onSelectEvent={(id) => setActiveEventId(id)}
        onNewEvent={() => setCurrentTab('architect')}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen min-w-0">
        <Header
          currentTab={currentTab}
          activeEvent={activeEvent}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          onNewEvent={() => setCurrentTab('architect')}
          onOpenAdaptive={() => setCurrentTab('adaptive')}
          isSimulated={activeEvent?.blueprint?.isSimulated}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              event={activeEvent}
              onNavigateTab={setCurrentTab}
              onNewEvent={() => setCurrentTab('architect')}
            />
          )}

          {currentTab === 'my-events' && (
            <MyEventsView
              events={events}
              activeEvent={activeEvent}
              onSelectEvent={(id) => {
                setActiveEventId(id);
                setCurrentTab('dashboard');
              }}
              onNewEvent={() => setCurrentTab('architect')}
              onDeleteEvent={handleDeleteEvent}
              onResetDemo={handleResetDemo}
            />
          )}

          {currentTab === 'architect' && (
            <EventArchitectView
              onEventCreated={handleEventCreated}
              activeEvent={activeEvent}
            />
          )}

          {currentTab === 'budget' && activeEvent && (
            <BudgetOptimizerView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {currentTab === 'adaptive' && activeEvent && (
            <AdaptiveIntelligenceView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {currentTab === 'guests' && activeEvent && (
            <GuestManagerView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {currentTab === 'vendors' && activeEvent && (
            <VendorCoordinationView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {currentTab === 'timeline' && activeEvent && (
            <TimelineTasksView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {currentTab === 'risks' && activeEvent && (
            <RiskAdvisorView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
            />
          )}

          {currentTab === 'copilot' && activeEvent && (
            <CopilotView
              event={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'export' && activeEvent && (
            <ReportsExportView event={activeEvent} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              activeEvent={activeEvent}
              onUpdateEvent={handleUpdateActiveEvent}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
