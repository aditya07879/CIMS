const User = require('../models/User.model');
const MentorAssignment = require('../models/MentorAssignment.model');
const Classroom = require('../models/Classroom.model');
const Issue = require('../models/Issue.model');

/**
 * Mentor: get their assignment and assigned classroom details.
 * Returns only sections/students/issue counts they are authorized to see.
 * Student counts come from the User collection (not classroom.students array)
 * to avoid stale counts if the students array was not kept in sync.
 */
exports.getMentorDashboard = async (req, res, next) => {
  try {
    const assignment = req.mentorAssignment;
    if (!assignment)
      return res.status(403).json({ success: false, message: 'No active section assignment' });

    const classroomIds = assignment.classrooms.map(c => (c._id || c));

    // Fetch classrooms (without the students array — we count separately)
    const classrooms = await Classroom.find({ _id: { $in: classroomIds }, isActive: true })
      .select('-students');

    // Count students per classroom from the User collection (authoritative source)
    const studentCounts = await User.aggregate([
      { $match: { role: 'student', classroom: { $in: classroomIds }, isActive: true } },
      { $group: { _id: '$classroom', count: { $sum: 1 } } },
    ]);
    const studentCountMap = {};
    studentCounts.forEach(sc => { studentCountMap[String(sc._id)] = sc.count; });

    // Count open issues per classroom
    const issueCounts = await Issue.aggregate([
      { $match: { classroom: { $in: classroomIds }, isDeleted: false, status: { $ne: 'Resolved' } } },
      { $group: { _id: '$classroom', count: { $sum: 1 } } },
    ]);
    const issueCountMap = {};
    issueCounts.forEach(ic => { issueCountMap[String(ic._id)] = ic.count; });

    const classroomsWithCounts = classrooms.map(c => ({
      ...c.toObject(),
      studentCount: studentCountMap[String(c._id)] || 0,
      openIssueCount: issueCountMap[String(c._id)] || 0,
    }));

    const totalStudents = classroomsWithCounts.reduce((sum, c) => sum + c.studentCount, 0);

    res.json({
      success: true,
      data: {
        assignment: {
          department: assignment.department,
          year: assignment.year,
        },
        classrooms: classroomsWithCounts,
        stats: {
          totalSections: classrooms.length,
          totalStudents,
        },
      },
    });
  } catch (err) { next(err); }
};

/**
 * Mentor: list only their assigned classrooms.
 */
exports.getMentorClassrooms = async (req, res, next) => {
  try {
    const assignment = req.mentorAssignment;
    if (!assignment)
      return res.status(403).json({ success: false, message: 'No active section assignment' });

    const classroomIds = assignment.classrooms.map(c => (c._id || c));
    const classrooms = await Classroom.find({ _id: { $in: classroomIds }, isActive: true })
      .select('-students');

    res.json({ success: true, count: classrooms.length, data: classrooms });
  } catch (err) { next(err); }
};

/**
 * Mentor: get students across their assigned sections.
 * Optionally filter by ?section=A
 */
exports.getMentorStudents = async (req, res, next) => {
  try {
    const assignment = req.mentorAssignment;
    if (!assignment)
      return res.status(403).json({ success: false, message: 'No active section assignment' });

    const classroomIds = assignment.classrooms.map(c => (c._id || c));

    // Optionally narrow to one section
    let classroomFilter = { _id: { $in: classroomIds }, isActive: true };
    if (req.query.section) classroomFilter.section = req.query.section.toUpperCase();

    const targetClassrooms = await Classroom.find(classroomFilter).select('_id');
    const targetIds = targetClassrooms.map(c => c._id);

    const students = await User.find({ role: 'student', classroom: { $in: targetIds }, isActive: true })
      .select('name email rollNumber section classroom createdAt')
      .populate('classroom', 'section department year');

    res.json({ success: true, count: students.length, data: students });
  } catch (err) { next(err); }
};
