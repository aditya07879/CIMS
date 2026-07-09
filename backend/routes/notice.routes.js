const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notice.controller');
const { protect, authorize, mentorScopeGuard, hodScopeGuard } = require('../middleware/auth.middleware');
const { uploadAttachment } = require('../middleware/upload.middleware');

router.use(protect);

// ── Read (all authorised roles) ───────────────────────────────────────────────
router.get('/',     authorize('student', 'mentor', 'hod', 'admin'), ctrl.getNotices);
router.get('/:id',  authorize('student', 'mentor', 'hod', 'admin'), ctrl.getNoticeById);

// ── Attachment download (authorised, streamed) ────────────────────────────────
router.get('/:id/attachment', authorize('student', 'mentor', 'hod', 'admin'), ctrl.downloadAttachment);

// ── Mentor: create notices for their assigned classrooms ──────────────────────
router.post(
  '/mentor',
  authorize('mentor'),
  mentorScopeGuard,
  uploadAttachment,
  ctrl.mentorCreateNotice
);

// ── HOD: create notices for their dept+year ───────────────────────────────────
router.post(
  '/hod',
  authorize('hod', 'admin'),
  hodScopeGuard,
  uploadAttachment,
  ctrl.hodCreateNotice
);

// ── Delete (creator or admin) ─────────────────────────────────────────────────
router.delete('/:id', authorize('mentor', 'hod', 'admin'), ctrl.deleteNotice);

module.exports = router;
