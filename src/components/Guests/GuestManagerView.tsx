import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Guest, RsvpStatus, FestivoEvent } from '../../types';
import { calculateGuestSummary } from '../../utils/calculations';

interface GuestManagerViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
}

export const GuestManagerView: React.FC<GuestManagerViewProps> = ({
  event,
  onUpdateEvent,
}) => {
  const guests = event.guests || [];
  const guestSummary = calculateGuestSummary(guests);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('invited');
  const [plusOnes, setPlusOnes] = useState<number>(0);
  const [dietary, setDietary] = useState('Standard');
  const [accessibility, setAccessibility] = useState('None');
  const [seatingNotes, setSeatingNotes] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const openAdd = () => {
    setEditingGuestId(null);
    setName('');
    setEmail('');
    setPhone('');
    setRsvpStatus('invited');
    setPlusOnes(0);
    setDietary('Standard');
    setAccessibility('None');
    setSeatingNotes('');
    setTableNumber('');
    setShowAddModal(true);
  };

  const openEdit = (g: Guest) => {
    setEditingGuestId(g.id);
    setName(g.name);
    setEmail(g.email || '');
    setPhone(g.phone || '');
    setRsvpStatus(g.rsvpStatus);
    setPlusOnes(g.plusOnes || 0);
    setDietary(g.dietary || 'Standard');
    setAccessibility(g.accessibility || 'None');
    setSeatingNotes(g.seatingNotes || '');
    setTableNumber(g.tableNumber || '');
    setShowAddModal(true);
  };

  const handleSaveGuest = () => {
    if (!name.trim()) return;

    if (editingGuestId) {
      const updated = guests.map((g) => {
        if (g.id === editingGuestId) {
          return {
            ...g,
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            rsvpStatus,
            plusOnes: Number(plusOnes) || 0,
            dietary,
            accessibility,
            seatingNotes,
            tableNumber,
          };
        }
        return g;
      });
      onUpdateEvent({ guests: updated });
    } else {
      const newGuest: Guest = {
        id: `g-${Date.now()}`,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        rsvpStatus,
        plusOnes: Number(plusOnes) || 0,
        dietary,
        accessibility,
        seatingNotes,
        tableNumber,
      };
      onUpdateEvent({ guests: [...guests, newGuest] });
    }

    setShowAddModal(false);
  };

  const handleDeleteGuest = (id: string) => {
    const updated = guests.filter((g) => g.id !== id);
    onUpdateEvent({ guests: updated });
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'RSVP Status',
      'Plus Ones',
      'Dietary Requirements',
      'Accessibility',
      'Table Number',
      'Notes',
    ];
    const rows = guests.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      g.rsvpStatus,
      g.plusOnes,
      `"${(g.dietary || '').replace(/"/g, '""')}"`,
      `"${(g.accessibility || '').replace(/"/g, '""')}"`,
      `"${(g.tableNumber || '').replace(/"/g, '""')}"`,
      `"${(g.seatingNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${event.requirements.name.replace(/\s+/g, '_')}_Guests.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const importedGuests: Guest[] = [];
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols[0]) {
          importedGuests.push({
            id: `g-imp-${Date.now()}-${i}`,
            name: cols[0],
            email: cols[1] || undefined,
            phone: cols[2] || undefined,
            rsvpStatus: (['confirmed', 'declined', 'pending', 'invited'].includes(cols[3]?.toLowerCase())
              ? cols[3].toLowerCase()
              : 'invited') as RsvpStatus,
            plusOnes: parseInt(cols[4], 10) || 0,
            dietary: cols[5] || 'Standard',
            accessibility: cols[6] || 'None',
            tableNumber: cols[7] || '',
            seatingNotes: cols[8] || '',
          });
        }
      }

      onUpdateEvent({ guests: [...guests, ...importedGuests] });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.tableNumber && g.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || g.rsvpStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#E0533C]" />
            <span>Guest Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Track RSVPs, seating assignments, plus-ones, dietary requirements, and CSV synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-[#2D112C] border border-[#DDD3C5] hover:bg-[#FAF7F2] transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#7B6A71]" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCsv}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-[#2D112C] border border-[#DDD3C5] hover:bg-[#FAF7F2] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#7B6A71]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#F97356]" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* 5 Headcount Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#695A60] font-medium">Total Invited</span>
          <div className="text-lg font-bold font-mono text-[#2D112C] tabular-nums mt-0.5">
            {guestSummary.totalInvited}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#16A34A] font-medium">Confirmed RSVPs</span>
          <div className="text-lg font-bold font-mono text-[#16A34A] tabular-nums mt-0.5">
            {guestSummary.confirmed}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#D97706] font-medium">Pending Responses</span>
          <div className="text-lg font-bold font-mono text-[#D97706] tabular-nums mt-0.5">
            {guestSummary.pending}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#991B1B] font-medium">Declined</span>
          <div className="text-lg font-bold font-mono text-[#991B1B] tabular-nums mt-0.5">
            {guestSummary.declined}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-[#2D112C] font-semibold">Expected Pax</span>
          <div className="text-lg font-bold font-mono text-[#2D112C] tabular-nums mt-0.5">
            ~{guestSummary.expectedAttendance}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#E5DDD2] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8C7A83] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guests by name or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] rounded-lg text-[#2D112C] focus:outline-none focus:ring-1 focus:ring-[#2D112C]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs overflow-x-auto pb-1 sm:pb-0">
          {['all', 'confirmed', 'pending', 'declined', 'invited'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-[#2D112C] text-white'
                  : 'bg-[#FAF7F2] text-[#695A60] hover:bg-[#EBE2D7]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-xl border border-[#E5DDD2] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5DDD2] bg-[#FAF7F2] text-[#695A60] font-semibold">
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">RSVP Status</th>
                <th className="py-3 px-4 text-center">Plus Ones</th>
                <th className="py-3 px-4">Dietary Preference</th>
                <th className="py-3 px-4">Accessibility</th>
                <th className="py-3 px-4">Table / Seating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD2]">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#7B6A71] italic">
                    No matching guest records found.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2D112C]">{g.name}</div>
                      {g.email && <div className="text-[11px] text-[#695A60]">{g.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                          g.rsvpStatus === 'confirmed'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : g.rsvpStatus === 'pending'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : g.rsvpStatus === 'declined'
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : 'bg-[#F2ECE3] text-[#4A3D43]'
                        }`}
                      >
                        {g.rsvpStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-[#2D112C]">
                      {g.plusOnes > 0 ? `+${g.plusOnes}` : '0'}
                    </td>
                    <td className="py-3 px-4 text-[#4F3F46]">
                      {g.dietary || 'Standard'}
                    </td>
                    <td className="py-3 px-4 text-[#4F3F46]">
                      {g.accessibility || 'None'}
                    </td>
                    <td className="py-3 px-4 text-[#4F3F46]">
                      {g.tableNumber ? (
                        <span className="font-medium text-[#2D112C]">{g.tableNumber}</span>
                      ) : (
                        <span className="text-[#8C7A83] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(g)}
                          className="p-1 rounded text-[#7B6A71] hover:text-[#2D112C] hover:bg-[#EBE2D7]"
                          title="Edit guest"
                          aria-label={`Edit guest ${g.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(g.id)}
                          className="p-1 rounded text-[#7B6A71] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                          title="Delete guest"
                          aria-label={`Delete guest ${g.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="guest-modal-title">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5DDD2] shadow-xl space-y-4">
            <h3 id="guest-modal-title" className="font-serif font-bold text-base text-[#2D112C]">
              {editingGuestId ? 'Edit Guest Record' : 'Add New Guest'}
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="guest-name-input" className="block text-xs font-semibold text-[#2D112C] mb-1">Guest Name *</label>
                <input
                  id="guest-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ananya Sharma"
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-email-input" className="block text-xs font-semibold text-[#2D112C] mb-1">Email</label>
                  <input
                    id="guest-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                  />
                </div>
                <div>
                  <label htmlFor="guest-phone-input" className="block text-xs font-semibold text-[#2D112C] mb-1">Phone</label>
                  <input
                    id="guest-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D112C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">RSVP Status</label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                  >
                    <option value="invited">Invited</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">Plus Ones</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">Dietary Needs</label>
                  <input
                    type="text"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Vegetarian, Jain, Nut Allergy"
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">Accessibility</label>
                  <input
                    type="text"
                    value={accessibility}
                    onChange={(e) => setAccessibility(e.target.value)}
                    placeholder="Wheelchair ramp, etc."
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">Table Assignment</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., Table 1"
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">Seating Notes</label>
                  <input
                    type="text"
                    value={seatingNotes}
                    onChange={(e) => setSeatingNotes(e.target.value)}
                    placeholder="College friends, family"
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DDD2]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs text-[#7B6A71] hover:text-[#2D112C]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuest}
                className="px-5 py-2 text-xs font-semibold bg-[#2D112C] text-white rounded-lg hover:bg-[#3D183B]"
              >
                Save Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
