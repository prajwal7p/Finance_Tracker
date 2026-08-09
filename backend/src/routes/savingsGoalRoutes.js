const express = require('express');
const router = express.Router();
const {
  createSavingsGoal,
  getSavingsGoals,
  depositToGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} = require('../controllers/savingsGoalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createSavingsGoal)
  .get(getSavingsGoals);

router.route('/:id')
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

router.patch('/:id/deposit', depositToGoal);

module.exports = router;
