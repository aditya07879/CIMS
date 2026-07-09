const Classroom = require('../models/Classroom.model');
const User = require('../models/User.model');

exports.createClassroom = async (req, res, next) => {
  try {
    const { department, year, section, mentorId } = req.body;
    const existing = await Classroom.findOne({ department, year, section });
    if (existing) return res.status(409).json({ success: false, message: 'Classroom already exists' });

    if (mentorId) {
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== 'mentor')
        return res.status(400).json({ success: false, message: 'Invalid mentor ID' });
    }

    const classroom = await Classroom.create({ department, year, section, mentor: mentorId || null });
    res.status(201).json({ success: true, data: classroom });
  } catch (err) { next(err); }
};

exports.getAllClassrooms = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year) filter.year = parseInt(req.query.year);
    const classrooms = await Classroom.find(filter).populate('mentor', 'name email').select('-students');
    res.json({ success: true, count: classrooms.length, data: classrooms });
  } catch (err) { next(err); }
};

exports.getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('mentor', 'name email')
      .populate('students', 'name email rollNumber');
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found' });
    res.json({ success: true, data: classroom });
  } catch (err) { next(err); }
};

exports.getMyClassroom = async (req, res, next) => {
  try {
    if (!req.user.classroom) return res.status(404).json({ success: false, message: 'Not assigned to any classroom' });
    const classroom = await Classroom.findById(req.user.classroom)
      .populate('mentor', 'name email')
      .populate('students', 'name email rollNumber');
    res.json({ success: true, data: classroom });
  } catch (err) { next(err); }
};

exports.assignMentor = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor')
      return res.status(400).json({ success: false, message: 'Invalid mentor' });
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id, { mentor: mentorId }, { new: true }
    ).populate('mentor', 'name email');
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found' });
    res.json({ success: true, data: classroom });
  } catch (err) { next(err); }
};

exports.deleteClassroom = async (req, res, next) => {
  try {
    await Classroom.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Classroom deactivated' });
  } catch (err) { next(err); }
};
