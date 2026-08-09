const express = require('express');
const { analyzeSpending } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.post('/analyze-spending', protect, analyzeSpending);

module.exports = router;
