/**
 * seed.js — creates one test user per role
 * Run: node seed.js
 *
 * Login credentials after seeding:
 *  Admin   → aditya@m.com   / 000000
 *  HOD     → rishi@m.com    / 000000
 *  Mentor  → akansha@m.com  / 000000
 *  Student → ashutosh@m.com / 000000
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const User             = require('./models/User.model');
const Department       = require('./models/Department.model');
const Classroom        = require('./models/Classroom.model');
const HODAssignment    = require('./models/HODAssignment.model');
const MentorAssignment = require('./models/MentorAssignment.model');
const Issue            = require('./models/Issue.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n🔗 Connected to MongoDB\n');

  // ── Clean previous seed data ──────────────────────────────────────────────
  const EMAILS = ['aditya@m.com', 'rishi@m.com', 'akansha@m.com', 'ashutosh@m.com'];
  await User.deleteMany({ email: { $in: EMAILS } });
  await Department.deleteMany({ name: 'CSE' });
  await Classroom.deleteMany({ department: 'CSE', year: 1, section: 'A' });
  await HODAssignment.deleteMany({ department: 'CSE', year: 1 });
  console.log('🗑  Cleared previous seed data');

  // ── Department ────────────────────────────────────────────────────────────
  await Department.create({ name: 'CSE', fullName: 'Computer Science & Engineering' });

  // ── Admin ─────────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Aditya',
    email: 'aditya@m.com',
    password: '000000',
    role: 'admin',
  });

  // ── Classroom ─────────────────────────────────────────────────────────────
  const classroom = await Classroom.create({
    department: 'CSE',
    year: 1,
    section: 'A',
    createdBy: admin._id,
  });

  // ── HOD ───────────────────────────────────────────────────────────────────
  const hod = await User.create({
    name: 'Rishi',
    email: 'rishi@m.com',
    password: '000000',
    role: 'hod',
    department: 'CSE',
    year: 1,
  });

  await HODAssignment.create({
    hod: hod._id,
    department: 'CSE',
    year: 1,
    isActive: true,
    assignedBy: admin._id,
  });

  // ── Mentor ────────────────────────────────────────────────────────────────
  const mentor = await User.create({
    name: 'Akansha',
    email: 'akansha@m.com',
    password: '000000',
    role: 'mentor',
    department: 'CSE',
    year: 1,
  });

  await Classroom.findByIdAndUpdate(classroom._id, { mentor: mentor._id });

  await MentorAssignment.create({
    mentor: mentor._id,
    department: 'CSE',
    year: 1,
    classrooms: [classroom._id],
    isActive: true,
    assignedBy: admin._id,
  });

  // ── Student ───────────────────────────────────────────────────────────────
  const student = await User.create({
    name: 'Ashutosh',
    email: 'ashutosh@m.com',
    password: '000000',
    role: 'student',
    rollNumber: 'CSE2024001',
    department: 'CSE',
    year: 1,
    section: 'A',
    classroom: classroom._id,
  });

  await Classroom.findByIdAndUpdate(classroom._id, {
    $addToSet: { students: student._id },
  });

  // ── Sample issue raised by student ───────────────────────────────────────
  await Issue.create({
    title: 'Projector not working in Lab 3',
    description: 'The projector in Lab 3 has not been working for the past two weeks. It affects all practical sessions.',
    category: 'Infrastructure',
    author: student._id,
    classroom: classroom._id,
  });

  // ── Print summary ─────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete! Login with:\n');
  console.table([
    { Role: 'admin',   Email: 'aditya@m.com',   Password: '000000' },
    { Role: 'hod',     Email: 'rishi@m.com',     Password: '000000' },
    { Role: 'mentor',  Email: 'akansha@m.com',   Password: '000000' },
    { Role: 'student', Email: 'ashutosh@m.com',  Password: '000000' },
  ]);
  console.log('Classroom: CSE-Year 1-Section A');
  console.log('1 sample issue created under the student account.\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});