import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Spinner, Alert } from '../components/common/index.jsx';
import { hodAdminAPI, departmentAPI } from '../api/services';
import api from '../api/axios'; // still needed for /auth/users user-picker

// SECURITY: Admin is the only role that can create HOD accounts.
// HOD accounts require a Department and Year at creation time.

const HODManagementPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Two modes: 'create' (new user) or 'assign' (promote existing user)
  const [formMode, setFormMode] = useState(null); // null | 'create' | 'assign'

  // Create new HOD account form
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', department: '', year: '' });

  // Assign existing user as HOD form
  const [assignForm, setAssignForm] = useState({ userId: '', department: '', year: '' });
  const [userSearch, setUserSearch] = useState('');

  const years = [1, 2, 3, 4];

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [assignRes, deptRes] = await Promise.all([
        hodAdminAPI.getAssignments(),
        departmentAPI.getAll(),
      ]);
      setAssignments(assignRes.data.data);
      setDepartments(deptRes.data.data);

      // Load user list for the assign-existing flow
      try {
        const userRes = await api.get('/auth/users');
        setUsers(userRes.data.data || []);
      } catch {
        setUsers([]);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.department || !createForm.year) {
      setError('All fields are required to create an HOD account.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await hodAdminAPI.createHOD(createForm);
      setSuccess('HOD account created and assigned successfully');
      setCreateForm({ name: '', email: '', password: '', department: '', year: '' });
      setFormMode(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create HOD');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.userId) {
      setError('Please select a user.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await hodAdminAPI.assignHOD(assignForm);
      setSuccess('User promoted to HOD and assigned successfully');
      setAssignForm({ userId: '', department: '', year: '' });
      setUserSearch('');
      setFormMode(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign HOD');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this HOD assignment?')) return;
    try {
      setError('');
      await hodAdminAPI.revokeHOD(id);
      setSuccess('HOD assignment revoked');
      fetchAll();
    } catch {
      setError('Failed to revoke assignment');
    }
  };

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const inputCls = 'w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500';
  const selectCls = 'w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">HOD Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create or assign Heads of Department for specific dept + year combinations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFormMode(formMode === 'create' ? null : 'create')}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {formMode === 'create' ? 'Cancel' : '+ Create HOD'}
            </button>
            <button
              onClick={() => setFormMode(formMode === 'assign' ? null : 'assign')}
              className="px-4 py-2 border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 rounded-lg text-sm font-medium transition-colors"
            >
              {formMode === 'assign' ? 'Cancel' : 'Assign Existing User'}
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* ── Create new HOD account ─────────────────────────────────── */}
        {formMode === 'create' && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-200 mb-1">Create HOD Account</h2>
            <p className="text-xs text-gray-500 mb-4">
              Creates a new user with the HOD role and assigns them to the selected Department + Year.
            </p>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input
                  className={inputCls}
                  placeholder="Dr. Priya Sharma"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="hod@college.edu"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Password *</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Department *</label>
                  <select
                    className={selectCls}
                    value={createForm.department}
                    onChange={e => setCreateForm(f => ({ ...f, department: e.target.value }))}
                    required
                  >
                    <option value="">Select dept</option>
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name} – {d.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year *</label>
                  <select
                    className={selectCls}
                    value={createForm.year}
                    onChange={e => setCreateForm(f => ({ ...f, year: e.target.value }))}
                    required
                  >
                    <option value="">Select year</option>
                    {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {submitting && <Spinner size="sm" />}
                  Create HOD Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Assign existing user as HOD ────────────────────────────── */}
        {formMode === 'assign' && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-200 mb-1">Assign Existing User as HOD</h2>
            <p className="text-xs text-gray-500 mb-4">
              Promotes an existing user to the HOD role and assigns them a Department + Year.
            </p>
            <form onSubmit={handleAssign} className="space-y-4">
              {/* User picker */}
              {users.length > 0 ? (
                <div>
                  <label className={labelCls}>Select User *</label>
                  <input
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setAssignForm(f => ({ ...f, userId: '' })); }}
                    placeholder="Search by name or email…"
                    className={`${inputCls} mb-2`}
                  />
                  {userSearch && (
                    <div className="max-h-48 overflow-y-auto border border-surface-border rounded-lg bg-surface-hover divide-y divide-surface-border">
                      {filteredUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 px-3 py-2">No users found</p>
                      ) : filteredUsers.slice(0, 8).map(u => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => { setAssignForm(f => ({ ...f, userId: u._id })); setUserSearch(`${u.name} (${u.email})`); }}
                          className={`w-full text-left px-3 py-2.5 hover:bg-surface-card transition-colors ${assignForm.userId === u._id ? 'bg-brand-500/10' : ''}`}
                        >
                          <p className="text-sm text-gray-200">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {assignForm.userId && (
                    <p className="text-xs text-brand-400 mt-1">✓ User selected</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">The user will be promoted to the HOD role.</p>
                </div>
              ) : (
                <div>
                  <label className={labelCls}>User ID *</label>
                  <input
                    value={assignForm.userId}
                    onChange={e => setAssignForm(f => ({ ...f, userId: e.target.value }))}
                    placeholder="Paste User MongoDB ObjectId"
                    className={`${inputCls} font-mono`}
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">The user will be promoted to the HOD role.</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Department *</label>
                  <select
                    className={selectCls}
                    value={assignForm.department}
                    onChange={e => setAssignForm(f => ({ ...f, department: e.target.value }))}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name} – {d.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year *</label>
                  <select
                    className={selectCls}
                    value={assignForm.year}
                    onChange={e => setAssignForm(f => ({ ...f, year: e.target.value }))}
                    required
                  >
                    <option value="">Select year</option>
                    {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !assignForm.userId}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {submitting && <Spinner size="sm" />}
                  Assign as HOD
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assignments Table */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-gray-200">Active HOD Assignments</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No HOD assignments yet.</div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">HOD</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned On</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assignments.map(a => (
                  <tr key={a._id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-200 font-medium">{a.hod?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{a.hod?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/15 text-brand-400 border border-brand-500/20">
                        {a.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">Year {a.year}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(a._id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HODManagementPage;