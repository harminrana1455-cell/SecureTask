const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getHealth = (req, res) => {
  return successResponse(res, {
    status: 'healthy',
    service: 'securetask-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
};

const getDatabaseHealth = async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const isHealthy = state === 1;
    if (isHealthy) {
      await mongoose.connection.db.admin().ping();
    }
    const responseData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: 'mongodb',
      state: stateMap[state] || 'unknown',
      timestamp: new Date().toISOString(),
    };
    if (!isHealthy) {
      return errorResponse(res, 'Database is not connected', 503, [responseData]);
    }
    return successResponse(res, responseData);
  } catch (error) {
    return errorResponse(res, 'Database health check failed', 503);
  }
};

const getMetrics = (req, res) => {
  const mem = process.memoryUsage();
  return successResponse(res, {
    uptime: process.uptime(),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    },
    pid: process.pid,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth, getDatabaseHealth, getMetrics };
