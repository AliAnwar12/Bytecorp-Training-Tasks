import { useState, useEffect, useCallback } from "react";
import skillsApi from "../api/skillsApi";
import auditApi from "../api/auditApi";
import companiesApi from "../api/companiesApi";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import { extractErrorMessage } from "../api/apiClient";

export function AdminDashboard() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("skills");
  const [skills, setSkills] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [newSkillName, setNewSkillName] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      if (activeTab === "skills") {
        const skillsData = await skillsApi.getSkills();
        setSkills(skillsData);
      } else if (activeTab === "audit") {
        const params = {};
        if (auditActionFilter) params.action = auditActionFilter;
        const logs = await auditApi.getAuditLogs(params);
        setAuditLogs(logs);
      } else if (activeTab === "companies") {
        const comps = await companiesApi.getCompanies();
        setCompanies(comps);
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, auditActionFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      setCreatingSkill(true);
      const created = await skillsApi.createSkill(newSkillName);
      setSkills((prev) => [...prev, created]);
      setNewSkillName("");
      addToast(`Skill "${created.name}" added.`, "success");
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    } finally {
      setCreatingSkill(false);
    }
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-header-card">
        <div className="dashboard-welcome">
          <div className="dashboard-avatar-large">⚡</div>
          <div>
            <span className="dashboard-eyebrow">Platform Administration</span>
            <h1 className="dashboard-title">System Console</h1>
            <p className="dashboard-subtitle">Manage taxonomy, organizations, and inspect audit logs.</p>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="metric-box">
            <span className="metric-box-num">{skills.length}</span>
            <span className="metric-box-label">Skills</span>
          </div>
          <div className="metric-box">
            <span className="metric-box-num">{companies.length}</span>
            <span className="metric-box-label">Companies</span>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs-bar" role="tablist">
        <button
          className={`tab-btn ${activeTab === "skills" ? "active" : ""}`}
          onClick={() => setActiveTab("skills")}
        >
          Skills Taxonomy
        </button>

        <button
          className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Trail
        </button>

        <button
          className={`tab-btn ${activeTab === "companies" ? "active" : ""}`}
          onClick={() => setActiveTab("companies")}
        >
          Companies
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadData} />}

      {/* TAB 1: SKILLS */}
      {activeTab === "skills" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Standardized Skill Catalogue</h2>
              <p className="panel-subtitle">Global skills used across job requirements.</p>
            </div>
          </div>

          <div className="skills-manager-container">
            <div className="skills-add-card">
              <h3 className="section-subtitle">Add New Platform Skill</h3>
              <form onSubmit={handleCreateSkill} className="add-skill-inline-form">
                <input
                  type="text"
                  placeholder="e.g. Kubernetes, Rust, GraphQL"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="search-input"
                  style={{ flex: 1 }}
                  required
                  minLength={2}
                />
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!newSkillName.trim() || creatingSkill}
                >
                  {creatingSkill ? "Adding..." : "Add"}
                </button>
              </form>
            </div>

            <div className="my-skills-display-card">
              <h3 className="section-subtitle">Platform Skills ({skills.length})</h3>
              {loading ? (
                <p>Loading...</p>
              ) : skills.length === 0 ? (
                <EmptyState title="No skills defined yet" iconType="file" />
              ) : (
                <div className="skills-pill-group">
                  {skills.map((skill) => (
                    <span key={skill.id} className="skill-chip">
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Audit Trail</h2>
              <p className="panel-subtitle">Record of resource mutations and administrative actions.</p>
            </div>

            <select
              className="filter-select"
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="create">CREATE</option>
              <option value="update">UPDATE</option>
              <option value="delete">DELETE</option>
              <option value="request">REQUEST</option>
            </select>
          </div>

          {loading ? (
            <p className="info-loading">Loading audit records...</p>
          ) : auditLogs.length === 0 ? (
            <EmptyState title="No audit events recorded" iconType="file" />
          ) : (
            <div className="applications-table-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Model</th>
                    <th>Target</th>
                    <th>Actor</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`audit-action-badge action-${log.action}`}>
                          {log.action?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <code>{log.model_name}</code>
                      </td>
                      <td>{log.object_repr || `#${log.object_id}`}</td>
                      <td>
                        <strong>{log.actor_email || "System"}</strong>
                      </td>
                      <td className="table-date-cell">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPANIES */}
      {activeTab === "companies" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Registered Organizations</h2>
              <p className="panel-subtitle">Directory of employer organizations.</p>
            </div>
          </div>

          {loading ? (
            <p className="info-loading">Loading companies...</p>
          ) : companies.length === 0 ? (
            <EmptyState title="No companies registered yet" iconType="briefcase" />
          ) : (
            <div className="applications-table-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Website</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((comp) => (
                    <tr key={comp.id}>
                      <td>
                        <strong>{comp.name}</strong>
                      </td>
                      <td>{comp.location}</td>
                      <td>
                        {comp.website ? (
                          <a href={comp.website} target="_blank" rel="noreferrer">
                            {comp.website}
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="table-date-cell">
                        {new Date(comp.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
