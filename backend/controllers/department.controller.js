const Department = require('../models/Department.model');

// Admin: create a new department
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, fullName } = req.body;
    if (!name || !fullName)
      return res.status(400).json({ success: false, message: 'name and fullName are required' });

    const existing = await Department.findOne({ name: name.toUpperCase() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Department already exists' });

    const dept = await Department.create({ name, fullName, createdBy: req.user._id });
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
};

// Get all active departments
exports.getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .sort('name')
      .select('name fullName createdAt');
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) { next(err); }
};

// Admin: update department
exports.updateDepartment = async (req, res, next) => {
  try {
    const { fullName, isActive } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (isActive !== undefined) updates.isActive = isActive;

    const dept = await Department.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    res.json({ success: true, data: dept });
  } catch (err) { next(err); }
};

// Admin: soft-delete department
exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deactivated' });
  } catch (err) { next(err); }
};
