const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/escalation.controller');
const {
  protect,
  authorize,
  mentorScopeGuard,
  hodScopeGuard,
} = require('../middleware/auth.middleware');

router.use(protect);

// ─── Mentor routes ────────────────────────────────────────────────────────────
// Forward an issue to the HOD
router.post(
  '/issues/:issueId/forward',
  authorize('mentor'),
  mentorScopeGuard,
  ctrl.forwardIssue
);

// Mentor: list all issues they have forwarded
router.get(
  '/mentor/escalations',
  authorize('mentor'),
  mentorScopeGuard,
  ctrl.getMentorEscalations
);

// ─── HOD routes ───────────────────────────────────────────────────────────────
// HOD: get all escalations forwarded to them
router.get(
  '/hod/escalations',
  authorize('hod', 'admin'),
  hodScopeGuard,
  ctrl.getHODEscalations
);

// HOD: update escalation status (Acknowledged / Resolved)
router.patch(
  '/hod/escalations/:escalationId/status',
  authorize('hod', 'admin'),
  hodScopeGuard,
  ctrl.updateEscalationStatus
);

// ─── Shared: escalation state for a specific issue (mentor or HOD) ───────────
router.get(
  '/issues/:issueId/escalation',
  authorize('mentor', 'hod', 'admin'),
  ctrl.getEscalationForIssue
);

module.exports = router;
