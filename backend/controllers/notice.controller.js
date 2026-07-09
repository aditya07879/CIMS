const path         = require('path');
const fs           = require('fs');
const Notice       = require('../models/Notice.model');
const Classroom    = require('../models/Classroom.model');
const MentorAssignment = require('../models/MentorAssignment.model');
const { UPLOAD_DIR } = require('../middleware/upload.middleware');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the list of classroom ObjectIds a mentor is authorised to post to.
 * Honours both req.mentorAssignment (set by auth middleware) and a direct DB
 * lookup so the helper works even if called outside a scoped route.
 */
const getMentorClassroomIds = async (userId, mentorAssignment) => {
  const ma = mentorAssignment
    || await MentorAssignment.findOne({ mentor: userId, isActive: true });
  if (!ma) return null;   // null means "no active assignment"
  return {
    ids:        ma.classrooms.map(c => (c._id || c)),
    department: ma.department,
    year:       ma.year,
  };
};

/**
 * Build the visibility filter used in list queries.
 * Returns a mongo $match fragment for the `visibility` field.
 */
const visibilityFilter = (role) => {
  if (role === 'student') return { visibility: { $in: ['student', 'both'] } };
  if (role === 'mentor')  return { visibility: { $in: ['mentor', 'both'] } };
  // HOD / admin see everything
  return {};
};

// ── Create notice (Mentor) ────────────────────────────────────────────────────
exports.mentorCreateNotice = async (req, res, next) => {
  try {
    const { title, description, classroomIds } = req.body;

    if (!title || !description)
      return res.status(400).json({ success: false, message: 'title and description are required' });

    // Resolve mentor's authorised classrooms
    const scope = await getMentorClassroomIds(req.user._id, req.mentorAssignment);
    if (!scope)
      return res.status(403).json({ success: false, message: 'No active classroom assignment' });

    // Parse target classrooms
    let targets;
    try {
      targets = classroomIds
        ? (Array.isArray(classroomIds) ? classroomIds : JSON.parse(classroomIds))
        : scope.ids.map(String);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid classroomIds format' });
    }

    // Validate: every requested classroom must be within the mentor's scope
    const scopeSet = new Set(scope.ids.map(String));
    const invalid  = targets.filter(id => !scopeSet.has(String(id)));
    if (invalid.length)
      return res.status(403).json({ success: false, message: 'One or more classrooms are outside your assigned sections' });

    if (!targets.length)
      return res.status(400).json({ success: false, message: 'At least one target classroom is required' });

    // Build attachment meta if a file was uploaded
    let attachment;
    if (req.file) {
      attachment = {
        filename:   req.file.originalname,
        storedName: req.file.filename,
        mimeType:   req.file.mimetype,
        size:       req.file.size,
      };
    }

    const notice = await Notice.create({
      title:            title.trim(),
      description:      description.trim(),
      createdBy:        req.user._id,
      creatorRole:      'mentor',
      targetClassrooms: targets,
      department:       scope.department,
      year:             scope.year,
      visibility:       'student',   // mentor notices always target students
      attachment,
    });

    const populated = await notice.populate('createdBy', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// ── Create notice (HOD) ───────────────────────────────────────────────────────
exports.hodCreateNotice = async (req, res, next) => {
  try {
    const { title, description, visibility, classroomIds } = req.body;

    if (!title || !description)
      return res.status(400).json({ success: false, message: 'title and description are required' });

    const VALID_VISIBILITY = ['mentor', 'student', 'both'];
    const vis = visibility || 'both';
    if (!VALID_VISIBILITY.includes(vis))
      return res.status(400).json({ success: false, message: 'visibility must be mentor | student | both' });

    const hodAssignment = req.hodAssignment;
    if (!hodAssignment)
      return res.status(403).json({ success: false, message: 'No active HOD assignment' });

    // Fetch all classrooms in HOD's dept+year
    const allClassrooms = await Classroom.find({
      department: hodAssignment.department,
      year:       hodAssignment.year,
      isActive:   true,
    }).select('_id');

    const allIds   = allClassrooms.map(c => String(c._id));
    const scopeSet = new Set(allIds);

    // Resolve target classrooms
    let targets;
    if (!classroomIds || !classroomIds.length) {
      // Default: all classrooms in dept+year
      targets = allIds;
    } else {
      try {
        targets = Array.isArray(classroomIds) ? classroomIds : JSON.parse(classroomIds);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid classroomIds format' });
      }
      const invalid = targets.filter(id => !scopeSet.has(String(id)));
      if (invalid.length)
        return res.status(403).json({ success: false, message: 'One or more classrooms are outside your assigned dept/year' });
    }

    if (!targets.length)
      return res.status(400).json({ success: false, message: 'No active classrooms found in your assignment' });

    let attachment;
    if (req.file) {
      attachment = {
        filename:   req.file.originalname,
        storedName: req.file.filename,
        mimeType:   req.file.mimetype,
        size:       req.file.size,
      };
    }

    const notice = await Notice.create({
      title:            title.trim(),
      description:      description.trim(),
      createdBy:        req.user._id,
      creatorRole:      'hod',
      targetClassrooms: targets,
      department:       hodAssignment.department,
      year:             hodAssignment.year,
      visibility:       vis,
      attachment,
    });

    const populated = await notice.populate('createdBy', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// ── List notices ──────────────────────────────────────────────────────────────
/**
 * GET /api/notices
 *
 * Role-based filtering:
 *   student → notices whose targetClassrooms includes their classroom
 *             AND visibility in ['student','both']
 *   mentor  → notices targeting at least one of their classrooms
 *             AND visibility in ['mentor','both']
 *             PLUS their own notices (they created)
 *   hod     → all notices for their dept+year
 *   admin   → all notices (optional ?department & ?year filters)
 */
exports.getNotices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const role = req.user.role;

    let filter = { isActive: true };

    if (role === 'student') {
      const classroomId = req.user.classroom?._id || req.user.classroom;
      if (!classroomId)
        return res.json({ success: true, total: 0, data: [] });

      filter = {
        ...filter,
        targetClassrooms: classroomId,
        ...visibilityFilter('student'),
      };

    } else if (role === 'mentor') {
      const scope = await getMentorClassroomIds(req.user._id, req.mentorAssignment);
      if (!scope)
        return res.json({ success: true, total: 0, data: [] });

      // Mentor sees: notices scoped to their classrooms with mentor/both visibility
      // OR notices they personally created (always visible to creator)
      filter = {
        ...filter,
        $or: [
          {
            targetClassrooms: { $in: scope.ids },
            ...visibilityFilter('mentor'),
          },
          { createdBy: req.user._id },
        ],
      };

    } else if (role === 'hod') {
      const ha = req.hodAssignment;
      if (!ha) return res.json({ success: true, total: 0, data: [] });

      // HOD sees only HOD-created notices in their dept+year.
      // Mentor-created notices are student-facing only; HOD does not receive them.
      filter = {
        ...filter,
        creatorRole: 'hod',
        department:  ha.department,
        year:        ha.year,
      };

    } else if (role === 'admin') {
      // Optional filters
      if (req.query.department) filter.department = req.query.department.toUpperCase();
      if (req.query.year)       filter.year       = parseInt(req.query.year);
    }

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name role')
        .populate('targetClassrooms', 'department year section'),
      Notice.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: parseInt(page), data: notices });
  } catch (err) { next(err); }
};

// ── Get single notice ─────────────────────────────────────────────────────────
exports.getNoticeById = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isActive: true })
      .populate('createdBy', 'name role')
      .populate('targetClassrooms', 'department year section');

    if (!notice)
      return res.status(404).json({ success: false, message: 'Notice not found' });

    const role = req.user.role;

    // Student: must be in a target classroom AND visibility allows students
    if (role === 'student') {
      const classroomId = String(req.user.classroom?._id || req.user.classroom);
      const inScope = notice.targetClassrooms.some(c => String(c._id) === classroomId);
      const canSee  = ['student', 'both'].includes(notice.visibility);
      if (!inScope || !canSee)
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Mentor: must have at least one matching classroom OR be the creator
    if (role === 'mentor') {
      const scope = await getMentorClassroomIds(req.user._id, req.mentorAssignment);
      const scopeSet = new Set((scope?.ids || []).map(String));
      const inScope  = notice.targetClassrooms.some(c => scopeSet.has(String(c._id)));
      const canSee   = ['mentor', 'both'].includes(notice.visibility);
      const isOwn    = String(notice.createdBy._id) === String(req.user._id);
      if (!isOwn && (!inScope || !canSee))
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // HOD: must be same dept+year AND notice must be HOD-created
    // (mentor notices are student-facing only; HOD cannot access them)
    if (role === 'hod') {
      const ha = req.hodAssignment;
      if (
        !ha ||
        notice.department !== ha.department ||
        notice.year       !== ha.year       ||
        notice.creatorRole !== 'hod'
      ) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: notice });
  } catch (err) { next(err); }
};

// ── Delete notice (soft) ──────────────────────────────────────────────────────
exports.deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isActive: true });
    if (!notice)
      return res.status(404).json({ success: false, message: 'Notice not found' });

    const role = req.user.role;

    // Only the creator or admin may delete
    if (role !== 'admin' && String(notice.createdBy) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'You can only delete your own notices' });

    notice.isActive = false;
    await notice.save();

    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) { next(err); }
};

// ── Serve attachment (authorised download) ────────────────────────────────────
exports.downloadAttachment = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({ _id: req.params.id, isActive: true });
    if (!notice || !notice.attachment?.storedName)
      return res.status(404).json({ success: false, message: 'Attachment not found' });

    const role = req.user.role;

    // Apply same scope checks as getNoticeById
    if (role === 'student') {
      const classroomId = String(req.user.classroom?._id || req.user.classroom);
      const inScope = notice.targetClassrooms.some(c => String(c) === classroomId);
      if (!inScope || !['student', 'both'].includes(notice.visibility))
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (role === 'mentor') {
      const scope = await getMentorClassroomIds(req.user._id, req.mentorAssignment);
      const scopeSet = new Set((scope?.ids || []).map(String));
      const inScope  = notice.targetClassrooms.some(c => scopeSet.has(String(c)));
      const isOwn    = String(notice.createdBy) === String(req.user._id);
      if (!isOwn && (!inScope || !['mentor', 'both'].includes(notice.visibility)))
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (role === 'hod') {
      const ha = req.hodAssignment;
      if (
        !ha ||
        notice.department !== ha.department ||
        notice.year       !== ha.year       ||
        notice.creatorRole !== 'hod'
      ) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filePath = path.join(UPLOAD_DIR, notice.attachment.storedName);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: 'File not found on server' });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(notice.attachment.filename)}"`);
    res.setHeader('Content-Type', notice.attachment.mimeType || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err) { next(err); }
};
