const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mentor.controller');
const { protect, authorize, mentorScopeGuard } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('mentor', 'admin', 'hod'));

// Mentor dashboard — their sections and summary stats
router.get('/dashboard', mentorScopeGuard, ctrl.getMentorDashboard);

// Their assigned classrooms
router.get('/classrooms', mentorScopeGuard, ctrl.getMentorClassrooms);

// Students in their sections (optional ?section=A filter)
router.get('/students', mentorScopeGuard, ctrl.getMentorStudents);

module.exports = router;
