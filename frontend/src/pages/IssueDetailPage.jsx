import { ChevronUp, ChevronDown, ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueAPI } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CategoryBadge } from '../components/common/index.jsx';
import { Layout } from '../components/common/Layout.jsx';
import { Spinner, Alert, Select, ConfirmModal } from '../components/common/index.jsx';
import { statusClass, formatDate, timeAgo, STATUSES } from '../utils/helpers.js';

const IssueDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userVote, setUserVote] = useState(null);

  const load = async () => {
    try {
      const { data } = await issueAPI.getById(id);
      setIssue(data.data);
      // Check current user vote
      if (data.data.upvotes?.includes(user._id)) setUserVote('up');
      else if (data.data.downvotes?.includes(user._id)) setUserVote('down');
    } catch (e) {
      setError(e.response?.data?.message || 'Issue not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleVote = async (type) => {
    if (voting) return;
    setVoting(true);
    try {
      const newType = userVote === type ? 'remove' : type;
      const { data } = await issueAPI.vote(id, newType);
      setIssue(i => ({ ...i, upvotes: Array(data.data.upvotes).fill(0), downvotes: Array(data.data.downvotes).fill(0) }));
      setUserVote(newType === 'remove' ? null : type);
    } catch (e) {
      setError(e.response?.data?.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  const handleStatus = async (status) => {
    try {
      const { data } = await issueAPI.updateStatus(id, status);
      setIssue(i => ({ ...i, status: data.data.status }));
    } catch (e) {
      setError(e.response?.data?.message || 'Status update failed');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const { data } = await issueAPI.addComment(id, comment);
      setIssue(i => ({ ...i, comments: data.data }));
      setComment('');
    } catch (e) {
      setError(e.response?.data?.message || 'Comment failed');
    } finally {
      setCommenting(false);
    }
  };

  const handleDelete = async (reason) => {
    try {
      await issueAPI.delete(id, reason);
      navigate('/issues');
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Layout><div className="flex justify-center pt-20"><Spinner size="lg" /></div></Layout>;
  if (!issue) return <Layout><Alert message={error || 'Issue not found'} /></Layout>;

  const canModerate = user.role === 'mentor' || user.role === 'admin';

  return (
    <Layout>
      <div className="max-w-3xl">
        {/* Back */}
        <Link to="/issues" className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1 mb-6">
          ← Back to Issues
        </Link>

        <Alert message={error} />

        {/* Main card */}
        <div className="card p-6 mb-4">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CategoryBadge category={issue.category} />
            <span className={statusClass(issue.status)}>{issue.status}</span>
            {issue.isAnonymous && (
              <span className="badge bg-gray-500/10 text-gray-500 border border-gray-500/20">Anonymous</span>
            )}
          </div>

          <h1 className="text-xl font-semibold text-gray-100 mb-2 break-words">{issue.title}</h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-5">
  <span>
    {issue.classroom?.department}-{issue.classroom?.year}{issue.classroom?.section}
  </span>
  <span>·</span>
  <span>{formatDate(issue.createdAt)}</span>

  {/* ✅ Yeh add karo */}
  <span>·</span>
  {issue.isAnonymous ? (
    canModerate ? (
      // Mentor/HOD/Admin ko real naam dikhao
      <span className="text-yellow-400">
        {issue.author?.name} <span className="text-gray-600">(posted anonymously)</span>
      </span>
    ) : (
      // Student ko sirf "Anonymous" dikhao
      <span className="text-gray-500 italic">Anonymous</span>
    )
  ) : (
    // Non-anonymous — sabko naam dikhao
    <span>{issue.author?.name}</span>
  )}
</div>

          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{issue.description}</p>

          {/* Voting */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-surface-border">
            {['student', 'mentor'].includes(user.role) && (
              <>
                <button
                  onClick={() => handleVote('up')}
                  disabled={voting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    userVote === 'up'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-surface-hover text-gray-400 hover:text-green-400 border border-surface-border'
                  }`}
                >
                  <ChevronUp size={14} strokeWidth={2.5} /> {issue.upvotes?.length ?? 0}
                </button>
                <button
                  onClick={() => handleVote('down')}
                  disabled={voting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    userVote === 'down'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-surface-hover text-gray-400 hover:text-red-400 border border-surface-border'
                  }`}
                >
                  <ChevronDown size={14} strokeWidth={2.5} /> {issue.downvotes?.length ?? 0}
                </button>
              </>
            )}

            <div className="flex-1 hidden sm:block" />

            {/* Mentor/Admin actions */}
            {canModerate && (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Select
                  value={issue.status}
                  onChange={handleStatus}
                  className="w-full sm:w-40"
                  options={STATUSES.map(s => ({ value: s, label: s }))}
                />
                <button onClick={() => setDeleteOpen(true)} className="btn-danger text-sm px-3 py-1.5">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-border">
            <h2 className="font-medium text-gray-200">
              Comments <span className="text-gray-500 text-sm">({issue.comments?.filter(c => !c.isDeleted).length ?? 0})</span>
            </h2>
          </div>

          <div className="divide-y divide-surface-border">
            {issue.comments?.filter(c => !c.isDeleted).map(c => (
              <div key={c._id} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-semibold text-brand-400">
                    {c.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-300">{c.author?.name}</span>
                  <span className="text-xs text-emerald-400 capitalize">{c.author?.role}</span>
                  <span className="text-xs text-gray-600">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-300 ml-9">{c.content}</p>
              </div>
            ))}

            {issue.comments?.filter(c => !c.isDeleted).length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">No comments yet</p>
            )}
          </div>

          {/* Mentor comment form */}
          {canModerate && (
            <form onSubmit={handleComment} className="px-6 py-4 border-t border-surface-border">
              <label className="block text-xs text-gray-400 mb-2">Add Comment (visible to student)</label>
              <textarea
                className="input resize-none mb-3"
                rows={3}
                placeholder="Write your comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <button type="submit" className="btn-primary text-sm" disabled={commenting || !comment.trim()}>
                {commenting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Issue"
        description="This will soft-delete the issue. The author will be notified."
        requireReason
      />
    </Layout>
  );
};

export default IssueDetailPage;