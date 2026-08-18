import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import skillsApi from "../api/skillsApi";

export function JobDetailModal({
  job,
  onClose,
  onApply,
  hasApplied = false,
  isJobSeeker = false,
}) {
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    if (!job?.id) return;

    let isMounted = true;
    async function loadJobSkills() {
      try {
        setLoadingSkills(true);
        const allJobSkills = await skillsApi.getJobSkills();
        if (isMounted) {
          const matching = allJobSkills.filter((js) => js.job === job.id);
          setSkills(matching);
        }
      } catch {
        // Non-critical background fetch
      } finally {
        if (isMounted) setLoadingSkills(false);
      }
    }

    loadJobSkills();
    return () => {
      isMounted = false;
    };
  }, [job]);

  if (!job) return null;

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

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-brand">
            <div className="company-logo-avatar large-avatar" aria-hidden="true">
              {(job.company_name || "C").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <span className="modal-eyebrow">{job.company_name}</span>
              <h2 className="modal-title">{job.title}</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-content-grid">
          <div className="modal-main-column">
            <section className="modal-section">
              <h3 className="section-subtitle">About the Role</h3>
              <div className="job-description-full">
                {job.description ? (
                  job.description.split("\n\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))
                ) : (
                  <p>No detailed description provided.</p>
                )}
              </div>
            </section>

            {skills.length > 0 && (
              <section className="modal-section">
                <h3 className="section-subtitle">Required Technologies & Skills</h3>
                <div className="skills-pill-group">
                  {skills.map((s) => (
                    <span key={s.id} className="skill-chip">
                      {s.skill_name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="modal-side-column">
            <div className="sidebar-card">
              <h4 className="sidebar-title">Position Overview</h4>
              
              <div className="sidebar-detail-item">
                <span className="sidebar-label">Status</span>
                <StatusBadge status={job.status || "open"} type="job" />
              </div>

              <div className="sidebar-detail-item">
                <span className="sidebar-label">Location</span>
                <span className="sidebar-value">{job.location || "Remote"}</span>
              </div>

              <div className="sidebar-detail-item">
                <span className="sidebar-label">Employment Type</span>
                <span className="sidebar-value">{formatType(job.employment_type)}</span>
              </div>

              <div className="sidebar-detail-item">
                <span className="sidebar-label">Compensation</span>
                <span className="sidebar-value salary-highlight">
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
              </div>

              <div className="sidebar-detail-item">
                <span className="sidebar-label">Posted</span>
                <span className="sidebar-value">
                  {job.created_at
                    ? new Date(job.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>

              {onApply && (
                <button
                  className={`primary-btn full-width-btn ${hasApplied ? "applied-btn" : ""}`}
                  disabled={job.status !== "open" || hasApplied}
                  onClick={() => {
                    onClose();
                    onApply(job);
                  }}
                  style={{ marginTop: "0.5rem" }}
                >
                  {hasApplied ? "Applied ✓" : job.status === "open" ? "Apply for this Role" : "Position Closed"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetailModal;
