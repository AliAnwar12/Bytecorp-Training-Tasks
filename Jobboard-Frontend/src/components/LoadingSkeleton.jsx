export function JobCardSkeleton() {
  return (
    <div className="job-card skeleton-card" aria-hidden="true">
      <div className="job-card-header">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton-body">
        <div className="skeleton skeleton-text" style={{ width: "30%", height: "14px" }} />
        <div className="skeleton skeleton-title" style={{ width: "75%", height: "24px" }} />
        <div className="skeleton skeleton-text" style={{ width: "100%", height: "14px" }} />
        <div className="skeleton skeleton-text" style={{ width: "85%", height: "14px" }} />
      </div>
      <div className="skeleton-footer">
        <div className="skeleton skeleton-pill" />
        <div className="skeleton skeleton-pill" />
        <div className="skeleton skeleton-pill" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="metric-card skeleton-metric" aria-hidden="true">
      <div className="skeleton skeleton-title" style={{ width: "50px", height: "36px" }} />
      <div className="skeleton skeleton-text" style={{ width: "80px", height: "14px" }} />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      <td><div className="skeleton skeleton-text" style={{ width: "120px" }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: "180px" }} /></td>
      <td><div className="skeleton skeleton-badge" /></td>
      <td><div className="skeleton skeleton-text" style={{ width: "80px" }} /></td>
      <td><div className="skeleton skeleton-button" /></td>
    </tr>
  );
}

export default JobCardSkeleton;
