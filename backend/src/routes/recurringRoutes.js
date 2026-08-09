const express = require('express');
const router = express.Router();
const {
  createRecurring,
  getRecurring,
  toggleRecurringStatus,
  deleteRecurring,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createRecurring)
  .get(getRecurring);

router.route('/:id')
  .delete(deleteRecurring);

router.patch('/:id/toggle', toggleRecurringStatus);

module.exports = router;
