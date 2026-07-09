const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile, getAllUsers } = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Public routes — tighter rate limiting on auth endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);

// Admin only: list users (used by HOD Management page user picker)
router.get('/users', protect, authorize('admin'), apiLimiter, getAllUsers);

module.exports = router;
