import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { issueAPI } from '../api/services.js';
import { Layout } from '../components/common/Layout.jsx';
import { StatCard, Spinner, Alert, PageHeader, CategoryBadge } from '../components/common/index.jsx';
import { statusClass, timeAgo } from '../utils/helpers.js';
import {
  Layers,
  Circle,
  Clock,
  CheckCircle2,
  ChevronUp,
  Plus,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, issuesRes] = await Promise.all([
          issueAPI.getStats(),
          issueAPI.getAll({ limit: 5, sort: '-createdAt' }),
        ]);
        setStats(statsRes.data.data);
        setRecent(issuesRes.data.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load dashboard');
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const getCount = (status) => stats?.byStatus?.find(s => s._id === status)?.count ?? 0;

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
        <Spinner size="lg" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]}`}
        subtitle={`${user?.role} · ${user?.department ? `${user.department}${user.year ? `-${user.year}` : ''}${user.section ? user.section : ''}` : 'All Departments'}`}
        action={user.role === 'student' && (
          <Link to="/issues/new" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={13} strokeWidth={2.5} />
            Raise Issue
          </Link>
        )}
      />

      <Alert message={error} />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }} className="stagger">
        <StatCard label="Total Issues"  value={stats?.total}            LucideIcon={Layers}       color="brand"  />
        <StatCard label="Open"          value={getCount('Open')}        LucideIcon={Circle}       color="blue"   />
        <StatCard label="Under Review"  value={getCount('Under Review')} LucideIcon={Clock}       color="yellow" />
        <StatCard label="Resolved"      value={getCount('Resolved')}    LucideIcon={CheckCircle2} color="green"  />
      </div>

      {/* Recent Issues */}
      <div style={{ background: '#243044', border: '1px solid #2D3F5A', position: 'relative' }} className="fade-in">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, #F97362 0%, transparent 50%)' }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #2D3F5A',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '3px', height: '16px', background: '#F97362' }} />
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#F1F5F9', letterSpacing: '-0.01em' }}>Recent Issues</h2>
          </div>
          <Link to="/issues" style={{
            fontSize: '11px', color: '#F97362', textDecoration: 'none',
            fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748B', padding: '48px', fontSize: '13px' }}>No issues yet</p>
        ) : (
          <div>
            {recent.map((issue, i) => (
              <Link
                key={issue._id}
                to={`/issues/${issue._id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '16px',
                  padding: '14px 20px',
                  borderBottom: i < recent.length - 1 ? '1px solid #2D3F5A' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2A3A52'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '10px',
                    color: '#64748B', paddingTop: '2px', minWidth: '20px',
                    letterSpacing: '0.04em',
                  }}>{String(i+1).padStart(2,'0')}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <CategoryBadge category={issue.category} />
                      <span className={statusClass(issue.status)}>{issue.status}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {issue.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>{timeAgo(issue.createdAt)}</p>
                  </div>

                  <div style={{
                    fontSize: '11px', color: '#64748B',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Inter, sans-serif', paddingTop: '2px',
                    flexShrink: 0,
                  }}>
                    <ChevronUp size={12} style={{ color: '#F97362' }} strokeWidth={2.5} />
                    {issue.upvotes?.length ?? 0}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
