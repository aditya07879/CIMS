const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/classroom.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', ctrl.getAllClassrooms);
router.get('/my', ctrl.getMyClassroom);
router.get('/:id', ctrl.getClassroomById);
// Admin and HOD can create classrooms via the main endpoint
router.post('/', authorize('admin', 'hod'), ctrl.createClassroom);
router.patch('/:id/mentor', authorize('admin', 'hod'), ctrl.assignMentor);
router.delete('/:id', authorize('admin', 'hod'), ctrl.deleteClassroom);

module.exports = router;
