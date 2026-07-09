const User = require('../models/User.model');
const HODAssignment = require('../models/HODAssignment.model');
const MentorAssignment = require('../models/MentorAssignment.model');
const Classroom = require('../models/Classroom.model');
const Department = require('../models/Department.model');

// ─── Admin: Create a new user as HOD and assign dept+year ────────────────────
// This is the primary HOD creation path: admin provides name/email/password
// plus department+year in a single call.
exports.adminCreateHOD = async (req, res, next) => {
  try {
    const { name, email, password, department, year } = req.body;
    if (!name || !email || !password || !department || !year)
      return res.status(400).json({
        success: false,
        message: 'name, email, password, department, and year are required',
      });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    // Create the user with role=hod
    const hodUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'hod',
      department: department.toUpperCase().trim(),
      year: parseInt(year),
    });

    // Upsert HODAssignment for this dept+year (replaces any prior assignment)
    const assignment = await HODAssignment.findOneAndUpdate(
      { department: department.toUpperCase(), year: parseInt(year) },
      {
        hod: hodUser._id,
        department: department.toUpperCase(),
        year: parseInt(year),
        isActive: true,
        assignedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const populated = await assignment.populate('hod', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `A user with this ${field} already exists.` });
    }
    next(err);
  }
};

// ─── Admin: Assign an existing user as HOD for a dept+year ───────────────────
exports.assignHOD = async (req, res, next) => {
  try {
    const { userId, department, year } = req.body;
    if (!userId || !department || !year)
      return res.status(400).json({ success: false, message: 'userId, department, and year are required' });

    const user = await User.findById(userId);
    if (!user || !user.isActive)
      return res.status(404).json({ success: false, message: 'User not found or inactive' });

    // Promote to hod role if needed
    if (user.role !== 'hod') {
      user.role = 'hod';
      user.department = department.toUpperCase();
      user.year = parseInt(year);
      await user.save({ validateBeforeSave: false });
    }

    // Upsert the HODAssignment — avoids duplicate-key error on the unique index
    const assignment = await HODAssignment.findOneAndUpdate(
      { department: department.toUpperCase(), year: parseInt(year) },
      {
        hod: userId,
        department: department.toUpperCase(),
        year: parseInt(year),
        isActive: true,
        assignedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const populated = await assignment.populate('hod', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An HOD is already assigned for this dept/year.' });
    }
    next(err);
  }
};

// Admin: Get all HOD assignments
exports.getAllHODAssignments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    else filter.isActive = true;

    const assignments = await HODAssignment.find(filter)
      .populate('hod', 'name email')
      .populate('assignedBy', 'name')
      .sort('department year');
    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (err) { next(err); }
};

// Admin: Revoke HOD assignment
exports.revokeHOD = async (req, res, next) => {
  try {
    const assignment = await HODAssignment.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'HOD assignment revoked' });
  } catch (err) { next(err); }
};

// ─── HOD: Get dashboard info for their dept+year ─────────────────────────────
exports.getHODDashboard = async (req, res, next) => {
  try {
    const assignment = req.hodAssignment;
    if (!assignment)
      return res.status(403).json({ success: false, message: 'No active HOD assignment' });

    const { department, year } = assignment;

    const [classrooms, mentors] = await Promise.all([
      Classroom.find({ department, year, isActive: true })
        .populate('mentor', 'name email')
        .select('-students'),
      User.find({ role: 'mentor', department, year, isActive: true })
        .select('name email section'),
    ]);

    res.json({
      success: true,
      data: {
        assignment: { department, year },
        classrooms,
        mentors,
        stats: {
          totalSections: classrooms.length,
          totalMentors: mentors.length,
          sectionsWithMentor: classrooms.filter(c => c.mentor).length,
        },
      },
    });
  } catch (err) { next(err); }
};

// ─── HOD: Create a section (classroom) under their dept+year ─────────────────
exports.hodCreateClassroom = async (req, res, next) => {
  try {
    const assignment = req.hodAssignment;
    const { section, mentorId } = req.body;

    if (!section)
      return res.status(400).json({ success: false, message: 'section is required' });

    const { department, year } = assignment;

    const existing = await Classroom.findOne({ department, year, section: section.toUpperCase() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Section already exists for this dept/year' });

    if (mentorId) {
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== 'mentor')
        return res.status(400).json({ success: false, message: 'Invalid mentor ID' });
      if (mentor.department !== department || Number(mentor.year) !== Number(year))
        return res.status(403).json({ success: false, message: 'Mentor does not belong to this dept/year' });
    }

    const classroom = await Classroom.create({
      department,
      year,
      section: section.toUpperCase(),
      mentor: mentorId || null,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: classroom });
  } catch (err) { next(err); }
};

// ─── HOD: Create mentor accounts under their dept+year ───────────────────────
exports.hodCreateMentor = async (req, res, next) => {
  try {
    const assignment = req.hodAssignment;
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'name, email, and password are required' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const mentor = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'mentor',
      department: assignment.department,
      year: assignment.year,
    });

    res.status(201).json({ success: true, data: mentor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    next(err);
  }
};

// HOD: Update mentor details (name only)
exports.hodUpdateMentor = async (req, res, next) => {
  try {
    const { department, year } = req.hodAssignment;
    const mentor = await User.findOne({ _id: req.params.mentorId, role: 'mentor', department, year, isActive: true });
    if (!mentor)
      return res.status(404).json({ success: false, message: 'Mentor not found in your dept/year' });

    const allowed = ['name'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await User.findByIdAndUpdate(req.params.mentorId, updates, { new: true, runValidators: true })
      .select('name email department year section');
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// HOD: Deactivate a mentor
exports.hodDeactivateMentor = async (req, res, next) => {
  try {
    const { department, year } = req.hodAssignment;
    const mentor = await User.findOne({ _id: req.params.mentorId, role: 'mentor', department, year });
    if (!mentor)
      return res.status(404).json({ success: false, message: 'Mentor not found in your dept/year' });

    await User.findByIdAndUpdate(req.params.mentorId, { isActive: false });
    await MentorAssignment.findOneAndUpdate({ mentor: req.params.mentorId }, { isActive: false });
    await Classroom.updateMany({ mentor: req.params.mentorId }, { $unset: { mentor: '' } });

    res.json({ success: true, message: 'Mentor deactivated' });
  } catch (err) { next(err); }
};

// HOD: List mentors in their dept+year
exports.hodGetMentors = async (req, res, next) => {
  try {
    const { department, year } = req.hodAssignment;
    const mentors = await User.find({ role: 'mentor', department, year, isActive: true })
      .select('name email section createdAt');
    res.json({ success: true, count: mentors.length, data: mentors });
  } catch (err) { next(err); }
};

// HOD: Assign one or more sections to a mentor
// Upserts the MentorAssignment record — canonical source of truth for mentor scope
exports.hodAssignSectionsToMentor = async (req, res, next) => {
  try {
    const { department, year } = req.hodAssignment;
    const { mentorId, sectionIds } = req.body;

    if (!mentorId || !Array.isArray(sectionIds) || sectionIds.length === 0)
      return res.status(400).json({ success: false, message: 'mentorId and sectionIds[] are required' });

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor')
      return res.status(400).json({ success: false, message: 'Invalid mentor' });
    if (mentor.department !== department || Number(mentor.year) !== Number(year))
      return res.status(403).json({ success: false, message: 'Mentor does not belong to your dept/year' });

    // Verify all sections belong to this dept+year
    const classrooms = await Classroom.find({
      _id: { $in: sectionIds },
      department,
      year,
      isActive: true,
    });

    if (classrooms.length !== sectionIds.length)
      return res.status(400).json({ success: false, message: 'One or more section IDs are invalid or not in your dept/year' });

    // Assign mentor to each classroom
    await Classroom.updateMany({ _id: { $in: sectionIds } }, { mentor: mentorId });

    // Update mentor's primary section reference (backward-compat with issue routing)
    const firstSection = classrooms[0];
    await User.findByIdAndUpdate(mentorId, {
      section: firstSection.section,
      classroom: firstSection._id,
    });

    // Upsert MentorAssignment — canonical source of truth for mentor scope
    await MentorAssignment.findOneAndUpdate(
      { mentor: mentorId },
      {
        mentor: mentorId,
        department,
        year,
        classrooms: sectionIds,
        isActive: true,
        assignedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const updated = await Classroom.find({ _id: { $in: sectionIds } }).populate('mentor', 'name email');
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// HOD: Get classrooms in their dept+year
exports.hodGetClassrooms = async (req, res, next) => {
  try {
    const { department, year } = req.hodAssignment;
    const classrooms = await Classroom.find({ department, year, isActive: true })
      .populate('mentor', 'name email')
      .select('-students');
    res.json({ success: true, count: classrooms.length, data: classrooms });
  } catch (err) { next(err); }
};

// HOD: Get students in their dept+year (optionally filter by section)
exports.hodGetStudents = async (req, res, next) => {
  try {
    const { department, year } = req.hodAssignment;
    const filter = { role: 'student', department, year, isActive: true };
    if (req.query.section) filter.section = req.query.section.toUpperCase();

    const students = await User.find(filter)
      .select('name email rollNumber section classroom createdAt')
      .populate('classroom', 'section');

    res.json({ success: true, count: students.length, data: students });
  } catch (err) { next(err); }
};
