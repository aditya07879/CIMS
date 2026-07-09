const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// All authenticated users can see departments
router.get('/', ctrl.getAllDepartments);

// Admin only: create / update / delete
router.post('/', authorize('admin'), ctrl.createDepartment);
router.patch('/:id', authorize('admin'), ctrl.updateDepartment);
router.delete('/:id', authorize('admin'), ctrl.deleteDepartment);

module.exports = router;
