const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/issue.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { issueDailyLimit } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/stats', ctrl.getStats);
router.get('/my', ctrl.getMyIssues);
router.get('/', ctrl.getIssues);
router.post('/', authorize('student', 'mentor', 'admin'), issueDailyLimit, ctrl.createIssue);
router.get('/:id', ctrl.getIssueById);
// HOD can also update status and comment (oversight role)
router.patch('/:id/status', authorize('mentor', 'hod', 'admin'), ctrl.updateStatus);
router.post('/:id/vote', authorize('student', 'mentor'), ctrl.vote);
router.post('/:id/comment', authorize('mentor', 'hod', 'admin'), ctrl.addComment);
router.delete('/:id', authorize('mentor', 'hod', 'admin'), ctrl.softDelete);

module.exports = router;
