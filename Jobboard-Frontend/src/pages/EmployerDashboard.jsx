import { useState, useEffect, useCallback } from "react";
import jobsApi from "../api/jobsApi";
import companiesApi from "../api/companiesApi";
import applicationsApi from "../api/applicationsApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import JobFormModal from "../components/JobFormModal";
import CompanyModal from "../components/CompanyModal";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import { extractErrorMessage } from "../api/apiClient";

export function EmployerDashboard() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [editingJob, setEditingJob] = useState(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const [updatingAppId, setUpdatingAppId] = useState(null);

  const loadJobsAndCompanies = useCallback(async () => {
    try {
      setLoadingJobs(true);
      setErrorMsg("");
      const [jobsData, companiesData] = await Promise.all([
        jobsApi.getJobs({ ordering: "-created_at", mine: "true" }),
        companiesApi.getCompanies({ mine: "true" }),
      ]);
      setJobs(jobsData);
      setCompanies(companiesData);

      if (jobsData.length > 0 && !selectedJobForApplicants) {
        setSelectedJobForApplicants(jobsData[0]);
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoadingJobs(false);
    }
  }, [selectedJobForApplicants]);

  const loadApplicantsForJob = useCallback(async (jobId) => {
    if (!jobId) return;
    try {
      setLoadingApplicants(true);
      const apps = await applicationsApi.getJobApplications(jobId);
      setJobApplications(apps);
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
      setJobApplications([]);
    } finally {
      setLoadingApplicants(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadJobsAndCompanies();
  }, [loadJobsAndCompanies]);

  useEffect(() => {
    if (selectedJobForApplicants?.id && activeTab === "applicants") {
      loadApplicantsForJob(selectedJobForApplicants.id);
    }
  }, [selectedJobForApplicants, activeTab, loadApplicantsForJob]);

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job listing?")) {
      return;
    }

    try {
      await jobsApi.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      addToast("Job listing deleted.", "info");
      if (selectedJobForApplicants?.id === jobId) {
        setSelectedJobForApplicants(null);
      }
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    try {
      setUpdatingAppId(appId);
      await applicationsApi.updateApplicationStatus(appId, newStatus);
      setJobApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
      addToast(`Status updated to "${newStatus}".`, "success");
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleJobCreatedOrUpdated = () => {
    loadJobsAndCompanies();
  };

  const handleCompanyCreatedOrUpdated = () => {
    companiesApi.getCompanies({ mine: "true" }).then(setCompanies);
  };

  const openCount = jobs.filter((j) => j.status === "open").length;

  return (
    <div className="dashboard-root">
      {/* Header */}
      <div className="dashboard-header-card">
        <div className="dashboard-welcome">
          <div className="dashboard-avatar-large">
            {(currentUser?.name || "E")[0].toUpperCase()}
          </div>
          <div>
            <span className="dashboard-eyebrow">Employer Hub</span>
            <h1 className="dashboard-title">{currentUser?.name}</h1>
            <p className="dashboard-subtitle">Manage company openings and candidate evaluation pipelines.</p>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="metric-box">
            <span className="metric-box-num">{jobs.length}</span>
            <span className="metric-box-label">Listings</span>
          </div>
          <div className="metric-box">
            <span className="metric-box-num">{openCount}</span>
            <span className="metric-box-label">Open</span>
          </div>
          <div className="metric-box">
            <span className="metric-box-num">{companies.length}</span>
            <span className="metric-box-label">Companies</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs-bar" role="tablist">
        <button
          className={`tab-btn ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => setActiveTab("jobs")}
          role="tab"
        >
          Job Listings ({jobs.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "applicants" ? "active" : ""}`}
          onClick={() => setActiveTab("applicants")}
          role="tab"
        >
          Applicants Pipeline
        </button>

        <button
          className={`tab-btn ${activeTab === "company" ? "active" : ""}`}
          onClick={() => setActiveTab("company")}
          role="tab"
        >
          Company Profile ({companies.length})
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadJobsAndCompanies} />}

      {/* TAB 1: JOBS */}
      {activeTab === "jobs" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Your Job Listings</h2>
              <p className="panel-subtitle">Create, publish, and edit positions.</p>
            </div>
            <button
              className="primary-btn"
              onClick={() => setIsCreatingJob(true)}
            >
              + Create Listing
            </button>
          </div>

          {loadingJobs ? (
            <p className="info-loading">Loading listings...</p>
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No job listings"
              message="Post your first technical opening to start reviewing candidate applications."
              actionLabel="Create Opening"
              onAction={() => setIsCreatingJob(true)}
              iconType="briefcase"
            />
          ) : (
            <div className="applications-table-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Title & Company</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Compensation</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="table-job-cell">
                        <strong className="table-job-title">{job.title}</strong>
                        <span className="table-company-sub">{job.company_name}</span>
                      </td>
                      <td>
                        <StatusBadge status={job.status} type="job" />
                      </td>
                      <td>{job.location}</td>
                      <td>
                        PKR {(job.salary_min / 1000).toFixed(0)}k – {(job.salary_max / 1000).toFixed(0)}k
                      </td>
                      <td className="table-date-cell">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <div className="table-actions-group">
                          <button
                            className="secondary-btn"
                            style={{ padding: "0.3rem 0.65rem", fontSize: "0.78rem" }}
                            onClick={() => {
                              setSelectedJobForApplicants(job);
                              setActiveTab("applicants");
                            }}
                          >
                            Applicants
                          </button>
                          <button
                            className="secondary-btn"
                            style={{ padding: "0.3rem 0.65rem", fontSize: "0.78rem" }}
                            onClick={() => setEditingJob(job)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-btn delete-btn-sm"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLICANTS */}
      {activeTab === "applicants" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Applicant Evaluation</h2>
              <p className="panel-subtitle">Review candidate qualifications and advance pipeline stages.</p>
            </div>

            {jobs.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Role:</span>
                <select
                  className="filter-select"
                  value={selectedJobForApplicants?.id || ""}
                  onChange={(e) => {
                    const found = jobs.find((j) => j.id === Number(e.target.value));
                    setSelectedJobForApplicants(found || null);
                  }}
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.company_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!selectedJobForApplicants ? (
            <EmptyState title="No job selected" iconType="search" />
          ) : loadingApplicants ? (
            <p className="info-loading">Loading applicants for {selectedJobForApplicants.title}...</p>
          ) : jobApplications.length === 0 ? (
            <EmptyState
              title={`No applicants for "${selectedJobForApplicants.title}" yet`}
              message="Applications submitted by candidates will appear here."
              iconType="file"
            />
          ) : (
            <div className="applications-table-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Status</th>
                    <th>Cover Statement</th>
                    <th>Applied</th>
                    <th className="text-right">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {jobApplications.map((app) => (
                    <tr key={app.id}>
                      <td className="table-job-cell">
                        <strong className="table-job-title">{app.applicant_email}</strong>
                      </td>
                      <td>
                        <StatusBadge status={app.status} type="application" />
                      </td>
                      <td>
                        {app.cover_letter ? (
                          <div className="applicant-cover-letter-box">
                            "{app.cover_letter}"
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>None</span>
                        )}
                      </td>
                      <td className="table-date-cell">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <select
                          className="status-updater-select"
                          value={app.status}
                          disabled={updatingAppId === app.id}
                          onChange={(e) =>
                            handleUpdateApplicationStatus(app.id, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPANY PROFILE */}
      {activeTab === "company" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Registered Organizations</h2>
              <p className="panel-subtitle">Manage company details and employer brand.</p>
            </div>
            <button
              className="primary-btn"
              onClick={() => setIsCreatingCompany(true)}
            >
              + Register Company
            </button>
          </div>

          {companies.length === 0 ? (
            <EmptyState
              title="No company profile"
              message="Register your company to begin posting jobs."
              actionLabel="Register Company"
              onAction={() => setIsCreatingCompany(true)}
              iconType="briefcase"
            />
          ) : (
            <div className="company-cards-grid">
              {companies.map((comp) => (
                <div key={comp.id} className="company-management-card">
                  <div className="company-card-top">
                    <div className="company-logo-avatar" aria-hidden="true">
                      {comp.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="company-title-row">
                        <strong>{comp.name}</strong>
                      </div>
                      <span className="company-loc-sub">{comp.location}</span>
                    </div>
                  </div>

                  <p className="company-desc-text">
                    {comp.description || "No description."}
                  </p>

                  {comp.website && (
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noreferrer"
                      className="company-website-link"
                    >
                      {comp.website}
                    </a>
                  )}

                  <div>
                    <button
                      className="secondary-btn"
                      style={{ width: "100%", marginTop: "0.5rem" }}
                      onClick={() => setEditingCompany(comp)}
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {(isCreatingJob || editingJob) && (
        <JobFormModal
          job={editingJob}
          onClose={() => {
            setIsCreatingJob(false);
            setEditingJob(null);
          }}
          onSuccess={handleJobCreatedOrUpdated}
        />
      )}

      {(isCreatingCompany || editingCompany) && (
        <CompanyModal
          company={editingCompany}
          onClose={() => {
            setIsCreatingCompany(false);
            setEditingCompany(null);
          }}
          onSuccess={handleCompanyCreatedOrUpdated}
        />
      )}
    </div>
  );
}

export default EmployerDashboard;
