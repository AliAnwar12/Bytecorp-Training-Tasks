import { useState, useEffect, useCallback } from "react";
import jobsApi from "../api/jobsApi";
import skillsApi from "../api/skillsApi";
import companiesApi from "../api/companiesApi";
import applicationsApi from "../api/applicationsApi";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import JobDetailModal from "../components/JobDetailModal";
import ApplicationModal from "../components/ApplicationModal";
import { JobCardSkeleton } from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import { extractErrorMessage } from "../api/apiClient";

export function DiscoveryPage({ onNavigateAuth }) {
  const { currentUser, isAuthenticated, isJobSeeker } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [myApplications, setMyApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters (Only active when authenticated)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  // Active Modals
  const [selectedJobForDetail, setSelectedJobForDetail] = useState(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const params = {
        ordering,
      };
      if (isAuthenticated) {
        if (minSalary) params.salary_min = minSalary;
        if (selectedSkill) params.skill = selectedSkill;
      }

      const [jobsData, skillsData, companiesData] = await Promise.all([
        jobsApi.getJobs(params),
        skillsApi.getSkills().catch(() => []),
        companiesApi.getCompanies().catch(() => []),
      ]);

      setJobs(jobsData);
      setSkills(skillsData);
      setCompanies(companiesData);

      if (isAuthenticated && isJobSeeker) {
        try {
          const apps = await applicationsApi.getMyApplications();
          setMyApplications(apps);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [ordering, minSalary, selectedSkill, isAuthenticated, isJobSeeker]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side instant search filter (authenticated only)
  const filteredJobs = jobs.filter((job) => {
    if (!isAuthenticated || !searchTerm.trim()) return true;
    const query = searchTerm.trim().toLowerCase();
    const titleMatch = (job.title || "").toLowerCase().includes(query);
    const companyMatch = (job.company_name || "").toLowerCase().includes(query);
    const descMatch = (job.description || "").toLowerCase().includes(query);
    const locMatch = (job.location || "").toLowerCase().includes(query);
    return titleMatch || companyMatch || descMatch || locMatch;
  });

  const appliedJobIds = new Set(myApplications.map((app) => app.job));

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      if (onNavigateAuth) onNavigateAuth("auth-login");
      return;
    }
    if (!isJobSeeker) {
      alert("Only registered candidates can submit job applications.");
      return;
    }
    setSelectedJobForApply(job);
  };

  const handleApplicationSuccess = (jobId) => {
    setMyApplications((prev) => [...prev, { job: jobId, status: "pending" }]);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSkill("");
    setMinSalary("");
    setOrdering("-created_at");
  };

  // Public gating: split jobs into 3 visible preview jobs and the next blurred teaser jobs
  const visibleJobs = isAuthenticated ? filteredJobs : filteredJobs.slice(0, 3);
  const blurredTeaserJobs = !isAuthenticated && filteredJobs.length > 3 ? filteredJobs.slice(3, 6) : [];

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (selectedSkill ? 1 : 0) +
    (minSalary ? 1 : 0);

  return (
    <div className="discovery-page-root">
      {/* Hero */}
      <section className="discovery-hero-section">
        <div className="hero-content">
          <h1 className="hero-headline">
            Careers that define <br />
            what's next.
          </h1>

          <p className="hero-description">
            Discover open technical positions with clear compensation, direct team access, and zero friction.
          </p>

          <div className="hero-metrics-bar">
            <div className="metric-pill">
              <span className="metric-value">{jobs.length}</span>
              <span className="metric-label">Roles</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-pill">
              <span className="metric-value">{companies.length}</span>
              <span className="metric-label">Companies</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-pill">
              <span className="metric-value">{skills.length}</span>
              <span className="metric-label">Technologies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Section */}
      <section className="discovery-main-section">
        {/* Search & Filters Dock: ONLY rendered for authenticated users */}
        {isAuthenticated && (
          <div className="filter-dock-card">
            <div className="filter-dock-primary">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search title, company, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-select-group">
                <select
                  className="filter-select"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                >
                  <option value="">Any Salary</option>
                  <option value="100000">PKR 100k+</option>
                  <option value="200000">PKR 200k+</option>
                  <option value="300000">PKR 300k+</option>
                  <option value="400000">PKR 400k+</option>
                </select>

                <select
                  className="filter-select"
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                >
                  <option value="-created_at">Newest</option>
                  <option value="created_at">Oldest</option>
                  <option value="-salary_max">Highest Pay</option>
                  <option value="salary_min">Lowest Pay</option>
                </select>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="filter-dock-skills">
                <span className="skills-cloud-label">Technologies:</span>
                <div className="skills-cloud-tags">
                  <button
                    className={`skill-pill ${selectedSkill === "" ? "active" : ""}`}
                    onClick={() => setSelectedSkill("")}
                  >
                    All
                  </button>
                  {skills.map((s) => (
                    <button
                      key={s.id}
                      className={`skill-pill ${selectedSkill === s.name ? "active" : ""}`}
                      onClick={() =>
                        setSelectedSkill(selectedSkill === s.name ? "" : s.name)
                      }
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {activeFilterCount > 0 && (
                  <button className="reset-filters-btn" onClick={handleResetFilters}>
                    Clear ({activeFilterCount})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="discovery-results-header">
          <div className="results-count-meta">
            <h2 className="results-heading">
              {loading
                ? "Loading roles..."
                : isAuthenticated
                ? `${filteredJobs.length} ${
                    filteredJobs.length === 1 ? "Open Position" : "Open Positions"
                  }`
                : `Featured Roles (${visibleJobs.length} of ${jobs.length})`}
            </h2>
            {isAuthenticated && activeFilterCount > 0 && (
              <span className="active-filters-indicator">
                (filtered from {jobs.length})
              </span>
            )}
          </div>
          {isAuthenticated && (
            <button className="refresh-icon-btn" onClick={loadData}>
              Refresh
            </button>
          )}
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

        {loading && (
          <div className="jobs-grid">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        )}

        {!loading && !errorMsg && visibleJobs.length === 0 && (
          <EmptyState
            title="No matching roles"
            message="No job openings match your current search criteria. Try adjusting your filters."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
            iconType="search"
          />
        )}

        {/* Visible Job Cards */}
        {!loading && !errorMsg && visibleJobs.length > 0 && (
          <div className="jobs-grid">
            {visibleJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={(selected) => setSelectedJobForDetail(selected)}
                onApply={(targetJob) => handleApplyClick(targetJob)}
                hasApplied={appliedJobIds.has(job.id)}
              />
            ))}
          </div>
        )}

        {/* Gated Blurred Section for Unauthenticated Users */}
        {!isAuthenticated && blurredTeaserJobs.length > 0 && (
          <div className="gated-preview-wrapper">
            <div className="gated-blurred-list" aria-hidden="true">
              {blurredTeaserJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={() => {}}
                  onApply={() => {}}
                  hasApplied={false}
                />
              ))}
            </div>

            <div className="gated-overlay-curtain">
              <div className="gated-auth-card">
                <div className="gated-lock-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="gated-title">Sign in or Register to see more Jobs</h3>
                <p className="gated-desc">
                  Access all open positions, real-time application tracking, and custom salary filters.
                </p>
                <div className="gated-actions">
                  <button
                    className="primary-btn"
                    style={{ minWidth: "130px" }}
                    onClick={() => onNavigateAuth && onNavigateAuth("auth-login")}
                  >
                    Sign In
                  </button>
                  <button
                    className="secondary-btn"
                    style={{ minWidth: "130px" }}
                    onClick={() => onNavigateAuth && onNavigateAuth("auth-register")}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {selectedJobForDetail && (
        <JobDetailModal
          job={selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
          onApply={(targetJob) => handleApplyClick(targetJob)}
          hasApplied={appliedJobIds.has(selectedJobForDetail.id)}
          isJobSeeker={isJobSeeker}
        />
      )}

      {selectedJobForApply && (
        <ApplicationModal
          job={selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}

export default DiscoveryPage;
