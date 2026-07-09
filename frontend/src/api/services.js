import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

// Classrooms
export const classroomAPI = {
  getAll: (params) => api.get('/classrooms', { params }),
  getMy: () => api.get('/classrooms/my'),
  getById: (id) => api.get(`/classrooms/${id}`),
  create: (data) => api.post('/classrooms', data),
  assignMentor: (id, mentorId) => api.patch(`/classrooms/${id}/mentor`, { mentorId }),
  delete: (id) => api.delete(`/classrooms/${id}`),
};

// Issues
export const issueAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getMy: () => api.get('/issues/my'),
  getStats: (params) => api.get('/issues/stats', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  updateStatus: (id, status) => api.patch(`/issues/${id}/status`, { status }),
  vote: (id, type) => api.post(`/issues/${id}/vote`, { type }),
  addComment: (id, content) => api.post(`/issues/${id}/comment`, { content }),
  delete: (id, reason) => api.delete(`/issues/${id}`, { data: { reason } }),
};

// Notifications
export const notifAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Departments
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.patch(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// HOD Management (Admin)
export const hodAdminAPI = {
  getAssignments: () => api.get('/hod/assignments'),
  // Create a brand-new HOD user account with dept+year assigned in one step
  createHOD: (data) => api.post('/hod/create', data),
  // Promote an existing user to HOD and assign dept+year
  assignHOD: (data) => api.post('/hod/assignments', data),
  revokeHOD: (id) => api.delete(`/hod/assignments/${id}`),
};

// HOD Dashboard (HOD role)
export const hodAPI = {
  getDashboard: () => api.get('/hod/dashboard'),
  getClassrooms: () => api.get('/hod/classrooms'),
  createClassroom: (data) => api.post('/hod/classrooms', data),
  getMentors: () => api.get('/hod/mentors'),
  createMentor: (data) => api.post('/hod/mentors', data),
  updateMentor: (mentorId, data) => api.patch(`/hod/mentors/${mentorId}`, data),
  deactivateMentor: (mentorId) => api.delete(`/hod/mentors/${mentorId}`),
  assignSections: (data) => api.post('/hod/mentors/assign-sections', data),
  getStudents: (params) => api.get('/hod/students', { params }),
};

// Mentor Panel (Mentor role)
export const mentorAPI = {
  getDashboard: () => api.get('/mentor/dashboard'),
  getClassrooms: () => api.get('/mentor/classrooms'),
  getStudents: (params) => api.get('/mentor/students', { params }),
};

// Issue Escalation
export const escalationAPI = {
  forwardIssue: (issueId, note) => api.post(`/escalation/issues/${issueId}/forward`, { note }),
  getMentorEscalations: () => api.get('/escalation/mentor/escalations'),
  getHODEscalations: (params) => api.get('/escalation/hod/escalations', { params }),
  updateEscalationStatus: (escalationId, status) =>
    api.patch(`/escalation/hod/escalations/${escalationId}/status`, { status }),
  getEscalationForIssue: (issueId) => api.get(`/escalation/issues/${issueId}/escalation`),
};

// Notices
export const noticeAPI = {
  getAll:             (params) => api.get('/notices', { params }),
  getById:            (id) => api.get(`/notices/${id}`),
  mentorCreate:       (formData) => api.post('/notices/mentor', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  hodCreate:          (formData) => api.post('/notices/hod', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:             (id) => api.delete(`/notices/${id}`),
  getAttachmentUrl:   (id) => `/api/notices/${id}/attachment`,
};
