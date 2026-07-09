const Issue = require('../models/Issue.model');
const Notification = require('../models/Notification.model');
const Classroom = require('../models/Classroom.model');

const notifyClassroomMentor = async (classroomId, type, title, message, issueId) => {
  const classroom = await Classroom.findById(classroomId).select('mentor');
  if (classroom?.mentor) {
    await Notification.create({ recipient: classroom.mentor, type, title, message, issue: issueId });
  }
};

// Student/Mentor/Admin: create issue
exports.createIssue = async (req, res, next) => {
  try {
    const { title, description, category, isAnonymous, tags } = req.body;
    const classroomId = req.user.classroom;
    if (!classroomId) return res.status(400).json({ success: false, message: 'You are not in a classroom' });

    const issue = await Issue.create({
      title, description, category, isAnonymous: isAnonymous || false,
      tags: tags || [], author: req.user._id, classroom: classroomId,
    });

    await notifyClassroomMentor(classroomId, 'issue_created', 'New Issue Raised',
      `A new issue "${title}" has been raised in your classroom.`, issue._id);

    res.status(201).json({ success: true, data: issue });
  } catch (err) { next(err); }
};

// Get issues for classroom (student sees anonymous)
exports.getIssues = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = { isDeleted: false };

    if (req.user.role === 'student') {
      filter.classroom = req.user.classroom;
    } else if (req.user.role === 'mentor') {
      // Strict scope: only classrooms assigned via MentorAssignment
      const MentorAssignment = require('../models/MentorAssignment.model');
      const ma = await MentorAssignment.findOne({ mentor: req.user._id, isActive: true });
      if (ma && ma.classrooms.length > 0) {
        filter.classroom = { $in: ma.classrooms };
      } else {
        // Fallback to legacy single-classroom field for backward compatibility
        filter.classroom = req.user.classroom || null;
      }
      // Allow explicit classroomId override only if it's within their scope
      if (req.query.classroomId) {
        const allowed = ma?.classrooms.map(c => String(c)) || [];
        if (allowed.includes(String(req.query.classroomId))) {
          filter.classroom = req.query.classroomId;
        }
      }
    } else if (req.user.role === 'hod') {
      // HOD sees issues across all classrooms in their dept+year
      if (req.hodAssignment) {
        const ClassroomModel = require('../models/Classroom.model');
        const clsRooms = await ClassroomModel.find({ department: req.hodAssignment.department, year: req.hodAssignment.year, isActive: true }).select('_id');
        filter.classroom = { $in: clsRooms.map(c => c._id) };
      } else if (req.query.classroomId) {
        filter.classroom = req.query.classroomId;
      }
    } else if (req.query.classroomId) {
      filter.classroom = req.query.classroomId;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('classroom', 'department year section')
        .populate('statusUpdatedBy', 'name')
        .populate('author', 'name role'),
      Issue.countDocuments(filter),
    ]);

    // Mask author for anonymous issues (students only)
    const sanitized = issues.map(issue => {
      const obj = issue.toObject({ virtuals: true });
      if (issue.isAnonymous && req.user.role === 'student') {
        obj.author = null;
        obj.authorName = 'Anonymous';
      }
      return obj;
    });

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), data: sanitized });
  } catch (err) { next(err); }
};

exports.getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, isDeleted: false })
      .populate('classroom', 'department year section')
      .populate('comments.author', 'name role')
      .populate('author', 'name role');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    if (req.user.role === 'student' && String(issue.classroom._id) !== String(req.user.classroom?._id || req.user.classroom))
      return res.status(403).json({ success: false, message: 'Access denied' });

    // Mentors can only view issues in their assigned classrooms
    if (req.user.role === 'mentor') {
      const MentorAssignment = require('../models/MentorAssignment.model');
      const ma = await MentorAssignment.findOne({ mentor: req.user._id, isActive: true });
      const allowed = ma?.classrooms.map(c => String(c)) || [String(req.user.classroom)];
      if (!allowed.includes(String(issue.classroom._id)))
        return res.status(403).json({ success: false, message: 'Access denied: issue not in your assigned section' });
    }

    const obj = issue.toObject({ virtuals: true });
    if (issue.isAnonymous && req.user.role === 'student') {
      obj.author = null;
      obj.authorName = 'Anonymous';
    }
    res.json({ success: true, data: obj });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, statusUpdatedBy: req.user._id, statusUpdatedAt: new Date(),
        ...(status === 'Resolved' ? { resolvedAt: new Date() } : {}) },
      { new: true, runValidators: true }
    );
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    await Notification.create({
      recipient: issue.author, type: 'issue_status_changed',
      title: 'Issue Status Updated',
      message: `Your issue "${issue.title}" is now "${status}".`,
      issue: issue._id,
    });

    res.json({ success: true, data: issue });
  } catch (err) { next(err); }
};

exports.vote = async (req, res, next) => {
  try {
    const { type } = req.body; // 'up' | 'down' | 'remove'
    const userId = req.user._id;
    const issue = await Issue.findOne({ _id: req.params.id, isDeleted: false });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Remove from both first
    issue.upvotes = issue.upvotes.filter(id => String(id) !== String(userId));
    issue.downvotes = issue.downvotes.filter(id => String(id) !== String(userId));

    if (type === 'up') issue.upvotes.push(userId);
    else if (type === 'down') issue.downvotes.push(userId);

    await issue.save();
    res.json({ success: true, data: { upvotes: issue.upvotes.length, downvotes: issue.downvotes.length } });
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $push: { comments: { author: req.user._id, content } } },
      { new: true }
    ).populate('comments.author', 'name role');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    await Notification.create({
      recipient: issue.author, type: 'new_comment',
      title: 'New Comment on Your Issue',
      message: `A mentor commented on your issue "${issue.title}".`,
      issue: issue._id,
    });

    res.json({ success: true, data: issue.comments });
  } catch (err) { next(err); }
};

exports.softDelete = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Delete reason required' });
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedBy: req.user._id, deleteReason: reason, deletedAt: new Date() },
      { new: true }
    );
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    await Notification.create({
      recipient: issue.author, type: 'issue_deleted',
      title: 'Issue Removed',
      message: `Your issue "${issue.title}" was removed. Reason: ${reason}`,
      issue: issue._id,
    });

    res.json({ success: true, message: 'Issue deleted', data: issue });
  } catch (err) { next(err); }
};

exports.getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ author: req.user._id, isDeleted: false })
      .sort('-createdAt').populate('classroom', 'department year section');
    res.json({ success: true, data: issues });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    let match = { isDeleted: false };

    if (req.user.role === 'admin') {
      // Admin can filter by a specific classroom via query param
      if (req.query.classroomId) match.classroom = req.query.classroomId;
    } else if (req.user.role === 'mentor') {
      // Mentor sees stats only for their assigned classrooms
      const MentorAssignment = require('../models/MentorAssignment.model');
      const ma = await MentorAssignment.findOne({ mentor: req.user._id, isActive: true });
      if (ma && ma.classrooms.length > 0) {
        match.classroom = { $in: ma.classrooms };
      } else {
        // Fallback: single classroom field for backward-compat
        match.classroom = req.user.classroom || null;
      }
    } else if (req.user.role === 'hod') {
      // HOD sees stats across their whole dept+year
      if (req.hodAssignment) {
        const clsRooms = await Classroom.find({
          department: req.hodAssignment.department,
          year: req.hodAssignment.year,
          isActive: true,
        }).select('_id');
        match.classroom = { $in: clsRooms.map(c => c._id) };
      }
    } else {
      // Student sees only their own classroom
      match.classroom = req.user.classroom;
    }

    const stats = await Issue.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = await Issue.countDocuments(match);
    res.json({ success: true, data: { total, byStatus: stats } });
  } catch (err) { next(err); }
};
