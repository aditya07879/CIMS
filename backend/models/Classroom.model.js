const mongoose = require('mongoose');

// Extended list; original entries preserved for backward compatibility
const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'BCA', 'MCA', 'AIML', 'DS', 'CIVIL', 'MECH'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const classroomSchema = new mongoose.Schema({
  department: { type: String, required: true, uppercase: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  section: { type: String, required: true, enum: SECTIONS, uppercase: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

classroomSchema.index({ department: 1, year: 1, section: 1 }, { unique: true });

classroomSchema.virtual('label').get(function () {
  return `${this.department}-${this.year}${this.section}`;
});

module.exports = mongoose.model('Classroom', classroomSchema);
module.exports.DEPARTMENTS = DEPARTMENTS;
module.exports.SECTIONS = SECTIONS;
