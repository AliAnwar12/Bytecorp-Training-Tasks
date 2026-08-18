import { useAuth } from "../context/AuthContext";

export function Navbar({ currentView, onViewChange, onOpenPostJob, onGoBack, canGoBack }) {
  const { currentUser, isAuthenticated, logout, isJobSeeker, isCompanyRep, isAdmin } = useAuth();

  const getRoleLabel = (role) => {
    switch (role) {
      case "company_representative":
        return "Employer";
      case "job_seeker":
        return "Candidate";
      case "admin":
        return "Admin";
      default:
        return role;
    }
  };

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        <div className="navbar-brand-group">
          {canGoBack && (
            <button
              type="button"
              className="nav-back-btn"
              onClick={onGoBack}
              aria-label="Go back to previous page"
              title="Back"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Back</span>
            </button>
          )}

          <div className="navbar-brand" onClick={() => onViewChange("discovery")} role="button" tabIndex={0}>
            <span className="brand-title">JobBoard</span>
          </div>
        </div>

        <nav className="navbar-links" aria-label="Main Navigation">
          <button
            className={`nav-link ${currentView === "discovery" ? "active" : ""}`}
            onClick={() => onViewChange("discovery")}
          >
            Explore
          </button>

          {isAuthenticated && isJobSeeker && (
            <button
              className={`nav-link ${currentView === "candidate" ? "active" : ""}`}
              onClick={() => onViewChange("candidate")}
            >
              My Applications
            </button>
          )}

          {isAuthenticated && isCompanyRep && (
            <button
              className={`nav-link ${currentView === "employer" ? "active" : ""}`}
              onClick={() => onViewChange("employer")}
            >
              Employer Hub
            </button>
          )}

          {isAuthenticated && isAdmin && (
            <button
              className={`nav-link ${currentView === "admin" ? "active" : ""}`}
              onClick={() => onViewChange("admin")}
            >
              Admin
            </button>
          )}
        </nav>

        <div className="navbar-actions">
          {isAuthenticated && isCompanyRep && onOpenPostJob && (
            <button className="primary-btn" onClick={onOpenPostJob}>
              Post a Role
            </button>
          )}

          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-avatar-badge" title={currentUser?.email}>
                <span className="user-avatar-letter">
                  {(currentUser?.name || "U")[0].toUpperCase()}
                </span>
                <div className="user-meta-header">
                  <span className="user-name-text">{currentUser?.name}</span>
                  <span className="user-role-pill">({getRoleLabel(currentUser?.role)})</span>
                </div>
              </div>
              <button
                className="logout-icon-btn"
                onClick={logout}
                title="Sign out"
                aria-label="Logout"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <button
                className="primary-btn"
                onClick={() => onViewChange("auth-register")}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
