import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2,
  Flag,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { EventTask, FestivoEvent, TaskPriority, TaskStatus } from '../../types';
import { calculateTaskSummary } from '../../utils/calculations';

interface TimelineTasksViewProps {
  event: FestivoEvent;
  onUpdateEvent: (updated: Partial<FestivoEvent>) => void;
}

export const TimelineTasksView: React.FC<TimelineTasksViewProps> = ({
  event,
  onUpdateEvent,
}) => {
  const req = event.requirements;
  const tasks = event.tasks || [];
  const taskSummary = calculateTaskSummary(tasks, req.date);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(req.date);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [owner, setOwner] = useState('Host');
  const [category, setCategory] = useState('General');
  const [isMilestone, setIsMilestone] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate(req.date);
    setPriority('medium');
    setStatus('todo');
    setOwner('Host');
    setCategory('General');
    setIsMilestone(false);
    setShowAddModal(true);
  };

  const openEdit = (t: EventTask) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description);
    setDueDate(t.dueDate);
    setPriority(t.priority);
    setStatus(t.status);
    setOwner(t.owner);
    setCategory(t.relatedCategory || 'General');
    setIsMilestone(!!t.isMilestone);
    setShowAddModal(true);
  };

  const handleSaveTask = () => {
    if (!title.trim()) return;

    if (editingId) {
      const updated = tasks.map((t) => {
        if (t.id === editingId) {
          return {
            ...t,
            title: title.trim(),
            description: description.trim(),
            dueDate,
            priority,
            status,
            owner,
            relatedCategory: category,
            isMilestone,
          };
        }
        return t;
      });
      onUpdateEvent({ tasks: updated });
    } else {
      const newTask: EventTask = {
        id: `task-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
        status,
        owner,
        relatedCategory: category,
        dependencies: [],
        isMilestone,
      };
      onUpdateEvent({ tasks: [...tasks, newTask] });
    }

    setShowAddModal(false);
  };

  const toggleTaskStatus = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: (t.status === 'completed' ? 'todo' : 'completed') as TaskStatus,
        };
      }
      return t;
    });
    onUpdateEvent({ tasks: updated });
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    onUpdateEvent({ tasks: updated });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Sorted chronologically
  const sortedTasks = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const filteredTasks = sortedTasks.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD2]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D112C] flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#E0533C]" />
            <span>Timeline & Task Milestones</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#695A60] mt-0.5">
            Chronological milestone roadmaps with deterministic date recalculation on schedule shifts.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2D112C] text-[#FAF7F2] hover:bg-[#3D183B] transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-[#F97356]" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#695A60] font-medium">Completion Rate</span>
          <div className="text-xl font-bold font-mono text-[#2D112C] tabular-nums mt-0.5">
            {taskSummary.completionPercentage}%{' '}
            <span className="text-xs font-normal text-[#695A60]">
              ({taskSummary.completed}/{taskSummary.total})
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#DC2626] font-medium">Overdue Deadlines</span>
          <div className="text-xl font-bold font-mono text-[#DC2626] tabular-nums mt-0.5">
            {taskSummary.overdue}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#D97706] font-medium">In Progress</span>
          <div className="text-xl font-bold font-mono text-[#D97706] tabular-nums mt-0.5">
            {taskSummary.inProgress}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-[#E5DDD2] shadow-2xs">
          <span className="text-[11px] text-[#16A34A] font-medium">Completed</span>
          <div className="text-xl font-bold font-mono text-[#16A34A] tabular-nums mt-0.5">
            {taskSummary.completed}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-3 border border-[#E5DDD2] shadow-2xs text-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-[#7B6A71] mr-1">Status:</span>
          {['all', 'todo', 'in_progress', 'completed', 'blocked'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-[#2D112C] text-white'
                  : 'bg-[#FAF7F2] text-[#695A60] hover:bg-[#EBE2D7]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#7B6A71] mr-1">Priority:</span>
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap font-medium transition-colors ${
                filterPriority === p
                  ? 'bg-[#2D112C] text-white'
                  : 'bg-[#FAF7F2] text-[#695A60] hover:bg-[#EBE2D7]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Timeline & Tasks */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-[#E5DDD2] text-xs text-[#7B6A71] italic">
            No matching tasks found for the selected filters.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && task.dueDate < todayStr;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-[#FAF7F2]/60 border-[#E5DDD2] opacity-75'
                    : isOverdue
                    ? 'bg-[#FFF5F5] border-[#FCA5A5]'
                    : 'bg-white border-[#E5DDD2] shadow-2xs hover:border-[#DDD3C5]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className="mt-0.5 text-[#2D112C] hover:text-[#E0533C] transition-colors shrink-0"
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A] fill-[#DCFCE7]" />
                    ) : (
                      <div className="w-5 h-5 rounded border-2 border-[#C5B7A6] hover:border-[#2D112C]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isCompleted
                            ? 'line-through text-[#8C7A83]'
                            : 'text-[#2D112C]'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isMilestone && (
                        <span className="text-[10px] font-medium text-[#92400E] px-1.5 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A]">
                          Milestone
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : task.priority === 'medium'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#F3EBF4] text-[#4A1D45]'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.relatedCategory && (
                        <span className="text-[10px] text-[#7B6A71]">
                          · {task.relatedCategory}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#695A60] mt-1 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#8C7A83] mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{task.owner}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DDD2]">
                  <div className="text-right">
                    <div
                      className={`text-xs font-mono font-medium tabular-nums ${
                        isOverdue ? 'text-[#DC2626] font-bold' : 'text-[#2D112C]'
                      }`}
                    >
                      {task.dueDate}
                    </div>
                    {isOverdue && (
                      <span className="text-[10px] font-semibold text-[#DC2626] block">
                        Overdue!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(task)}
                      className="p-1.5 rounded-lg text-[#7B6A71] hover:text-[#2D112C] hover:bg-[#EBE2D7]"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-[#7B6A71] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5DDD2] shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-base text-[#2D112C]">
              {editingId ? 'Edit Task' : 'Add Planning Milestone'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Finalize floral arch mockup"
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                  Description / Action Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, contact requirements, checklist..."
                  className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs font-mono p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2] capitalize"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D112C] mb-1">
                    Assigned Owner
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Host, Coordinator"
                    className="w-full text-xs p-2 rounded-lg border border-[#DDD3C5] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={isMilestone}
                    onChange={(e) => setIsMilestone(e.target.checked)}
                    className="accent-[#2D112C]"
                  />
                  <span className="text-xs font-semibold text-[#2D112C]">
                    Mark as Major Milestone
                  </span>
                </label>
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
                onClick={handleSaveTask}
                className="px-5 py-2 text-xs font-semibold bg-[#2D112C] text-white rounded-lg hover:bg-[#3D183B]"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
