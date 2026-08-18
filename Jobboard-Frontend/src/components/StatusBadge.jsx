export function StatusBadge({ status = "pending", type = "job" }) {
  const normalized = status.toLowerCase();

  const labels = {
    open: "Open Position",
    closed: "Closed",
    draft: "Draft",
    pending: "Under Review",
    reviewed: "Reviewed",
    shortlisted: "Shortlisted",
    rejected: "Not Selected",
  };

  const label = labels[normalized] || normalized.replace(/_/g, " ");

  return (
    <span className={`status-badge badge-${normalized}`} data-type={type}>
      <span className="badge-dot" aria-hidden="true" />
      <span className="badge-text">{label}</span>
    </span>
  );
}

export default StatusBadge;
