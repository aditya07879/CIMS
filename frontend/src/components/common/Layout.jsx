import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  AlertCircle,
  BookOpen,
  Bell,
  Users,
  Building2,
  UserCog,
  LogOut,
  Layers,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = {
  student: [
    { to: '/dashboard',     Icon: LayoutDashboard, label: 'Dashboard'     },
    { to: '/issues',        Icon: AlertCircle,      label: 'Issues'        },
    { to: '/classroom',     Icon: BookOpen,         label: 'My Classroom'  },
    { to: '/notices',       Icon: Layers,           label: 'Notices'       },
    { to: '/notifications', Icon: Bell,             label: 'Notifications' },
  ],
  mentor: [
    { to: '/dashboard',     Icon: LayoutDashboard, label: 'Dashboard'     },
    { to: '/mentor',        Icon: Users,            label: 'My Panel'      },
    { to: '/issues',        Icon: AlertCircle,      label: 'Issues'        },
    { to: '/classroom',     Icon: BookOpen,         label: 'Classroom'     },
    { to: '/notices',       Icon: Layers,           label: 'Notices'       },
    { to: '/notifications', Icon: Bell,             label: 'Notifications' },
  ],
  hod: [
    { to: '/dashboard',     Icon: LayoutDashboard, label: 'Dashboard'     },
    { to: '/hod',           Icon: UserCog,          label: 'HOD Panel'     },
    { to: '/issues',        Icon: AlertCircle,      label: 'Issues'        },
    { to: '/notices',       Icon: Layers,           label: 'Notices'       },
    { to: '/notifications', Icon: Bell,             label: 'Notifications' },
  ],
  admin: [
    { to: '/dashboard',      Icon: LayoutDashboard, label: 'Dashboard'      },
    { to: '/issues',         Icon: AlertCircle,      label: 'All Issues'     },
    { to: '/classrooms',     Icon: BookOpen,         label: 'Classrooms'     },
    { to: '/departments',    Icon: Building2,        label: 'Departments'    },
    { to: '/hod-management', Icon: UserCog,          label: 'HOD Management' },
    { to: '/notifications',  Icon: Bell,             label: 'Notifications'  },
  ],
};

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.student;
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: '248px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F1720 0%, #111C2B 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 40,
    }}>

      {/* Logo */}
      <div style={{
        padding: '22px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #F97362 0%, #F97362 40%, transparent 100%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#F97362',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: 'white',
            position: 'relative', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(249,115,98,0.35)',
          }}>
            C
            <div style={{
              position: 'absolute', bottom: '-3px', right: '-3px',
              width: '8px', height: '8px', background: '#111C2B',
              border: '2px solid #F97362',
            }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#F1F5F9', letterSpacing: '-0.01em' }}>CIMS</div>
            <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1px' }}>Issue Management</div>
          </div>
        </div>
      </div>

      {/* Role indicator */}
      <div style={{
        padding: '9px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(249,115,98,0.05)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F97362', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '9px',
          color: '#F97362',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          {user?.role}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {items.map(({ to, Icon, label }, i) => (
          <NavLink
            key={to}
            to={to}
            style={{ animationDelay: `${i * 40}ms`, textDecoration: 'none' }}
            className="slide-in"
            children={({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#F1F5F9' : '#64748B',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(249,115,98,0.15) 0%, rgba(249,115,98,0.05) 100%)'
                  : 'transparent',
                borderLeft: `2px solid ${isActive ? '#F97362' : 'transparent'}`,
                borderRadius: '0 6px 6px 0',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                position: 'relative',
              }}>
                <Icon
                  size={15}
                  style={{
                    color: isActive ? '#F97362' : '#475569',
                    flexShrink: 0,
                    transition: 'color 0.15s',
                    strokeWidth: isActive ? 2.5 : 1.8,
                  }}
                />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && (
                  <ChevronRight
                    size={12}
                    style={{ color: '#F97362', opacity: 0.7, flexShrink: 0 }}
                  />
                )}
              </div>
            )}
          />
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
        }}>
          <div style={{
            width: '30px', height: '30px', flexShrink: 0,
            background: 'rgba(249,115,98,0.15)',
            border: '1px solid rgba(249,115,98,0.3)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
            color: '#F97362',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '10px', color: '#F97362', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '1px' }}>
              {user?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', padding: '4px',
              transition: 'color 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const Layout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <main style={{
      flex: 1,
      marginLeft: '248px',
      padding: '36px 40px',
      maxWidth: 'calc(100vw - 248px)',
      minHeight: '100vh',
    }}>
      {children}
    </main>
  </div>
);
