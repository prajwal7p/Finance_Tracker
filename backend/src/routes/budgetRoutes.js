const express = require('express');
const router = express.Router();
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createBudget)
  .get(getBudgets);

router.route('/:id')
  .put(updateBudget)
  .delete(deleteBudget);

module.exports = router;
