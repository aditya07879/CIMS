import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Spinner, Alert } from '../components/common/index.jsx';
import { mentorAPI, issueAPI, escalationAPI } from '../api/services';

const TABS = ['Overview', 'Sections', 'Students', 'Issues'];

const STATUS_COLORS = {
  Open:         'text-yellow-400 bg-yellow-500/10',
  'Under Review': 'text-blue-400 bg-blue-500/10',
  Resolved:     'text-green-400 bg-green-500/10',
  Rejected:     'text-red-400 bg-red-500/10',
};

const ESC_STATUS_COLORS = {
  Forwarded:    'text-purple-400 bg-purple-500/10',
  Acknowledged: 'text-blue-400 bg-blue-500/10',
  Resolved:     'text-green-400 bg-green-500/10',
};

const MentorPanelPage = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dashboard, setDashboard] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [sectionFilter, setSectionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Issues tab
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [issueSection, setIssueSection] = useState('');
  const [forwardingId, setForwardingId] = useState(null);
  const [forwardNote, setForwardNote] = useState('');
  const [showNoteFor, setShowNoteFor] = useState(null);
  const [forwardSuccess, setForwardSuccess] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dashRes, clsRes] = await Promise.all([
        mentorAPI.getDashboard(),
        mentorAPI.getClassrooms(),
      ]);
      setDashboard(dashRes.data.data);
      setClassrooms(clsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load mentor panel');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = sectionFilter ? { section: sectionFilter } : {};
      const { data } = await mentorAPI.getStudents(params);
      setStudents(data.data);
    } catch {
      setError('Failed to load students');
    }
  };

  const fetchIssues = async () => {
    try {
      setIssuesLoading(true);
      const params = {};
      if (issueSection) params.classroomId = issueSection;
      const [issuesRes, escRes] = await Promise.all([
        issueAPI.getAll(params),
        escalationAPI.getMentorEscalations(),
      ]);
      setIssues(issuesRes.data.data);
      setEscalations(escRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues');
    } finally {
      setIssuesLoading(false);
    }
  };

  const handleForward = async (issueId) => {
    try {
      setForwardingId(issueId);
      setError('');
      await escalationAPI.forwardIssue(issueId, forwardNote.trim() || undefined);
      setForwardSuccess('Issue forwarded to HOD successfully');
      setShowNoteFor(null);
      setForwardNote('');
      fetchIssues();
      setTimeout(() => setForwardSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to forward issue');
    } finally {
      setForwardingId(null);
    }
  };

  const isForwarded = (issueId) =>
    escalations.some(e => String(e.issue?._id || e.issue) === String(issueId));

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === 'Students') fetchStudents(); }, [activeTab, sectionFilter]);
  useEffect(() => { if (activeTab === 'Issues') fetchIssues(); }, [activeTab, issueSection]);

  if (loading) return (
    <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>
  );

  const assignment = dashboard?.assignment;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Mentor Panel</h1>
          {assignment && (
            <p className="text-sm text-gray-500 mt-1">
              Assigned to <span className="text-emerald-400 font-semibold">{assignment.department}</span> — Year {assignment.year}
            </p>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {forwardSuccess && <Alert type="success" message={forwardSuccess} onClose={() => setForwardSuccess('')} />}

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

        {/* ── Overview ─────────────────────────────────────────── */}
        {activeTab === 'Overview' && dashboard && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'My Sections', value: dashboard.stats.totalSections },
                { label: 'Total Students', value: dashboard.stats.totalStudents },
              ].map(s => (
                <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-5">
                  <p className="text-3xl font-bold text-emerald-400">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">My Sections</h3>
              {dashboard.classrooms.length === 0 ? (
                <p className="text-sm text-gray-500">No sections assigned yet. Contact your HOD.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dashboard.classrooms.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                      <div>
                        <span className="text-sm font-semibold text-gray-200">
                          {c.department}-{c.year}{c.section}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.studentCount ?? 0} students
                          {(c.openIssueCount ?? 0) > 0 && (
                            <span className="ml-2 text-yellow-400">· {c.openIssueCount} open issue{c.openIssueCount !== 1 ? 's' : ''}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Sections ─────────────────────────────────────────── */}
        {activeTab === 'Sections' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-200">My Assigned Sections</h2>
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              {classrooms.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No sections assigned. Contact your HOD.</div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {classrooms.map(c => (
                      <tr key={c._id} className="hover:bg-surface-hover/50">
                        <td className="px-6 py-4 font-semibold text-gray-200">
                          Section {c.section}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            {c.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">Year {c.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
              )}
            </div>
          </div>
        )}

        {/* ── Students ─────────────────────────────────────────── */}
        {activeTab === 'Students' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-200">Students</h2>
              {classrooms.length > 0 && (
                <select
                  value={sectionFilter}
                  onChange={e => setSectionFilter(e.target.value)}
                  className="bg-surface-hover border border-surface-border rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Sections</option>
                  {classrooms.map(c => (
                    <option key={c._id} value={c.section}>Section {c.section}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              {students.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No students found.</div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
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
            </div>
              )}
            </div>
          </div>
        )}

        {/* ── Issues ───────────────────────────────────────────── */}
        {activeTab === 'Issues' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-200">Section Issues</h2>
              {classrooms.length > 0 && (
                <select
                  value={issueSection}
                  onChange={e => setIssueSection(e.target.value)}
                  className="bg-surface-hover border border-surface-border rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Sections</option>
                  {classrooms.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.department}-{c.year}{c.section}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {issuesLoading ? (
              <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-surface-card border border-surface-border rounded-xl">
                No issues found in your assigned sections.
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map(issue => {
                  const forwarded = isForwarded(issue._id);
                  const showNote  = showNoteFor === issue._id;
                  return (
                    <div key={issue._id} className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-200 truncate">{issue.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[issue.status] || 'text-gray-400 bg-surface-hover'}`}>
                              {issue.status}
                            </span>
                            <span className="text-xs text-gray-500 bg-surface-hover px-2 py-0.5 rounded-full">
                              {issue.category}
                            </span>
                            {forwarded && (
                              <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-medium">
                                ↑ Forwarded to HOD
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {issue.classroom?.department}-{issue.classroom?.year}{issue.classroom?.section}
                            {' · '}
                            {issue.isAnonymous ? 'Anonymous' : (issue.author?.name || 'Unknown')}
                            {' · '}
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{issue.description}</p>
                        </div>

                        {!forwarded && (
                          <button
                            onClick={() => setShowNoteFor(showNote ? null : issue._id)}
                            className="shrink-0 text-xs px-3 py-1.5 border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          >
                            Forward to HOD
                          </button>
                        )}
                      </div>

                      {/* Forward note inline */}
                      {showNote && !forwarded && (
                        <div className="border-t border-surface-border pt-3 space-y-2">
                          <p className="text-xs text-gray-400">
                            Add an optional note for the HOD before forwarding:
                          </p>
                          <textarea
                            value={forwardNote}
                            onChange={e => setForwardNote(e.target.value)}
                            placeholder="e.g. Student reported this multiple times; needs attention."
                            maxLength={500}
                            rows={2}
                            className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setShowNoteFor(null); setForwardNote(''); }}
                              className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleForward(issue._id)}
                              disabled={forwardingId === issue._id}
                              className="text-xs px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {forwardingId === issue._id && <Spinner size="sm" />}
                              Confirm Forward
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Forwarded issues summary */}
            {escalations.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 border-t border-surface-border pt-4">
                  Forwarded to HOD ({escalations.length})
                </h3>
                {escalations.map(esc => (
                  <div key={esc._id} className="bg-surface-hover border border-surface-border rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300 font-medium">{esc.snapshot.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Forwarded {new Date(esc.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESC_STATUS_COLORS[esc.status] || 'text-gray-400 bg-surface-hover'}`}>
                      {esc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MentorPanelPage;