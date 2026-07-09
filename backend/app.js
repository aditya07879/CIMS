const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const classroomRoutes = require('./routes/classroom.routes');
const issueRoutes = require('./routes/issue.routes');
const notificationRoutes = require('./routes/notification.routes');
const departmentRoutes = require('./routes/department.routes');
const hodRoutes = require('./routes/hod.routes');
const mentorRoutes = require('./routes/mentor.routes');
const escalationRoutes = require('./routes/escalation.routes');
const noticeRoutes     = require('./routes/notice.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Restrict to the frontend origin. Set CLIENT_URL in .env.
// Never use '*' with credentials — it discloses tokens to any origin.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/escalation', escalationRoutes);
app.use('/api/notices',    noticeRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
