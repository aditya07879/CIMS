# College Issue Management System

Full-stack MERN application with JWT role-based auth.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express (strict MVC)
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + Role-based (Student, Mentor, Admin)

---

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env        # Fill in MONGO_URI & JWT_SECRET
npm install
npm run dev                 # Runs on :5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # Runs on :5173, proxies /api → :5000
```

---

## Backend Structure
```
backend/
├── server.js               # Entry point
├── app.js                  # Express app, routes, middleware
├── config/
│   └── db.js               # MongoDB connection
├── models/
│   ├── User.model.js        # Student / Mentor / Admin
│   ├── Classroom.model.js   # dept + year + section (unique)
│   ├── Issue.model.js       # Issues with embedded comments
│   └── Notification.model.js
├── controllers/
│   ├── auth.controller.js
│   ├── classroom.controller.js
│   ├── issue.controller.js
│   └── notification.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── classroom.routes.js
│   ├── issue.routes.js
│   └── notification.routes.js
└── middleware/
    ├── auth.middleware.js   # JWT protect + authorize(roles)
    ├── rateLimiter.js       # API limiter + 3 issues/day per student
    └── errorHandler.js      # Centralized error handling
```

## Frontend Structure
```
frontend/src/
├── api/
│   ├── axios.js            # Axios instance + interceptors
│   └── services.js         # API service functions
├── context/
│   └── AuthContext.jsx     # Global auth state
├── hooks/
│   └── useAsync.js
├── utils/
│   └── helpers.js          # formatDate, statusClass, etc.
├── components/
│   └── common/
│       ├── index.jsx        # Spinner, Alert, Modal, StatCard, etc.
│       ├── Layout.jsx       # Sidebar + Layout wrapper
│       └── ProtectedRoute.jsx
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── DashboardPage.jsx
    ├── IssuesPage.jsx       # List + filters + pagination
    ├── CreateIssuePage.jsx
    ├── IssueDetailPage.jsx  # Voting, comments, status
    ├── ClassroomPage.jsx    # Role-aware view
    └── NotificationsPage.jsx
```

---

## API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Protected |
| PATCH | /api/auth/me | Protected |

### Issues
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/issues | All roles |
| POST | /api/issues | Student/Mentor/Admin |
| GET | /api/issues/:id | All roles |
| PATCH | /api/issues/:id/status | Mentor/Admin |
| POST | /api/issues/:id/vote | Student/Mentor |
| POST | /api/issues/:id/comment | Mentor/Admin |
| DELETE | /api/issues/:id | Mentor/Admin (soft) |

### Classrooms
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/classrooms | Protected |
| GET | /api/classrooms/my | Protected |
| POST | /api/classrooms | Admin |
| PATCH | /api/classrooms/:id/mentor | Admin |

---

## Key Rules Implemented
- **Anonymous issues**: author hidden from students, visible to mentor/admin
- **Rate limiting**: Students max 3 issues/day
- **Soft delete**: Issues flagged with reason + timestamp, not removed from DB
- **Role routing**: Dashboards, nav, and routes differ by role
- **JWT**: Token stored in localStorage, auto-attached via Axios interceptor
- **Classroom validation**: dept + year + section must match an existing classroom on register
