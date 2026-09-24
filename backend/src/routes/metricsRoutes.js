const express = require('express');
const { getMetrics } = require('../controllers/healthController');

const router = express.Router();

router.get('/', getMetrics);

module.exports = router;
