const Task = require('../models/Task');

const getTasks = async (userId, filters = {}) => {
  const query = { userId };
  if (filters.status) { query.status = filters.status; }
  if (filters.priority) { query.priority = filters.priority; }
  return Task.find(query).sort({ createdAt: -1 });
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  return task;
};

const createTask = async (taskData, userId) => {
  return Task.create({ ...taskData, userId });
};

const updateTask = async (taskId, userId, updates) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { ...updates },
    { new: true, runValidators: true }
  );
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  return task;
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  return task;
};

const completeTask = async (taskId, userId) => {
  return updateTask(taskId, userId, { status: 'Completed' });
};

const getDashboardStats = async (userId) => {
  const now = new Date();
  const [total, todo, inProgress, completed, overdue] = await Promise.all([
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, status: 'Todo' }),
    Task.countDocuments({ userId, status: 'In Progress' }),
    Task.countDocuments({ userId, status: 'Completed' }),
    Task.countDocuments({
      userId,
      status: { $ne: 'Completed' },
      dueDate: { $lt: now, $ne: null },
    }),
  ]);
  return { total, todo, inProgress, completed, overdue };
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask, completeTask, getDashboardStats };
