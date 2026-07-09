import { Paperclip, Eye, Megaphone } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { noticeAPI, mentorAPI, hodAPI } from '../api/services.js';
import { Layout } from '../components/common/Layout.jsx';
import {
  Spinner, Alert, EmptyState, PageHeader, Modal, Select,
} from '../components/common/index.jsx';
import { timeAgo, formatDate } from '../utils/helpers.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VISIBILITY_OPTIONS = [
  { value: 'student', label: 'Students only' },
  { value: 'mentor',  label: 'Mentors only'  },
  { value: 'both',    label: 'Both'          },
];

const visibilityBadge = (v) => {
  const map = {
    student: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    mentor:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    both:    'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  };
  const labels = { student: 'Students', mentor: 'Mentors', both: 'All' };
  return { cls: map[v] || map.both, label: labels[v] || v };
};

const roleBadge = (role) => {
  const map = {
    mentor: 'bg-emerald-500/15 text-emerald-400',
    hod:    'bg-amber-500/15 text-amber-400',
    admin:  'bg-brand-500/15 text-brand-400',
  };
  return map[role] || 'bg-gray-500/15 text-gray-400';
};

const fileSizeLabel = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const AttachmentLink = ({ notice }) => {
  if (!notice.attachment?.filename) return null;
  const token = localStorage.getItem('ims_token');
  const handleDownload = async () => {
    try {
      const res = await fetch(noticeAPI.getAttachmentUrl(notice._id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = notice.attachment.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download attachment. Please try again.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300
                 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg
                 transition-colors duration-150 mt-2"
    >
      <><Paperclip size={12} strokeWidth={2} /> {notice.attachment.filename}</> 
      {notice.attachment.size && (
        <span className="text-gray-500">({fileSizeLabel(notice.attachment.size)})</span>
      )}
    </button>
  );
};

// ── Notice card ───────────────────────────────────────────────────────────────
const NoticeCard = ({ notice, canDelete, onDelete, onExpand }) => {
  const vis = visibilityBadge(notice.visibility);
  const sections = notice.targetClassrooms?.map(c => c.section).join(', ') || '—';

  return (
    <div className="card p-5 fade-in hover:border-brand-500/20 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Visibility badge (HOD notices only) */}
            {notice.creatorRole === 'hod' && (
              <span className={`badge text-xs ${vis.cls}`}><Eye size={10} strokeWidth={2} style={{marginRight:"3px",display:"inline"}}/>{vis.label}</span>
            )}
            {/* Creator role */}
            <span className={`badge text-xs ${roleBadge(notice.creatorRole)}`}>
              {notice.creatorRole === 'hod' ? 'HOD' : 'Mentor'}
            </span>
            {/* Sections */}
            <span className="text-xs text-gray-500">
              {notice.department}-{notice.year} · Sec {sections}
            </span>
          </div>

          <h3
            className="font-medium text-gray-100 cursor-pointer hover:text-brand-400 transition-colors"
            onClick={() => onExpand(notice)}
          >
            {notice.title}
          </h3>

          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{notice.description}</p>

          <AttachmentLink notice={notice} />
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-500">{timeAgo(notice.createdAt)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{notice.createdBy?.name || '—'}</p>
          {canDelete && (
            <button
              onClick={() => onDelete(notice)}
              className="text-xs text-red-400/70 hover:text-red-400 mt-2 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Detail modal ──────────────────────────────────────────────────────────────
const NoticeDetailModal = ({ notice, onClose }) => {
  if (!notice) return null;
  const vis = visibilityBadge(notice.visibility);
  const sections = notice.targetClassrooms?.map(
    c => `${c.department}-${c.year}${c.section}`
  ).join(', ') || '—';

  return (
    <Modal isOpen={!!notice} onClose={onClose} title={notice.title}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          {notice.creatorRole === 'hod' && (
            <span className={`badge ${vis.cls}`}><Eye size={10} strokeWidth={2} style={{marginRight:"3px",display:"inline"}}/>{vis.label}</span>
          )}
          <span className={`badge ${roleBadge(notice.creatorRole)}`}>
            {notice.creatorRole === 'hod' ? 'HOD' : 'Mentor'}
          </span>
        </div>

        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{notice.description}</p>

        <AttachmentLink notice={notice} />

        <div className="border-t border-surface-border pt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div><span className="text-gray-600">Posted by:</span> {notice.createdBy?.name}</div>
          <div><span className="text-gray-600">Date:</span> {formatDate(notice.createdAt)}</div>
          <div className="col-span-2"><span className="text-gray-600">Sections:</span> {sections}</div>
        </div>
      </div>
    </Modal>
  );
};

// ── Create notice modal (Mentor) ──────────────────────────────────────────────
const MentorCreateModal = ({ isOpen, onClose, classrooms, onCreated }) => {
  const [form, setForm]       = useState({ title: '', description: '' });
  const [selected, setSelected] = useState([]);
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const fileRef               = useRef();

  // Default: all classrooms selected
  useEffect(() => {
    if (isOpen) setSelected(classrooms.map(c => c._id));
  }, [isOpen, classrooms]);

  const toggleClassroom = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected.length)
      return setErr('Select at least one section');
    setLoading(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('title',        form.title.trim());
      fd.append('description',  form.description.trim());
      fd.append('classroomIds', JSON.stringify(selected));
      if (file) fd.append('attachment', file);

      await noticeAPI.mentorCreate(fd);
      setForm({ title: '', description: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onCreated();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create notice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Notice">
      {err && <Alert message={err} />}
      <form onSubmit={handleSubmit} className="space-y-4 mt-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
          <input
            className="input" required maxLength={200}
            placeholder="Notice title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
          <textarea
            className="input resize-none" rows={4} required maxLength={3000}
            placeholder="Notice details..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <p className="text-xs text-gray-600 mt-1">{form.description.length}/3000</p>
        </div>

        {/* Section selector */}
        {classrooms.length > 1 && (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Target Sections *</label>
            <div className="flex flex-wrap gap-2">
              {classrooms.map(c => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => toggleClassroom(c._id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150
                    ${selected.includes(c._id)
                      ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                      : 'bg-surface border-surface-border text-gray-500 hover:border-brand-500/20'}`}
                >
                  {c.department}-{c.year}{c.section}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachment */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Attachment <span className="text-gray-600">(optional · PDF, Word, Excel, image · max 5 MB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            className="block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3
                       file:rounded-lg file:border file:border-surface-border
                       file:bg-surface-hover file:text-gray-300 file:text-xs
                       hover:file:border-brand-500/40 cursor-pointer"
            onChange={e => setFile(e.target.files[0] || null)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? <><Spinner size="sm" className="inline mr-2" />Posting...</> : 'Post Notice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Create notice modal (HOD) ─────────────────────────────────────────────────
const HODCreateModal = ({ isOpen, onClose, classrooms, onCreated }) => {
  const [form, setForm]   = useState({ title: '', description: '', visibility: 'both' });
  const [selected, setSelected] = useState([]);
  const [allSections, setAllSections] = useState(true);
  const [file, setFile]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');
  const fileRef           = useRef();

  useEffect(() => {
    if (isOpen) {
      setSelected(classrooms.map(c => c._id));
      setAllSections(true);
    }
  }, [isOpen, classrooms]);

  const toggleSection = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleAllToggle = () => {
    if (allSections) {
      setAllSections(false);
      setSelected([]);
    } else {
      setAllSections(true);
      setSelected(classrooms.map(c => c._id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targets = allSections ? [] : selected;   // empty → backend uses all classrooms
    setLoading(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('visibility',  form.visibility);
      if (!allSections && targets.length)
        fd.append('classroomIds', JSON.stringify(targets));
      if (file) fd.append('attachment', file);

      await noticeAPI.hodCreate(fd);
      setForm({ title: '', description: '', visibility: 'both' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onCreated();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create notice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Notice (HOD)">
      {err && <Alert message={err} />}
      <form onSubmit={handleSubmit} className="space-y-4 mt-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
          <input
            className="input" required maxLength={200}
            placeholder="Notice title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
          <textarea
            className="input resize-none" rows={4} required maxLength={3000}
            placeholder="Notice details..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <p className="text-xs text-gray-600 mt-1">{form.description.length}/3000</p>
        </div>

        {/* Visibility */}
        <Select
          label="Visible to *"
          value={form.visibility}
          onChange={v => setForm(f => ({ ...f, visibility: v }))}
          options={VISIBILITY_OPTIONS}
        />

        {/* Section targeting */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">Target Sections</label>
            <button
              type="button"
              onClick={handleAllToggle}
              className={`text-xs px-2 py-0.5 rounded border transition-all duration-150
                ${allSections
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'bg-surface border-surface-border text-gray-500'}`}
            >
              {allSections ? '✓ All sections' : 'All sections'}
            </button>
          </div>
          {!allSections && (
            <div className="flex flex-wrap gap-2">
              {classrooms.map(c => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => toggleSection(c._id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150
                    ${selected.includes(c._id)
                      ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                      : 'bg-surface border-surface-border text-gray-500 hover:border-brand-500/20'}`}
                >
                  Sec {c.section}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Attachment <span className="text-gray-600">(optional · PDF, Word, Excel, image · max 5 MB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            className="block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3
                       file:rounded-lg file:border file:border-surface-border
                       file:bg-surface-hover file:text-gray-300 file:text-xs
                       hover:file:border-brand-500/40 cursor-pointer"
            onChange={e => setFile(e.target.files[0] || null)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? <><Spinner size="sm" className="inline mr-2" />Posting...</> : 'Post Notice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const NoticesPage = () => {
  const { user } = useAuth();
  const [notices,      setNotices]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [classrooms,   setClassrooms]   = useState([]);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [expandNotice, setExpandNotice] = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);
  const [success,      setSuccess]      = useState('');

  const role    = user.role;
  const canPost = role === 'mentor' || role === 'hod' || role === 'admin';

  // Fetch classrooms for the create form (mentor / hod only)
  useEffect(() => {
    if (role === 'mentor') {
      mentorAPI.getClassrooms()
        .then(r => setClassrooms(r.data.data || []))
        .catch(() => {});
    } else if (role === 'hod') {
      hodAPI.getClassrooms()
        .then(r => setClassrooms(r.data.data || []))
        .catch(() => {});
    }
  }, [role]);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await noticeAPI.getAll({ limit: 50 });
      setNotices(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const handleDelete = async (notice) => {
    if (!window.confirm(`Delete notice "${notice.title}"?`)) return;
    setDeletingId(notice._id);
    try {
      await noticeAPI.delete(notice._id);
      setSuccess('Notice deleted');
      loadNotices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete notice');
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteNotice = (notice) =>
    role === 'admin' || String(notice.createdBy?._id) === String(user._id);

  const subtitle = role === 'student'
    ? 'Notices from your classroom'
    : role === 'mentor'
    ? `${notices.length} notice${notices.length !== 1 ? 's' : ''} for your sections`
    : role === 'hod'
    ? `${notices.length} notice${notices.length !== 1 ? 's' : ''} in your department`
    : `${notices.length} total notices`;

  return (
    <Layout>
      <PageHeader
        title="Notices"
        subtitle={subtitle}
        action={
          canPost && (
            <button className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
              + Post Notice
            </button>
          )
        }
      />

      {success && <Alert type="success" message={success} />}
      <Alert message={error} />

      {loading ? (
        <div className="flex justify-center pt-20"><Spinner size="lg" /></div>
      ) : notices.length === 0 ? (
        <EmptyState
          LucideIcon={Megaphone}
          title="No notices yet"
          subtitle={
            canPost
              ? 'Post the first notice for your sections'
              : 'No notices have been posted for your classroom yet'
          }
        />
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <NoticeCard
              key={notice._id}
              notice={notice}
              canDelete={canDeleteNotice(notice) && deletingId !== notice._id}
              onDelete={handleDelete}
              onExpand={setExpandNotice}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <NoticeDetailModal
        notice={expandNotice}
        onClose={() => setExpandNotice(null)}
      />

      {/* Create modals */}
      {role === 'mentor' && (
        <MentorCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          classrooms={classrooms}
          onCreated={loadNotices}
        />
      )}
      {(role === 'hod' || role === 'admin') && (
        <HODCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          classrooms={classrooms}
          onCreated={loadNotices}
        />
      )}
    </Layout>
  );
};

export default NoticesPage;
