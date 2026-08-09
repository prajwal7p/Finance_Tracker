const express = require('express');
const { getAdminOverview, toggleUserStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/overview', getAdminOverview);
router.patch('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
