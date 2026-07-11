const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

// Protected routes (Employer and Admin only)
router.post('/', verifyToken, authorizeRoles('employer', 'admin'), jobController.createJob);
router.put('/:id', verifyToken, authorizeRoles('employer', 'admin'), jobController.updateJob);
router.delete('/:id', verifyToken, authorizeRoles('employer', 'admin'), jobController.deleteJob);

module.exports = router;
