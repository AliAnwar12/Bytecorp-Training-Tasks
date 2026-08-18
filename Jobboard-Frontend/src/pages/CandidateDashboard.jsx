import { useState, useEffect, useCallback } from "react";
import applicationsApi from "../api/applicationsApi";
import skillsApi from "../api/skillsApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import { extractErrorMessage } from "../api/apiClient";

export function CandidateDashboard({ onExploreJobs }) {
  const { currentUser, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    bio: currentUser?.bio || "",
    years_of_experience: currentUser?.years_of_experience || 0,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  const loadApplications = useCallback(async () => {
    try {
      setLoadingApps(true);
      setErrorMsg("");
      const apps = await applicationsApi.getMyApplications();
      setApplications(apps);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const loadSkillsData = useCallback(async () => {
    try {
      setLoadingSkills(true);
      const [userSkills, platformSkills] = await Promise.all([
        skillsApi.getMySkills(),
        skillsApi.getSkills(),
      ]);
      setMySkills(userSkills);
      setAllSkills(platformSkills);
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    } finally {
      setLoadingSkills(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadApplications();
    loadSkillsData();
  }, [loadApplications, loadSkillsData]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        years_of_experience: currentUser.years_of_experience || 0,
      });
    }
  }, [currentUser]);

  const handleWithdrawApplication = async (applicationId, jobTitle) => {
    if (!window.confirm(`Withdraw application for "${jobTitle}"?`)) {
      return;
    }

    try {
      await applicationsApi.deleteApplication(applicationId);
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      addToast("Application withdrawn.", "info");
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({
        name: profileForm.name.trim(),
        bio: profileForm.bio.trim(),
        years_of_experience: Number(profileForm.years_of_experience),
      });
    } catch {
      // Handled in context
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillToAdd) return;

    try {
      setAddingSkill(true);
      const created = await skillsApi.addMySkill(selectedSkillToAdd);
      setMySkills((prev) => [...prev, created]);
      setSelectedSkillToAdd("");
      addToast("Skill added to profile.", "success");
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (userSkillId, skillName) => {
    try {
      await skillsApi.removeMySkill(userSkillId);
      setMySkills((prev) => prev.filter((s) => s.id !== userSkillId));
      addToast(`Removed ${skillName}.`, "info");
    } catch (err) {
      addToast(extractErrorMessage(err), "error");
    }
  };

  const existingSkillIds = new Set(mySkills.map((s) => s.skill));
  const availableSkillsToAdd = allSkills.filter((s) => !existingSkillIds.has(s.id));

  return (
    <div className="dashboard-root">
      {/* Header */}
      <div className="dashboard-header-card">
        <div className="dashboard-welcome">
          <div className="dashboard-avatar-large">
            {(currentUser?.name || "C")[0].toUpperCase()}
          </div>
          <div>
            <span className="dashboard-eyebrow">Candidate Profile</span>
            <h1 className="dashboard-title">{currentUser?.name}</h1>
            <p className="dashboard-subtitle">
              {currentUser?.email} • {currentUser?.years_of_experience || 0} yrs experience
            </p>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <div className="metric-box">
            <span className="metric-box-num">{applications.length}</span>
            <span className="metric-box-label">Applications</span>
          </div>
          <div className="metric-box">
            <span className="metric-box-num">{mySkills.length}</span>
            <span className="metric-box-label">Skills</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs-bar" role="tablist">
        <button
          className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
          role="tab"
        >
          Applications ({applications.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "skills" ? "active" : ""}`}
          onClick={() => setActiveTab("skills")}
          role="tab"
        >
          Skills ({mySkills.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          role="tab"
        >
          Profile Settings
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={loadApplications} />}

      {/* TAB 1: APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Application Status Tracker</h2>
              <p className="panel-subtitle">Review real-time updates directly from hiring teams.</p>
            </div>
            <button className="secondary-btn" onClick={loadApplications}>
              Refresh
            </button>
          </div>

          {loadingApps ? (
            <p className="info-loading">Loading portfolio...</p>
          ) : applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              message="You haven't applied to any job listings yet."
              actionLabel="Explore Open Positions"
              onAction={onExploreJobs}
              iconType="briefcase"
            />
          ) : (
            <div className="applications-table-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Cover Statement</th>
                    <th>Applied</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="table-job-cell">
                        <strong className="table-job-title">{app.job_title || `Job #${app.job}`}</strong>
                      </td>
                      <td>
                        <StatusBadge status={app.status} type="application" />
                      </td>
                      <td>
                        {app.cover_letter ? (
                          <span className="cover-letter-snippet" title={app.cover_letter}>
                            "{app.cover_letter.slice(0, 60)}{app.cover_letter.length > 60 ? "..." : ""}"
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>None</span>
                        )}
                      </td>
                      <td className="table-date-cell">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <button
                          className="danger-btn delete-btn-sm"
                          onClick={() =>
                            handleWithdrawApplication(app.id, app.job_title || `Job #${app.job}`)
                          }
                        >
                          Withdraw
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SKILLS */}
      {activeTab === "skills" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Skills & Capabilities</h2>
              <p className="panel-subtitle">Highlight your technical stack to hiring managers.</p>
            </div>
          </div>

          <div className="skills-manager-container">
            <div className="skills-add-card">
              <h3 className="section-subtitle">Add Skill</h3>
              <form onSubmit={handleAddSkill} className="add-skill-inline-form">
                <select
                  value={selectedSkillToAdd}
                  onChange={(e) => setSelectedSkillToAdd(e.target.value)}
                  className="filter-select"
                  style={{ flex: 1 }}
                  required
                >
                  <option value="">Select skill from catalog</option>
                  {availableSkillsToAdd.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!selectedSkillToAdd || addingSkill}
                >
                  {addingSkill ? "Adding..." : "Add"}
                </button>
              </form>
            </div>

            <div className="my-skills-display-card">
              <h3 className="section-subtitle">Your Skills ({mySkills.length})</h3>
              {loadingSkills ? (
                <p>Loading...</p>
              ) : mySkills.length === 0 ? (
                <EmptyState title="No skills added" iconType="file" />
              ) : (
                <div className="skills-pill-group">
                  {mySkills.map((userSkill) => (
                    <div key={userSkill.id} className="interactive-skill-badge">
                      <span>{userSkill.skill_name}</span>
                      <button
                        type="button"
                        className="skill-remove-btn"
                        onClick={() => handleRemoveSkill(userSkill.id, userSkill.skill_name)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === "profile" && (
        <div className="tab-content-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Personal Profile</h2>
              <p className="panel-subtitle">Update your professional details.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-edit-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="candidate-name-input">Full Name</label>
                <input
                  id="candidate-name-input"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  minLength={2}
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidate-email-input">Email</label>
                <input
                  id="candidate-email-input"
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="candidate-exp-input">Years of Experience</label>
                <input
                  id="candidate-exp-input"
                  type="number"
                  min="0"
                  max="50"
                  value={profileForm.years_of_experience}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      years_of_experience: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="candidate-bio-input">Professional Bio</label>
              <textarea
                id="candidate-bio-input"
                rows={4}
                placeholder="Share your background..."
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                }
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="primary-btn"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;
