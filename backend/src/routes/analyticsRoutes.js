const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardData);

module.exports = router;
