import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { issueAPI } from '../api/services.js';
import { Layout } from '../components/common/Layout.jsx';
import { Alert, Spinner, Select, PageHeader } from '../components/common/index.jsx';
import { CATEGORIES } from '../utils/helpers.js';

const CreateIssuePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: CATEGORIES[0],
    isAnonymous: false, tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const { data } = await issueAPI.create(payload);
      navigate(`/issues/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Raise New Issue"
        subtitle="Submit an issue to your classroom mentor"
        action={<Link to="/issues" className="btn-secondary text-sm">← Back</Link>}
      />

      <div className="max-w-2xl w-full">
        <div className="card p-6">
          <Alert message={error} />
          <form onSubmit={submit} className="space-y-5 mt-1">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Issue Title *</label>
              <input
                className="input"
                placeholder="Briefly describe the issue..."
                value={form.title}
                onChange={handle('title')}
                required maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
              <textarea
                className="input resize-none"
                rows={5}
                placeholder="Provide as much detail as possible..."
                value={form.description}
                onChange={handle('description')}
                required maxLength={2000}
              />
              <p className="text-xs text-gray-600 mt-1">{form.description.length}/2000</p>
            </div>

            <Select
              label="Category *"
              value={form.category}
              onChange={(v) => setForm(f => ({ ...f, category: v }))}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tags (comma-separated)</label>
              <input
                className="input"
                placeholder="wifi, lab, attendance..."
                value={form.tags}
                onChange={handle('tags')}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.isAnonymous}
                  onChange={handle('isAnonymous')}
                />
                <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${form.isAnonymous ? 'bg-brand-500' : 'bg-surface-border'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.isAnonymous ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">Post anonymously</p>
                <p className="text-xs text-gray-500">Your name will be hidden from other students</p>
              </div>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/issues" className="btn-secondary flex-1 text-center">Cancel</Link>
              <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Submitting...</> : 'Submit Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateIssuePage;