import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IssuesPage from './pages/IssuesPage';
import IssueDetailPage from './pages/IssueDetailPage';
import CreateIssuePage from './pages/CreateIssuePage';
import ClassroomPage from './pages/ClassroomPage';
import NotificationsPage from './pages/NotificationsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import HODManagementPage from './pages/HODManagementPage';
import HODPanelPage from './pages/HODPanelPage';
import MentorPanelPage from './pages/MentorPanelPage';
import NoticesPage from './pages/NoticesPage';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected – all roles */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/issues" element={<ProtectedRoute><IssuesPage /></ProtectedRoute>} />
        <Route path="/issues/new" element={<ProtectedRoute roles={['student', 'mentor', 'admin']}><CreateIssuePage /></ProtectedRoute>} />
        <Route path="/issues/:id" element={<ProtectedRoute><IssueDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute roles={['student', 'mentor', 'hod', 'admin']}><NoticesPage /></ProtectedRoute>} />

        {/* Student / Mentor classroom */}
        <Route path="/classroom" element={<ProtectedRoute roles={['student', 'mentor']}><ClassroomPage /></ProtectedRoute>} />

        {/* Mentor panel — scoped to assigned sections only */}
        <Route path="/mentor" element={<ProtectedRoute roles={['mentor']}><MentorPanelPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/classrooms" element={<ProtectedRoute roles={['admin']}><ClassroomPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute roles={['admin']}><DepartmentsPage /></ProtectedRoute>} />
        <Route path="/hod-management" element={<ProtectedRoute roles={['admin']}><HODManagementPage /></ProtectedRoute>} />

        {/* HOD */}
        <Route path="/hod" element={<ProtectedRoute roles={['hod', 'admin']}><HODPanelPage /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
