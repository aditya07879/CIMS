const IssueEscalation = require('../models/IssueEscalation.model');
const Issue           = require('../models/Issue.model');
const HODAssignment   = require('../models/HODAssignment.model');
const MentorAssignment = require('../models/MentorAssignment.model');
const Classroom       = require('../models/Classroom.model');
const Notification    = require('../models/Notification.model');

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Resolve which HOD a mentor should forward to.
 * The mentor's MentorAssignment carries dept+year → look up the matching
 * HODAssignment to find the HOD user.
 */
const resolveHODForMentor = async (mentorAssignment) => {
  const hodAssignment = await HODAssignment.findOne({
    department: mentorAssignment.department,
    year:       mentorAssignment.year,
    isActive:   true,
  });
  return hodAssignment; // may be null
};

// ─── Mentor: forward an issue to their HOD ───────────────────────────────────

exports.forwardIssue = async (req, res, next) => {
  try {
    const mentorAssignment = req.mentorAssignment;
    if (!mentorAssignment)
      return res.status(403).json({ success: false, message: 'No active section assignment' });

    const issue = await Issue.findOne({ _id: req.params.issueId, isDeleted: false })
      .populate('classroom', 'department year section')
      .populate('author', 'name department year section rollNumber');

    if (!issue)
      return res.status(404).json({ success: false, message: 'Issue not found' });

    // Authorization: mentor may only forward issues from their assigned classrooms
    const assignedIds = mentorAssignment.classrooms.map(c => String(c._id || c));
    if (!assignedIds.includes(String(issue.classroom._id)))
      return res.status(403).json({
        success: false,
        message: 'Access denied: issue does not belong to your assigned sections',
      });

    // Find the HOD for this dept+year
    const hodAssignment = await resolveHODForMentor(mentorAssignment);
    if (!hodAssignment)
      return res.status(400).json({
        success: false,
        message: 'No HOD is assigned for your department/year. Cannot forward issue.',
      });

    // Prevent duplicate forwarding by the same mentor
    const existing = await IssueEscalation.findOne({
      issue: issue._id,
      forwardedBy: req.user._id,
    });
    if (existing)
      return res.status(409).json({
        success: false,
        message: 'You have already forwarded this issue to your HOD',
        data: existing,
      });

    const { note } = req.body;

    const escalation = await IssueEscalation.create({
      issue:       issue._id,
      forwardedBy: req.user._id,
      forwardedTo: hodAssignment.hod,
      snapshot: {
        title:       issue.title,
        description: issue.description,
        category:    issue.category,
      },
      note: note || undefined,
    });

    // Notify the HOD
    await Notification.create({
      recipient: hodAssignment.hod,
      type:      'issue_escalated',
      title:     'Issue Forwarded to You',
      message:   `Mentor forwarded issue "${issue.title}" from ${issue.classroom.department}-${issue.classroom.year}${issue.classroom.section}.`,
      issue:     issue._id,
    });

    // Notify the student (issue author) that their issue was escalated
    if (!issue.isAnonymous && issue.author) {
      await Notification.create({
        recipient: issue.author._id,
        type:      'issue_escalated',
        title:     'Your Issue Has Been Escalated',
        message:   `Your issue "${issue.title}" has been forwarded to the HOD for further review.`,
        issue:     issue._id,
      });
    }

    const populated = await escalation.populate([
      { path: 'forwardedBy', select: 'name email' },
      { path: 'forwardedTo', select: 'name email' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    // Duplicate key from unique index (race condition)
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Issue already forwarded' });
    next(err);
  }
};

// ─── Mentor: list issues they have forwarded ─────────────────────────────────

exports.getMentorEscalations = async (req, res, next) => {
  try {
    const mentorAssignment = req.mentorAssignment;
    if (!mentorAssignment)
      return res.status(403).json({ success: false, message: 'No active section assignment' });

    const escalations = await IssueEscalation.find({ forwardedBy: req.user._id })
      .sort('-createdAt')
      .populate({
        path: 'issue',
        select: 'title description category status classroom author isAnonymous',
        populate: [
          { path: 'classroom', select: 'department year section' },
          { path: 'author',    select: 'name rollNumber year section department' },
        ],
      })
      .populate('forwardedTo', 'name email')
      .lean();

    res.json({ success: true, count: escalations.length, data: escalations });
  } catch (err) { next(err); }
};

// ─── HOD: get all escalations forwarded to them ──────────────────────────────

exports.getHODEscalations = async (req, res, next) => {
  try {
    if (!req.hodAssignment)
      return res.status(403).json({ success: false, message: 'No active HOD assignment' });

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { forwardedTo: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [escalations, total] = await Promise.all([
      IssueEscalation.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'issue',
          select: 'title description category status classroom author isAnonymous createdAt',
          populate: [
            { path: 'classroom', select: 'department year section' },
            { path: 'author',    select: 'name rollNumber year section department' },
          ],
        })
        .populate('forwardedBy', 'name email')
        .lean(),
      IssueEscalation.countDocuments(filter),
    ]);

    // Build the rich response the HOD dashboard needs
    const enriched = escalations.map(esc => {
      const issue     = esc.issue || {};
      const classroom = issue.classroom || {};
      const author    = issue.author || {};
      return {
        ...esc,
        studentName:     issue.isAnonymous ? 'Anonymous' : (author.name || '—'),
        studentDept:     author.department || classroom.department || '—',
        studentYear:     author.year       || classroom.year       || '—',
        studentSection:  author.section    || classroom.section    || '—',
        mentorName:      esc.forwardedBy?.name || '—',
        issueTitle:      esc.snapshot.title,
        issueDescription: esc.snapshot.description,
        issueCategory:   esc.snapshot.category,
        issueStatus:     issue.status || '—',
        forwardedAt:     esc.createdAt,
      };
    });

    res.json({
      success: true,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data:  enriched,
    });
  } catch (err) { next(err); }
};

// ─── HOD: update escalation status ───────────────────────────────────────────

exports.updateEscalationStatus = async (req, res, next) => {
  try {
    if (!req.hodAssignment)
      return res.status(403).json({ success: false, message: 'No active HOD assignment' });

    const { status } = req.body;
    if (!status)
      return res.status(400).json({ success: false, message: 'status is required' });

    const escalation = await IssueEscalation.findOne({
      _id:         req.params.escalationId,
      forwardedTo: req.user._id, // HOD may only touch their own inbox
    });

    if (!escalation)
      return res.status(404).json({ success: false, message: 'Escalation not found' });

    escalation.status          = status;
    escalation.statusUpdatedBy = req.user._id;
    escalation.statusUpdatedAt = new Date();
    await escalation.save();

    // Notify the mentor who forwarded
    const populated = await escalation.populate([
      { path: 'forwardedBy', select: 'name' },
      { path: 'issue',       select: 'title' },
    ]);

    await Notification.create({
      recipient: escalation.forwardedBy._id,
      type:      'issue_status_changed',
      title:     'Escalation Status Updated',
      message:   `HOD updated the escalation for "${escalation.issue.title}" to "${status}".`,
      issue:     escalation.issue._id,
    });

    res.json({ success: true, data: escalation });
  } catch (err) { next(err); }
};

// ─── Shared: check if a specific issue has been escalated (for detail views) ─

exports.getEscalationForIssue = async (req, res, next) => {
  try {
    const filter = { issue: req.params.issueId };

    // Mentors see only their own escalation; HODs see all escalations to them
    if (req.user.role === 'mentor') {
      filter.forwardedBy = req.user._id;
    } else if (req.user.role === 'hod') {
      filter.forwardedTo = req.user._id;
    }

    const escalation = await IssueEscalation.findOne(filter)
      .populate('forwardedBy', 'name email')
      .populate('forwardedTo', 'name email')
      .lean();

    res.json({ success: true, data: escalation || null });
  } catch (err) { next(err); }
};
