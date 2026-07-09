const mongoose = require('mongoose');

// A single HOD assignment: one user → one department + year combination
const hodAssignmentSchema = new mongoose.Schema({
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  isActive: { type: Boolean, default: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// A HOD can only be assigned once per dept+year
hodAssignmentSchema.index({ department: 1, year: 1 }, { unique: true, sparse: false });

module.exports = mongoose.model('HODAssignment', hodAssignmentSchema);
