const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const HODAssignment = require('../models/HODAssignment.model');
const MentorAssignment = require('../models/MentorAssignment.model');

exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const token = auth.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      const msg = jwtErr.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message: msg });
    }

    const user = await User.findById(decoded.id).populate('classroom');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    // ── Token invalidation check ────────────────────────────────────────────
    // If tokenIssuedAt is set, reject tokens issued before the stored timestamp.
    // This allows server-side logout / forced session revocation.
    if (user.tokenIssuedAt) {
      const tokenIat = decoded.iat * 1000; // JWT iat is in seconds
      if (tokenIat < user.tokenIssuedAt.getTime()) {
        return res.status(401).json({ success: false, message: 'Session has been invalidated. Please log in again.' });
      }
    }

    req.user = user;

    // Attach HOD assignment for scope enforcement downstream
    if (user.role === 'hod') {
      const hodAssignment = await HODAssignment.findOne({ hod: user._id, isActive: true });
      req.hodAssignment = hodAssignment || null;
    }

    // Attach mentor assignment for scope enforcement downstream
    if (user.role === 'mentor') {
      const mentorAssignment = await MentorAssignment.findOne({ mentor: user._id, isActive: true })
        .populate('classrooms', 'department year section');
      req.mentorAssignment = mentorAssignment || null;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied: role '${req.user.role}' is not permitted.` });
  }
  next();
};

// Middleware: HOD can only access their assigned dept+year
exports.hodScopeGuard = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  if (req.user.role !== 'hod') {
    return res.status(403).json({ success: false, message: 'HOD access required.' });
  }

  if (!req.hodAssignment) {
    return res.status(403).json({ success: false, message: 'No active HOD assignment found.' });
  }

  next();
};

// Middleware: mentor can only access their assigned sections
exports.mentorScopeGuard = async (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'hod') return next();

  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, message: 'Mentor access required.' });
  }

  if (!req.mentorAssignment) {
    return res.status(403).json({ success: false, message: 'No active section assignment for this mentor.' });
  }

  next();
};
