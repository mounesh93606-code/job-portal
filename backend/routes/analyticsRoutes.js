const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Get analytics data (Seeker, Employer, Admin)
router.get('/', verifyToken, authorizeRoles('seeker', 'employer', 'admin'), analyticsController.getAnalytics);

// Admin-only User Management routes
router.get('/users', verifyToken, authorizeRoles('admin'), analyticsController.adminGetUsers);
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), analyticsController.adminDeleteUser);

module.exports = router;
