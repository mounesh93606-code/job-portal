const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Apply to a job (Seekers only)
router.post('/', verifyToken, authorizeRoles('seeker'), applicationController.applyToJob);

// Get application list (Seeker, Employer, Admin)
router.get('/', verifyToken, authorizeRoles('seeker', 'employer', 'admin'), applicationController.getApplications);

// Update status (Employer and Admin only)
router.put('/:id/status', verifyToken, authorizeRoles('employer', 'admin'), applicationController.updateApplicationStatus);

// Schedule Interview (Employer and Admin only)
router.put('/:id/schedule', verifyToken, authorizeRoles('employer', 'admin'), applicationController.scheduleInterview);

// Generate AI Offer Letter Draft (Employer and Admin only)
router.post('/:id/generate-offer', verifyToken, authorizeRoles('employer', 'admin'), applicationController.generateOfferLetter);

// Send Offer Letter PDF & Email (Employer and Admin only)
router.post('/:id/send-offer', verifyToken, authorizeRoles('employer', 'admin'), applicationController.sendOfferLetter);

module.exports = router;
