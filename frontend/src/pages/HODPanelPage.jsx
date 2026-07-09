import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Spinner, Alert } from '../components/common/index.jsx';
import { hodAPI, escalationAPI } from '../api/services';

const TABS = ['Overview', 'Sections', 'Mentors', 'Students', 'Escalations'];

const HODPanelPage = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dashboard, setDashboard] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Escalations
  const [escalations, setEscalations] = useState([]);
  const [escLoading, setEscLoading] = useState(false);
  const [escStatusFilter, setEscStatusFilter] = useState('');
  const [updatingEscId, setUpdatingEscId] = useState(null);

  // Forms
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionForm, setSectionForm] = useState({ section: '', mentorId: '' });
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorForm, setMentorForm] = useState({ name: '', email: '', password: '' });
  const [assignForm, setAssignForm] = useState({ mentorId: '', sectionIds: [] });
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      const { data } = await hodAPI.getDashboard();
      setDashboard(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dashRes, clsRes, mentRes] = await Promise.all([
        hodAPI.getDashboard(),
        hodAPI.getClassrooms(),
        hodAPI.getMentors(),
      ]);
      setDashboard(dashRes.data.data);
      setClassrooms(clsRes.data.data);
      setMentors(mentRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HOD panel');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await hodAPI.getStudents();
      setStudents(data.data);
    } catch {
      setError('Failed to load students');
    }
  };

  const fetchEscalations = async () => {
    try {
      setEscLoading(true);
      const params = escStatusFilter ? { status: escStatusFilter } : {};
      const { data } = await escalationAPI.getHODEscalations(params);
      setEscalations(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load escalations');
    } finally {
      setEscLoading(false);
    }
  };

  const handleUpdateEscStatus = async (escalationId, status) => {
    try {
      setUpdatingEscId(escalationId);
      setError('');
      await escalationAPI.updateEscalationStatus(escalationId, status);
      setSuccess(`Escalation marked as "${status}"`);
      fetchEscalations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingEscId(null);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === 'Students') fetchStudents(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'Escalations') fetchEscalations(); }, [activeTab, escStatusFilter]);

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await hodAPI.createClassroom(sectionForm);
      setSuccess('Section created');
      setSectionForm({ section: '', mentorId: '' });
      setShowSectionForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await hodAPI.createMentor(mentorForm);
      setSuccess('Mentor created');
      setMentorForm({ name: '', email: '', password: '' });
      setShowMentorForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create mentor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateMentor = async (mentorId) => {
    if (!confirm('Deactivate this mentor? They will lose access.')) return;
    try {
      setError('');
      await hodAPI.deactivateMentor(mentorId);
      setSuccess('Mentor deactivated');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate mentor');
    }
  };

  const handleAssignSections = async (e) => {
    e.preventDefault();
    if (!assignForm.mentorId || assignForm.sectionIds.length === 0) {
      setError('Select a mentor and at least one section');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await hodAPI.assignSections(assignForm);
      setSuccess('Sections assigned to mentor');
      setAssignForm({ mentorId: '', sectionIds: [] });
      setShowAssignForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign sections');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSection = (id) => {
    setAssignForm(f => ({
      ...f,
      sectionIds: f.sectionIds.includes(id)
        ? f.sectionIds.filter(s => s !== id)
        : [...f.sectionIds, id],
    }));
  };

  if (loading) return (
    <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>
  );

  const assignment = dashboard?.assignment;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-100">HOD Panel</h1>
          {assignment && (
            <p className="text-sm text-gray-500 mt-1">
              Managing <span className="text-brand-400 font-semibold">{assignment.department}</span> — Year {assignment.year}
            </p>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-hover p-1 rounded-lg w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeTab === tab
                  ? 'bg-surface-card text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────────────────── */}
        {activeTab === 'Overview' && dashboard && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Sections', value: dashboard.stats.totalSections },
                { label: 'Total Mentors', value: dashboard.stats.totalMentors },
                { label: 'Sections Assigned', value: dashboard.stats.sectionsWithMentor },
              ].map(s => (
                <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-5">
                  <p className="text-3xl font-bold text-brand-400">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Sections at a Glance</h3>
              {dashboard.classrooms.length === 0 ? (
                <p className="text-sm text-gray-500">No sections created yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {dashboard.classrooms.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                      <div>
                        <span className="text-sm font-semibold text-gray-200">
                          {c.department}-{c.year}{c.section}
                        </span>
                        {c.mentor && (
                          <p className="text-xs text-gray-500 mt-0.5">Mentor: {c.mentor.name}</p>
                        )}
                      </div>
                      {!c.mentor && (
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Unassigned</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Sections ─────────────────────────────────────────────── */}
        {activeTab === 'Sections' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-200">Classroom Sections</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignForm(!showAssignForm)}
                  className="px-4 py-2 border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 rounded-lg text-sm font-medium transition-colors"
                >
                  Assign Mentor to Sections
                </button>
                <button
                  onClick={() => setShowSectionForm(!showSectionForm)}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {showSectionForm ? 'Cancel' : '+ New Section'}
                </button>
              </div>
            </div>

            {showSectionForm && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Create Section</h3>
                <form onSubmit={handleCreateSection} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Section Letter *</label>
                    <select
                      value={sectionForm.section}
                      onChange={e => setSectionForm(f => ({ ...f, section: e.target.value }))}
                      className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
                      required
                    >
                      <option value="">Select</option>
                      {['A','B','C','D','E'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Assign Mentor (optional)</label>
                    <select
                      value={sectionForm.mentorId}
                      onChange={e => setSectionForm(f => ({ ...f, mentorId: e.target.value }))}
                      className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">None</option>
                      {mentors.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button type="submit" disabled={submitting}
                      className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                      {submitting && <Spinner size="sm" />} Create Section
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showAssignForm && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Assign Sections to Mentor</h3>
                <form onSubmit={handleAssignSections} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Mentor *</label>
                    <select
                      value={assignForm.mentorId}
                      onChange={e => setAssignForm(f => ({ ...f, mentorId: e.target.value }))}
                      className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
                      required
                    >
                      <option value="">Select mentor</option>
                      {mentors.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Sections to assign (select multiple) *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {classrooms.map(c => (
                        <label key={c._id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                          ${assignForm.sectionIds.includes(c._id)
                            ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                            : 'border-surface-border bg-surface-hover text-gray-400 hover:border-gray-500'}`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={assignForm.sectionIds.includes(c._id)}
                            onChange={() => toggleSection(c._id)}
                          />
                          <span className="text-sm font-medium">Section {c.section}</span>
                          {c.mentor && <span className="text-xs opacity-60">({c.mentor.name})</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={submitting}
                      className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                      {submitting && <Spinner size="sm" />} Assign Sections
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              {classrooms.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No sections yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {classrooms.map(c => (
                      <tr key={c._id} className="hover:bg-surface-hover/50">
                        <td className="px-6 py-4 font-semibold text-gray-200">
                          {c.department}-{c.year}{c.section}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {c.mentor ? (
                            <div>
                              <p>{c.mentor.name}</p>
                              <p className="text-xs text-gray-500">{c.mentor.email}</p>
                            </div>
                          ) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {c.mentor
                            ? <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Assigned</span>
                            : <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Unassigned</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Mentors ──────────────────────────────────────────────── */}
        {activeTab === 'Mentors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-200">Mentors</h2>
              <button
                onClick={() => setShowMentorForm(!showMentorForm)}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {showMentorForm ? 'Cancel' : '+ New Mentor'}
              </button>
            </div>

            {showMentorForm && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Create Mentor Account</h3>
                <form onSubmit={handleCreateMentor} className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                    <input value={mentorForm.name} onChange={e => setMentorForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Full name" required
                      className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email *</label>
                    <input type="email" value={mentorForm.email} onChange={e => setMentorForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="mentor@college.edu" required
                      className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Password *</label>
                    <input type="password" value={mentorForm.password} onChange={e => setMentorForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 characters" required minLength={6}
                      className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500" />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button type="submit" disabled={submitting}
                      className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                      {submitting && <Spinner size="sm" />} Create Mentor
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              {mentors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No mentors yet. Create one above.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Sections</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {mentors.map(m => {
                      const sections = classrooms.filter(c => c.mentor?._id === m._id || c.mentor === m._id);
                      return (
                        <tr key={m._id} className="hover:bg-surface-hover/50">
                          <td className="px-6 py-4 text-gray-200 font-medium">{m.name}</td>
                          <td className="px-6 py-4 text-gray-400">{m.email}</td>
                          <td className="px-6 py-4">
                            {sections.length === 0
                              ? <span className="text-gray-600 text-xs">None</span>
                              : <div className="flex gap-1 flex-wrap">
                                {sections.map(s => (
                                  <span key={s._id} className="text-xs bg-brand-500/15 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
                                    {s.section}
                                  </span>
                                ))}
                              </div>
                            }
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeactivateMentor(m._id)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Students ─────────────────────────────────────────────── */}
        {activeTab === 'Students' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-200">Students</h2>
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No students found in your dept/year.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {students.map(s => (
                      <tr key={s._id} className="hover:bg-surface-hover/50">
                        <td className="px-6 py-4 text-gray-200">{s.name}</td>
                        <td className="px-6 py-4 text-gray-400">{s.email}</td>
                        <td className="px-6 py-4 text-gray-400">{s.rollNumber || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-surface-hover border border-surface-border px-2 py-0.5 rounded-full text-gray-300">
                            {s.classroom?.section || s.section || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Escalations ──────────────────────────────────────────── */}
        {activeTab === 'Escalations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-200">Forwarded Issues</h2>
              <select
                value={escStatusFilter}
                onChange={e => setEscStatusFilter(e.target.value)}
                className="bg-surface-hover border border-surface-border rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="Forwarded">Forwarded</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {escLoading ? (
              <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : escalations.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-surface-card border border-surface-border rounded-xl">
                No escalated issues{escStatusFilter ? ` with status "${escStatusFilter}"` : ''}.
              </div>
            ) : (
              <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dept / Year / Section</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Status</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Forwarded</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {escalations.map(esc => (
                      <tr key={esc._id} className="hover:bg-surface-hover/50 align-top">
                        <td className="px-5 py-4 text-gray-200 font-medium whitespace-nowrap">
                          {esc.studentName}
                        </td>
                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                          {esc.studentDept} / Yr {esc.studentYear} / Sec {esc.studentSection}
                        </td>
                        <td className="px-5 py-4 text-gray-300 whitespace-nowrap">
                          {esc.mentorName}
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-gray-200 font-medium truncate">{esc.issueTitle}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{esc.issueDescription}</p>
                          <span className="inline-block mt-1 text-xs text-gray-500 bg-surface-hover px-2 py-0.5 rounded-full">
                            {esc.issueCategory}
                          </span>
                          {esc.note && (
                            <p className="text-xs text-yellow-400/80 mt-1 italic">
                              Mentor note: {esc.note}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${{ Open: 'text-yellow-400 bg-yellow-500/10', 'Under Review': 'text-blue-400 bg-blue-500/10',
                                Resolved: 'text-green-400 bg-green-500/10', Rejected: 'text-red-400 bg-red-500/10' }[esc.issueStatus]
                              || 'text-gray-400 bg-surface-hover'}`}>
                            {esc.issueStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(esc.forwardedAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${{ Forwarded: 'text-purple-400 bg-purple-500/10',
                                Acknowledged: 'text-blue-400 bg-blue-500/10',
                                Resolved: 'text-green-400 bg-green-500/10' }[esc.status]
                              || 'text-gray-400 bg-surface-hover'}`}>
                            {esc.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {esc.status !== 'Resolved' && (
                            <div className="flex justify-end gap-2">
                              {esc.status === 'Forwarded' && (
                                <button
                                  onClick={() => handleUpdateEscStatus(esc._id, 'Acknowledged')}
                                  disabled={updatingEscId === esc._id}
                                  className="text-xs px-2.5 py-1 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Acknowledge
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateEscStatus(esc._id, 'Resolved')}
                                disabled={updatingEscId === esc._id}
                                className="text-xs px-2.5 py-1 border border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {updatingEscId === esc._id ? <Spinner size="sm" /> : 'Resolve'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HODPanelPage;
