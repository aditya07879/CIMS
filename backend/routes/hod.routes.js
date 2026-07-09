const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hod.controller');
const { protect, authorize, hodScopeGuard } = require('../middleware/auth.middleware');

router.use(protect);

// ─── Admin-only: manage HOD assignments ──────────────────────────────────────
router.get('/assignments', authorize('admin'), ctrl.getAllHODAssignments);
// Admin creates a brand-new user account with role=hod and assigns dept+year
router.post('/create', authorize('admin'), ctrl.adminCreateHOD);
// Admin assigns an existing user as HOD (promotes them + sets dept+year)
router.post('/assignments', authorize('admin'), ctrl.assignHOD);
router.delete('/assignments/:id', authorize('admin'), ctrl.revokeHOD);

// ─── HOD-only routes (hodScopeGuard blocks HODs without an active assignment) ─
// Dashboard overview
router.get('/dashboard', authorize('hod', 'admin'), hodScopeGuard, ctrl.getHODDashboard);

// Section management
router.get('/classrooms', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodGetClassrooms);
router.post('/classrooms', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodCreateClassroom);

// Mentor management
router.get('/mentors', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodGetMentors);
router.post('/mentors', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodCreateMentor);
// assign-sections BEFORE :mentorId to avoid route conflict
router.post('/mentors/assign-sections', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodAssignSectionsToMentor);
router.patch('/mentors/:mentorId', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodUpdateMentor);
router.delete('/mentors/:mentorId', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodDeactivateMentor);

// Students overview
router.get('/students', authorize('hod', 'admin'), hodScopeGuard, ctrl.hodGetStudents);

module.exports = router;
