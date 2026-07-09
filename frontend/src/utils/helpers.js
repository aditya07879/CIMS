export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
};

export const statusClass = (status) => {
  const map = {
    'Open': 'status-open',
    'Under Review': 'status-review',
    'Resolved': 'status-resolved',
    'Rejected': 'status-rejected',
  };
  return map[status] || 'badge';
};

// Geometric badge colors for categories
export const categoryColor = (cat) => {
  const map = {
    Academic:       'badge',   // uses currentColor from parent
    Infrastructure: 'badge',
    Administration: 'badge',
    Faculty:        'badge',
    Other:          'badge',
  };
  const colorMap = {
    Academic:       { color: '#a78bfa', border: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.08)' },
    Infrastructure: { color: '#fb923c', border: 'rgba(251,146,60,0.3)',  bg: 'rgba(251,146,60,0.08)' },
    Administration: { color: '#22d3ee', border: 'rgba(34,211,238,0.3)',  bg: 'rgba(34,211,238,0.08)' },
    Faculty:        { color: '#f472b6', border: 'rgba(244,114,182,0.3)', bg: 'rgba(244,114,182,0.08)' },
    Other:          { color: '#94a3b8', border: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.08)' },
  };
  return colorMap[cat] || colorMap.Other;
};

export const roleColor = (role) => {
  const map = { admin: '#F97362', mentor: '#34d399', student: '#94a3b8', hod: '#fbbf24' };
  return map[role] || '#94a3b8';
};

export const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'BCA', 'MCA', 'AIML', 'DS', 'CIVIL', 'MECH'];
export const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
export const CATEGORIES = ['Academic', 'Infrastructure', 'Administration', 'Faculty', 'Other'];
export const STATUSES = ['Open', 'Under Review', 'Resolved', 'Rejected'];
