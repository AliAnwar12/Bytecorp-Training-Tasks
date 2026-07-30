import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import JobCard from "../components/JobCard";

function JobsPage({ currentUser, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [employmentType, setEmploymentType] = useState("all");
  const [jobStatus, setJobStatus] = useState("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setStatus("loading");
      setErrorMessage("");

      const response = await apiClient.get("/jobs/");

      if (Array.isArray(response.data)) {
        setJobs(response.data);
      } else if (Array.isArray(response.data.results)) {
        setJobs(response.data.results);
      } else {
        setJobs([]);
      }

      setStatus("success");
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load jobs. Please check if the backend server is running.";

      setErrorMessage(message);
      setStatus("error");
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const employmentTypes = Array.from(
    new Set(jobs.map((job) => job.employment_type).filter(Boolean)),
  );
  const statusTypes = Array.from(
    new Set(jobs.map((job) => job.status).filter(Boolean)),
  );
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const companies = new Set(jobs.map((job) => job.company_name).filter(Boolean));
  const filteredJobs = jobs.filter((job) => {
    const searchableText = [
      job.title,
      job.company_name,
      job.location,
      job.description,
      job.employment_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
    const matchesEmployment =
      employmentType === "all" || job.employment_type === employmentType;
    const matchesStatus = jobStatus === "all" || job.status === jobStatus;

    return matchesSearch && matchesEmployment && matchesStatus;
  });

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand-mark compact" aria-label="ByteCorp">
          <span>BC</span>
          <strong>ByteCorp</strong>
        </div>

        <div className="user-menu">
          {currentUser && (
            <div>
              <strong>{currentUser.name}</strong>
              <span>{formatLabel(currentUser.role)}</span>
            </div>
          )}
          {currentUser && (
            <button className="ghost-button" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ByteCorp Job Board</p>
          <h1>Find the role that moves your career forward.</h1>
          <p className="subtitle">
            Browse high-signal openings with clean filters, compensation context,
            and company details designed for quick comparison.
          </p>
        </div>

        <div className="hero-panel" aria-label="Job board overview">
          <div>
            <span>{jobs.length}</span>
            <p>Total roles</p>
          </div>
          <div>
            <span>{openJobs}</span>
            <p>Open now</p>
          </div>
          <div>
            <span>{companies.size}</span>
            <p>Companies</p>
          </div>
        </div>
      </section>

      <section className="toolbar" aria-label="Job filters">
        <label className="search-field">
          <span>Search</span>
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Title, company, location, keyword"
            type="search"
            value={searchTerm}
          />
        </label>

        <label>
          <span>Type</span>
          <select
            onChange={(event) => setEmploymentType(event.target.value)}
            value={employmentType}
          >
            <option value="all">All types</option>
            {employmentTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select
            onChange={(event) => setJobStatus(event.target.value)}
            value={jobStatus}
          >
            <option value="all">All statuses</option>
            {statusTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <button onClick={fetchJobs}>Refresh</button>
      </section>

      {status === "loading" && <p className="info">Loading jobs...</p>}

      {status === "error" && (
        <div className="error-box">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {status === "success" && jobs.length === 0 && (
        <p className="info">No jobs available yet.</p>
      )}

      {status === "success" && jobs.length > 0 && filteredJobs.length === 0 && (
        <p className="info">No roles match the current filters.</p>
      )}

      {status === "success" && filteredJobs.length > 0 && (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Open directory</p>
              <h2>{filteredJobs.length} matching roles</h2>
            </div>
            <span>{jobs.length} total listings</span>
          </div>

          <section className="jobs-grid">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function formatLabel(value = "") {
  return value.replaceAll("_", " ");
}

export default JobsPage;
