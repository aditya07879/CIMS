const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Classroom = require('../models/Classroom.model');

// ─── Constants ───────────────────────────────────────────────────────────────
// Only 'student' may self-register. All privileged roles are created by admin/HOD only.
const SELF_REGISTERABLE_ROLES = ['student'];

// ─── Token helpers ───────────────────────────────────────────────────────────
const signToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.startsWith('CHANGE_ME')) {
    // Fail loud in production; warn in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured for production. Aborting.');
    }
    console.warn('[SECURITY WARNING] JWT_SECRET is not set to a strong value. Set a 64-byte random secret in .env before deploying.');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ success: true, token, data: user });
};

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, department, year, section } = req.body;

    // ── 1. Role guard: only 'student' allowed from public registration ──────
    const requestedRole = (role || 'student').toLowerCase();
    if (!SELF_REGISTERABLE_ROLES.includes(requestedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only students may self-register. Contact an administrator to create other account types.',
      });
    }

    // ── 2. Required fields for students ────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (!rollNumber || !department || !year || !section) {
      return res.status(400).json({
        success: false,
        message: 'Roll number, department, year, and section are required for student registration.',
      });
    }

    // ── 3. Email uniqueness ─────────────────────────────────────────────────
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    // ── 4. Roll number uniqueness within department ─────────────────────────
    const rollExists = await User.findOne({
      rollNumber: rollNumber.toUpperCase().trim(),
      department: department.toUpperCase().trim(),
      role: 'student',
    });
    if (rollExists) {
      return res.status(409).json({
        success: false,
        message: 'A student with this roll number already exists in the selected department.',
      });
    }

    // ── 5. Validate classroom exists ────────────────────────────────────────
    const classroom = await Classroom.findOne({
      department: department.toUpperCase(),
      year: parseInt(year),
      section: section.toUpperCase(),
    });
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'No classroom found for the given department, year, and section. Contact your administrator.',
      });
    }

    // ── 6. Create student ───────────────────────────────────────────────────
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',             // always hardcoded, never from request body
      rollNumber: rollNumber.toUpperCase().trim(),
      department: department.toUpperCase().trim(),
      year: parseInt(year),
      section: section.toUpperCase().trim(),
      classroom: classroom._id,
      tokenIssuedAt: new Date(),
    });

    await Classroom.findByIdAndUpdate(classroom._id, { $addToSet: { students: user._id } });

    sendAuthResponse(res, user, 201);
  } catch (err) {
    // Duplicate key (race condition safety net)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `A user with this ${field} already exists.` });
    }
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact your administrator.' });
    }

    // Refresh tokenIssuedAt on login so previous sessions are not automatically invalidated
    // (they remain valid until their own expiry). To force logout-all, update tokenIssuedAt.
    sendAuthResponse(res, user);
  } catch (err) { next(err); }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// Invalidates all currently-issued tokens for this user by advancing tokenIssuedAt.
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { tokenIssuedAt: new Date() });
    res.json({ success: true, message: 'Logged out successfully. All active sessions have been invalidated.' });
  } catch (err) { next(err); }
};

// ─── Get current user ─────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('classroom', 'department year section');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── Update profile (name / rollNumber only) ──────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'rollNumber'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── Admin: list all users ────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department.toUpperCase();

    const users = await User.find(filter)
      .select('name email role department year section createdAt')
      .sort('name');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};
