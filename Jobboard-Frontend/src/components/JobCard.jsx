import StatusBadge from "./StatusBadge";

export function JobCard({
  job,
  onSelect,
  onApply,
  onEdit,
  onDelete,
  isEmployer = false,
  hasApplied = false,
}) {
  const companyName = job.company_name || "Company";
  const location = job.location || "Remote / Unspecified";
  const status = job.status || "open";

  const formatSalary = (min, max) => {
    if (!min && !max) return "Compensation undisclosed";
    const formatter = new Intl.NumberFormat("en-PK", {
      maximumFractionDigits: 0,
    });
    if (min && max) return `PKR ${formatter.format(min)} – ${formatter.format(max)}`;
    return min ? `From PKR ${formatter.format(min)}` : `Up to PKR ${formatter.format(max)}`;
  };

  const formatType = (type) => {
    if (!type) return "Full-time";
    return type.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <article
      className={`job-card ${status !== "open" ? "job-card-inactive" : ""}`}
      onClick={() => onSelect && onSelect(job)}
    >
      <div className="job-card-main-col">
        <div className="job-card-header">
          <div className="company-info-wrap">
            <div className="company-logo-avatar" aria-hidden="true">
              {companyName.slice(0, 1).toUpperCase()}
            </div>
            <span className="company-name-label">{companyName}</span>
          </div>
          <span className="job-post-date">{formatDate(job.created_at)}</span>
        </div>

        <div className="job-card-body">
          <h3 className="job-card-title">{job.title}</h3>
          {job.description && (
            <p className="job-card-description">{job.description}</p>
          )}
        </div>

        <div className="job-card-tags">
          <span className="tag-pill tag-location">📍 {location}</span>
          <span className="tag-pill tag-type">💼 {formatType(job.employment_type)}</span>
          <span className="tag-pill tag-salary">{formatSalary(job.salary_min, job.salary_max)}</span>
        </div>
      </div>

      <div className="job-card-footer" onClick={(e) => e.stopPropagation()}>
        <StatusBadge status={status} type="job" />

        {isEmployer ? (
          <div className="card-employer-actions">
            {onEdit && (
              <button
                className="secondary-btn edit-btn-sm"
                onClick={() => onEdit(job)}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                className="danger-btn delete-btn-sm"
                onClick={() => onDelete(job.id)}
              >
                Delete
              </button>
            )}
          </div>
        ) : (
          onApply && (
            <button
              className={`primary-btn ${hasApplied ? "applied-btn" : ""}`}
              disabled={status !== "open" || hasApplied}
              onClick={() => onApply(job)}
            >
              {hasApplied ? "Applied ✓" : status === "open" ? "Apply" : "Closed"}
            </button>
          )
        )}
      </div>
    </article>
  );
}

export default JobCard;
