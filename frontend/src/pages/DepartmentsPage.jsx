import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Spinner, Alert } from '../components/common/index.jsx';
import { departmentAPI } from '../api/services';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', fullName: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const { data } = await departmentAPI.getAll();
      setDepartments(data.data);
    } catch {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.fullName.trim()) return;
    try {
      setSubmitting(true);
      setError('');
      await departmentAPI.create(form);
      setSuccess('Department created successfully');
      setForm({ name: '', fullName: '' });
      setShowForm(false);
      fetchDepts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this department?')) return;
    try {
      await departmentAPI.delete(id);
      setSuccess('Department deactivated');
      fetchDepts();
    } catch {
      setError('Failed to deactivate department');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Departments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage academic departments</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Department'}
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Create Form */}
        {showForm && (
          <div className="bg-surface-card border border-surface-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-200 mb-4">Create New Department</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Short Code *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CSE, AIML"
                    className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Full Name *</label>
                  <input
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full bg-surface-hover border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {submitting && <Spinner size="sm" />}
                  Create Department
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : departments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No departments yet. Create one above.</div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {departments.map(dept => (
                  <tr key={dept._id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/15 text-brand-400 border border-brand-500/20">
                        {dept.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{dept.fullName}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeactivate(dept._id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Deactivate
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

export default DepartmentsPage;