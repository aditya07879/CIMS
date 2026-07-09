import { FileQuestion, ChevronUp, ChevronDown, Plus, MessageSquare } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { issueAPI } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CategoryBadge } from '../components/common/index.jsx';
import { Layout } from '../components/common/Layout.jsx';
import { Spinner, EmptyState, PageHeader, Select, Alert } from '../components/common/index.jsx';
import { statusClass, timeAgo, CATEGORIES, STATUSES } from '../utils/helpers.js';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-upvotes', label: 'Most Voted' },
];

const IssuesPage = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', sort: '-createdAt', page: 1 });
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const setFilter = (k) => (v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: LIMIT, ...filters };
      if (!params.status) delete params.status;
      if (!params.category) delete params.category;
      const { data } = await issueAPI.getAll(params);
      setIssues(data.data);
      setTotal(data.total);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <Layout>
      <PageHeader
        title="Issues"
        subtitle={`${total} total`}
        action={
          user.role === 'student' && (
            <Link to="/issues/new" className="btn-primary text-sm">+ Raise Issue</Link>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filters.status} onChange={setFilter('status')} className="w-36"
          options={[{ value: '', label: 'All Status' }, ...STATUSES.map(s => ({ value: s, label: s }))]} />
        <Select value={filters.category} onChange={setFilter('category')} className="w-40"
          options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
        <Select value={filters.sort} onChange={setFilter('sort')} className="w-40" options={SORT_OPTIONS} />
      </div>

      <Alert message={error} />

      {loading ? (
        <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
      ) : issues.length === 0 ? (
        <EmptyState LucideIcon={FileQuestion} title="No issues found" subtitle="Try changing the filters or raise a new issue" />
      ) : (
        <>
          <div className="space-y-2">
            {issues.map(issue => (
              <Link
                key={issue._id}
                to={`/issues/${issue._id}`}
                className="card block p-4 hover:border-brand-500/30 transition-all duration-200 fade-in"
              >
                <div className="flex items-start gap-4">
                  {/* Vote count */}
                  <div className="flex flex-col items-center text-xs text-gray-500 shrink-0 pt-0.5 w-10">
                    <span style={{ display:"inline-flex",alignItems:"center",gap:"3px",color:"#34d399",fontSize:"11px" }}><ChevronUp size={11} strokeWidth={2.5}/>{issue.upvotes?.length ?? 0}</span>
                    <span style={{ display:"inline-flex",alignItems:"center",gap:"3px",color:"#f87171",fontSize:"11px" }}><ChevronDown size={11} strokeWidth={2.5}/>{issue.downvotes?.length ?? 0}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <CategoryBadge category={issue.category} />
                      <span className={statusClass(issue.status)}>{issue.status}</span>
                      {issue.isAnonymous && (
                        <span className="badge bg-gray-500/10 text-gray-500 border border-gray-500/20">Anonymous</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-200">{issue.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
  <span>
    {issue.classroom?.department}-{issue.classroom?.year}{issue.classroom?.section}
  </span>
  <span>·</span>
  <span>{timeAgo(issue.createdAt)}</span>

  {/* ✅ Yeh add karo */}
  <span>·</span>
  {issue.isAnonymous ? (
    ['mentor','hod','admin'].includes(user.role) ? (
      <span className="text-yellow-400">
        {issue.author?.name} <span className="text-gray-600">(anon)</span>
      </span>
    ) : (
      <span className="italic">Anonymous</span>
    )
  ) : (
    <span>{issue.author?.name}</span>
  )}

  {issue.comments?.length > 0 && (
    <><span>·</span><span style={{display:"inline-flex",alignItems:"center",gap:"3px"}}><MessageSquare size={10} strokeWidth={2}/>{issue.comments.length}</span></>
  )}
</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center gap-2 mt-6 justify-center">
              <button
                className="btn-secondary text-sm px-3 py-1.5"
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              >← Prev</button>
              <span className="text-sm text-gray-400">Page {filters.page} of {pages}</span>
              <button
                className="btn-secondary text-sm px-3 py-1.5"
                disabled={filters.page >= pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default IssuesPage;
