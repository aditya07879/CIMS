const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Roll number format: alphanumeric, 4-20 chars (e.g., 2021CSE001)
const ROLL_NUMBER_REGEX = /^[A-Za-z0-9]{4,20}$/;
// Basic institutional email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [EMAIL_REGEX, 'Please provide a valid email address'],
  },
  password: { type: String, required: true, minlength: 6, select: false },
  // 'student' is the only self-registerable role. 'mentor', 'hod', 'admin' must be assigned by admin/HOD.
  role: { type: String, enum: ['student', 'mentor', 'hod', 'admin'], default: 'student' },
  rollNumber: {
    type: String, trim: true, uppercase: true,
    match: [ROLL_NUMBER_REGEX, 'Roll number must be 4-20 alphanumeric characters'],
  },
  department: { type: String, trim: true, uppercase: true },
  year: { type: Number, min: 1, max: 4 },
  section: { type: String, uppercase: true, trim: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  isActive: { type: Boolean, default: true },
  // Token invalidation: tokens issued before this timestamp are rejected
  tokenIssuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound unique index: one roll number per department (prevent duplicate fake students)
userSchema.index(
  { rollNumber: 1, department: 1 },
  { unique: true, sparse: true, partialFilterExpression: { role: 'student', rollNumber: { $exists: true, $ne: null, $ne: '' } } }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokenIssuedAt;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
