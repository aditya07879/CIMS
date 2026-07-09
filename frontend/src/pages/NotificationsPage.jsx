import { useEffect, useState } from 'react';
import { notifAPI } from '../api/services.js';
import { Layout } from '../components/common/Layout.jsx';
import { Spinner, Alert, EmptyState, PageHeader, NOTIF_ICONS, DEFAULT_NOTIF_ICON } from '../components/common/index.jsx';
import { timeAgo } from '../utils/helpers.js';
import { Bell } from 'lucide-react';

const NotificationsPage = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await notifAPI.getAll();
      setNotifs(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await notifAPI.markAllRead();
    setNotifs(n => n.map(notif => ({ ...notif, isRead: true })));
  };

  const markOne = async (id) => {
    await notifAPI.markRead(id);
    setNotifs(n => n.map(notif => notif._id === id ? { ...notif, isRead: true } : notif));
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;

  if (loading) return <Layout><div className="flex justify-center pt-20"><Spinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={
          unreadCount > 0 && (
            <button className="btn-secondary text-sm" onClick={markAll}>Mark all read</button>
          )
        }
      />

      <Alert message={error} />

      {notifs.length === 0 ? (
        <EmptyState LucideIcon={Bell} title="No notifications" subtitle="You'll be notified about status changes and comments" />
      ) : (
        <div className="card divide-y divide-surface-border">
          {notifs.map(n => {
            const IconComp = NOTIF_ICONS[n.type] || DEFAULT_NOTIF_ICON;
            return (
              <div
                key={n._id}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${
                  n.isRead ? 'opacity-60' : 'hover:bg-surface-hover'
                }`}
                onClick={() => !n.isRead && markOne(n._id)}
              >
                <div style={{
                  width: '32px', height: '32px', flexShrink: 0,
                  background: 'rgba(249,115,98,0.1)',
                  border: '1px solid rgba(249,115,98,0.2)',
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '2px',
                }}>
                  <IconComp size={14} style={{ color: '#F97362' }} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-200">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default NotificationsPage;
