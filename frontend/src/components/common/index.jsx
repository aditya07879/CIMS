import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Hash,
  TrendingUp,
  ThumbsUp,
  FilePlus2,
  Trash2,
  RefreshCw,
  MessageSquare,
  Bell,
  Inbox,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

/* ── Spinner ─────────────────────────────────────────────────── */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sz = { sm: 16, md: 24, lg: 40 }[size];
  return (
    <div style={{
      width: sz, height: sz, flexShrink: 0,
      border: `2px solid rgba(249,115,98,0.2)`,
      borderTopColor: '#F97362',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
    }} className={className} />
  );
};

/* ── Alert ───────────────────────────────────────────────────── */
export const Alert = ({ type = 'error', message }) => {
  if (!message) return null;
  const cfg = {
    error:   { border: 'rgba(248,113,113,0.4)', bg: 'rgba(248,113,113,0.07)', color: '#fca5a5', bar: '#f87171', Icon: AlertCircle },
    success: { border: 'rgba(52,211,153,0.4)',  bg: 'rgba(52,211,153,0.07)',  color: '#6ee7b7', bar: '#34d399', Icon: CheckCircle2 },
    info:    { border: 'rgba(96,165,250,0.4)',  bg: 'rgba(96,165,250,0.07)',  color: '#93c5fd', bar: '#60a5fa', Icon: Info },
  }[type];
  const { Icon } = cfg;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 16px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.bar}`,
      fontSize: '13px',
      color: cfg.color,
      marginBottom: '16px',
    }} className="fade-in">
      <Icon size={14} style={{ flexShrink: 0, marginTop: '1px', color: cfg.bar }} />
      {message}
    </div>
  );
};

/* ── EmptyState ──────────────────────────────────────────────── */
export const EmptyState = ({ icon, title, subtitle, LucideIcon = Inbox }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px',
    gap: '12px',
    textAlign: 'center',
  }}>
    <div style={{
      width: '56px', height: '56px',
      border: '1px solid #2D3F5A',
      background: '#243044',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#F97362',
    }}>
      <LucideIcon size={22} strokeWidth={1.5} />
    </div>
    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#94A3B8', fontSize: '14px' }}>{title}</p>
    {subtitle && <p style={{ fontSize: '12px', color: '#64748B' }}>{subtitle}</p>}
  </div>
);

/* ── Modal ───────────────────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,25,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative',
        background: '#243044',
        border: '1px solid #2D3F5A',
        borderTop: '2px solid #F97362',
        width: '100%', maxWidth: '520px',
        padding: '28px',
      }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#F1F5F9', letterSpacing: '-0.01em' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #2D3F5A', color: '#64748B',
              width: '28px', height: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', borderRadius: '4px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97362'; e.currentTarget.style.color = '#F97362'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2D3F5A'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Badge ───────────────────────────────────────────────────── */
export const Badge = ({ children, className = '' }) => (
  <span className={`badge ${className}`}>{children}</span>
);

/* ── PageHeader ──────────────────────────────────────────────── */
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #2D3F5A',
    position: 'relative',
  }}>
    <div style={{
      position: 'absolute', bottom: '-1px', left: 0,
      width: '40px', height: '2px', background: '#F97362',
    }} />
    <div>
      <h1 style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: '22px',
        color: '#F1F5F9',
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
      }}>{title}</h1>
      {subtitle && (
        <p style={{
          fontSize: '12px', color: '#64748B',
          marginTop: '6px',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.04em',
        }}>{subtitle}</p>
      )}
    </div>
    {action && <div className="fade-in">{action}</div>}
  </div>
);

/* ── StatCard ────────────────────────────────────────────────── */
export const StatCard = ({ label, value, LucideIcon, color = 'brand' }) => {
  const colors = {
    brand:  { text: '#F97362', bg: 'rgba(249,115,98,0.1)',  border: 'rgba(249,115,98,0.25)' },
    green:  { text: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
    yellow: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
    red:    { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
    blue:   { text: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
  }[color];

  return (
    <div style={{
      background: '#243044',
      border: '1px solid #2D3F5A',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
    }} className="fade-in"
    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2D3F5A'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '80px', height: '80px',
        background: colors.bg,
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: `linear-gradient(90deg, ${colors.text} 0%, transparent 60%)`, opacity: 0.6 }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', color: '#64748B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
          <p style={{ fontSize: '32px', fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.04em', lineHeight: 1 }}>{value ?? '—'}</p>
        </div>
        {LucideIcon && (
          <div style={{
            width: '40px', height: '40px', flexShrink: 0,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LucideIcon size={18} style={{ color: colors.text }} strokeWidth={1.8} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ── VoteButton ──────────────────────────────────────────────── */
export const VoteButton = ({ type, count, active, onClick, disabled }) => {
  const isUp = type === 'up';
  const Icon = isUp ? ChevronUp : ChevronDown;
  const activeStyle = isUp
    ? { bg: 'rgba(52,211,153,0.2)', color: '#34d399', border: 'rgba(52,211,153,0.3)' }
    : { bg: 'rgba(248,113,113,0.2)', color: '#f87171', border: 'rgba(248,113,113,0.3)' };
  const idle = { bg: 'rgba(45,63,90,0.5)', color: '#64748B', border: '#2D3F5A' };
  const s = active ? activeStyle : idle;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '6px 12px', fontSize: '13px',
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: '6px', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={14} strokeWidth={2.5} />
      {count}
    </button>
  );
};

/* ── Select ──────────────────────────────────────────────────── */
export const Select = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    {label && <label style={{ display: 'block', fontSize: '10px', color: '#64748B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ appearance: 'none', cursor: 'pointer' }}>
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt} style={{ background: '#243044' }}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
  </div>
);

/* ── ConfirmModal ────────────────────────────────────────────── */
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, requireReason }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: 1.6 }}>{description}</p>
      {requireReason && (
        <textarea
          className="input"
          rows={3}
          placeholder="Reason (required)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ resize: 'none', marginBottom: '16px', display: 'block' }}
        />
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
        <button
          className="btn-danger"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={handleConfirm}
          disabled={loading || (requireReason && !reason.trim())}
        >
          {loading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
};

/* ── Inject spin keyframe globally ───────────────────────────── */
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

/* ── CategoryBadge ───────────────────────────────────────────── */
import { categoryColor } from '../../utils/helpers.js';
export const CategoryBadge = ({ category }) => {
  const c = categoryColor(category);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      fontSize: '9px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: c.color,
      border: `1px solid ${c.border}`,
      background: c.bg,
    }}>{category}</span>
  );
};

/* ── Notification type icons ─────────────────────────────────── */
export const NOTIF_ICONS = {
  issue_status_changed: RefreshCw,
  new_comment: MessageSquare,
  issue_voted: ThumbsUp,
  issue_created: FilePlus2,
  issue_deleted: Trash2,
};
export const DEFAULT_NOTIF_ICON = Bell;

/* ── Attachment icon ─────────────────────────────────────────── */
export { Hash };
