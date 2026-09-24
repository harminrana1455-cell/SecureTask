const taskService = require('../services/taskService');
const { successResponse } = require('../utils/apiResponse');

const getTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const tasks = await taskService.getTasks(req.user._id, { status, priority });
    return successResponse(res, tasks);
  } catch (error) {
    return next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id);
    return successResponse(res, task);
  } catch (error) {
    return next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    return successResponse(res, task, 201, 'Task created successfully');
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.user._id, req.body);
    return successResponse(res, task, 200, 'Task updated successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user._id);
    return successResponse(res, null, 200, 'Task deleted successfully');
  } catch (error) {
    return next(error);
  }
};

const completeTask = async (req, res, next) => {
  try {
    const task = await taskService.completeTask(req.params.id, req.user._id);
    return successResponse(res, task, 200, 'Task marked as completed');
  } catch (error) {
    return next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, completeTask };
