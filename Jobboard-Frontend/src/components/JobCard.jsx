function JobCard({ job }) {
  const companyName = job.company_name || "Company not available";
  const location = job.location || "Location flexible";
  const employmentType = formatLabel(job.employment_type || "Role type pending");
  const salaryRange = formatSalary(job.salary_min, job.salary_max);
  const status = job.status || "pending";

  return (
    <article className="job-card">
      <div className="job-card-header">
        <div className="company-avatar" aria-hidden="true">
          {companyName.slice(0, 1)}
        </div>
        <span className={`status-badge ${status}`}>{formatLabel(status)}</span>
      </div>

      <div className="job-card-body">
        <p className="company-name">{companyName}</p>
        <h3>{job.title || "Untitled role"}</h3>
        <p className="description">
          {job.description || "No description has been added yet."}
        </p>
      </div>

      <div className="job-meta">
        <span>{location}</span>
        <span>{employmentType}</span>
        <span>{salaryRange}</span>
      </div>
    </article>
  );
}

function formatLabel(value = "") {
  return value.replaceAll("_", " ");
}

function formatSalary(min, max) {
  if (!min && !max) {
    return "Salary not listed";
  }

  if (min && max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }

  return min ? `From ${formatCurrency(min)}` : `Up to ${formatCurrency(max)}`;
}

function formatCurrency(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "USD",
  }).format(number);
}

export default JobCard;
