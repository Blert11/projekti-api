const CLASS_MAP = {
  ACTIVE: 'badge-active',
  RETURNED: 'badge-returned',
  OVERDUE: 'badge-overdue',
};

export default function StatusBadge({ status }) {
  const cls = CLASS_MAP[status] || 'badge-role';
  return <span className={`badge ${cls}`}>{status?.toLowerCase()}</span>;
}
