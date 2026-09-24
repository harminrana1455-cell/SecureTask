const { registerUser, loginUser } = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await registerUser({ name, email, password });
    return successResponse(res, { user, token }, 201, 'User registered successfully');
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });
    return successResponse(res, { user, token }, 200, 'Login successful');
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login };
