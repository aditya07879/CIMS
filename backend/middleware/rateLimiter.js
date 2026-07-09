const rateLimit = require('express-rate-limit');
const Issue = require('../models/Issue.model');

// Strict limiter for auth endpoints (register / login)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 attempts per window per IP
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// General API limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom daily issue creation limit per student
exports.issueDailyLimit = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return next();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await Issue.countDocuments({
      author: req.user._id,
      createdAt: { $gte: startOfDay },
      isDeleted: false,
    });

    const DAILY_LIMIT = 3;
    if (count >= DAILY_LIMIT) {
      return res.status(429).json({
        success: false,
        message: `You can only raise ${DAILY_LIMIT} issues per day. Try again tomorrow.`,
      });
    }

    next();
  } catch (err) { next(err); }
};
