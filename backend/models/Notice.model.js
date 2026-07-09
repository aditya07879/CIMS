const mongoose = require('mongoose');

/**
 * Notice model
 *
 * Creator roles and their constraints:
 *   mentor  — can post to their assigned classrooms only; no visibility field
 *             (student-only by convention, mentors always see their own notices)
 *   hod     — can post to their dept+year; controls visibility and target sections
 *
 * Visibility (HOD only):
 *   'mentor'   — only mentors of the targeted classrooms can read
 *   'student'  — only students in the targeted classrooms can read
 *   'both'     — mentors + students in the targeted classrooms can read
 *
 * Attachment:
 *   stored on disk via multer; only the relative path is persisted
 */
const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 3000,
  },
  // Populated by the author's role
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creatorRole: {
    type: String,
    enum: ['mentor', 'hod'],
    required: true,
  },

  // ── Scope ─────────────────────────────────────────────────────────────────
  // Classrooms this notice applies to (resolved at creation time)
  targetClassrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true,
  }],
  // Denormalised dept+year so we can scope-check without joining classrooms
  department: { type: String, required: true, uppercase: true, trim: true },
  year:       { type: Number, required: true, min: 1, max: 4 },

  // ── Visibility (HOD notices only) ─────────────────────────────────────────
  // For mentor-created notices: always treated as 'student'
  visibility: {
    type: String,
    enum: ['mentor', 'student', 'both'],
    default: 'student',
  },

  // ── Attachment ────────────────────────────────────────────────────────────
  attachment: {
    filename:     { type: String },   // original file name shown to user
    storedName:   { type: String },   // multer-generated unique name on disk
    mimeType:     { type: String },
    size:         { type: Number },   // bytes
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

noticeSchema.index({ targetClassrooms: 1, createdAt: -1 });
noticeSchema.index({ department: 1, year: 1, createdAt: -1 });
noticeSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
