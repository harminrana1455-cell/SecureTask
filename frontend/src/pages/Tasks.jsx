import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask, completeTask } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import LoadingSpinner from '../components/LoadingSpinner';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await getTasks(params);
      setTasks(res.data.data);
    } catch (_) {
      addToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, addToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (searchParams.get('new') === '1') setModalOpen(true);
  }, [searchParams]);

  const handleCreate = async (data) => {
    setModalLoading(true);
    try {
      await createTask(data);
      addToast('Task created!', 'success');
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setModalLoading(true);
    try {
      await updateTask(editTask._id, data);
      addToast('Task updated!', 'success');
      setModalOpen(false);
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      addToast('Task deleted', 'info');
      fetchTasks();
    } catch (_) {
      addToast('Failed to delete task', 'error');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeTask(id);
      addToast('Task completed!', 'success');
      fetchTasks();
    } catch (_) {
      addToast('Failed to complete task', 'error');
    }
  };

  const handleEdit = (task) => { setEditTask(task); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setEditTask(null); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary">+ New Task</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-auto text-sm">
          <option value="">All Statuses</option>
          <option>Todo</option><option>In Progress</option><option>Completed</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input w-auto text-sm">
          <option value="">All Priorities</option>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        {(filterStatus || filterPriority) && (
          <button onClick={() => { setFilterStatus(''); setFilterPriority(''); }} className="btn-secondary text-sm py-1 px-3">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 text-lg">No tasks found</p>
          <p className="text-slate-500 text-sm mt-2">Create your first task to get started</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">Create Task</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onEdit={handleEdit} onDelete={handleDelete} onComplete={handleComplete} />
          ))}
        </div>
      )}

      <TaskModal isOpen={modalOpen} onClose={handleModalClose}
        onSubmit={editTask ? handleUpdate : handleCreate} task={editTask} loading={modalLoading} />
    </div>
  );
};

export default Tasks;
