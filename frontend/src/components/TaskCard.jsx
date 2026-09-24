import React from 'react';

const priorityClass = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' };
const statusClass = { 'Todo': 'badge-todo', 'In Progress': 'badge-inprogress', 'Completed': 'badge-completed' };

const TaskCard = ({ task, onEdit, onDelete, onComplete }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <div className="card hover:border-slate-500 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-base truncate ${task.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {task.status !== 'Completed' && (
            <button onClick={() => onComplete(task._id)} title="Mark complete" className="text-emerald-400 hover:text-emerald-300 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button onClick={() => onEdit(task)} title="Edit" className="text-sky-400 hover:text-sky-300 p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task._id)} title="Delete" className="text-red-400 hover:text-red-300 p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={priorityClass[task.priority]}>{task.priority}</span>
        <span className={statusClass[task.status]}>{task.status}</span>
        {isOverdue && <span className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded-full">Overdue</span>}
        {task.dueDate && (
          <span className="text-slate-500 text-xs">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
