const { getDashboardStats } = require('../services/taskService');
const { successResponse } = require('../utils/apiResponse');

const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats(req.user._id);
    return successResponse(res, stats);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getStats };
