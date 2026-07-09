const mongoose = require('mongoose');

/**
 * MentorAssignment: one record per mentor, storing all classroom
 * sections they are responsible for within a single dept+year.
 * A mentor can have AT MOST ONE active assignment record.
 */
const mentorAssignmentSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one assignment record per mentor
  },
  department: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  // Array of Classroom _ids the mentor manages
  classrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  }],
  isActive: { type: Boolean, default: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

mentorAssignmentSchema.index({ department: 1, year: 1 });

module.exports = mongoose.model('MentorAssignment', mentorAssignmentSchema);
