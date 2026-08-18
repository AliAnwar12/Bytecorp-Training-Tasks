import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import DiscoveryPage from "./pages/DiscoveryPage";
import CandidateDashboard from "./pages/CandidateDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import JobFormModal from "./components/JobFormModal";
import "./index.css";

function AppContent() {
  const { currentUser, isAuthenticated, isJobSeeker, isCompanyRep, isAdmin, authStatus } = useAuth();
  const [currentView, setCurrentView] = useState("discovery"); // 'discovery' | 'candidate' | 'employer' | 'admin' | 'auth-login' | 'auth-register'
  const [viewHistory, setViewHistory] = useState([]);
  const [showGlobalPostJobModal, setShowGlobalPostJobModal] = useState(false);

  // Automatically redirect away from protected views upon logout or unauthenticated access
  useEffect(() => {
    if (!isAuthenticated && (currentView === "candidate" || currentView === "employer" || currentView === "admin")) {
      setCurrentView("discovery");
      setViewHistory([]);
    }
  }, [isAuthenticated, currentView]);

  const handleNavigateView = (view) => {
    if (view !== currentView) {
      setViewHistory((prev) => [...prev, currentView]);
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoBack = () => {
    if (viewHistory.length > 0) {
      const prev = [...viewHistory];
      const previousView = prev.pop();
      setViewHistory(prev);
      setCurrentView(previousView || "discovery");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrentView("discovery");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const canGoBack = viewHistory.length > 0 || currentView !== "discovery";

  const handleAuthSuccess = (user) => {
    if (user.role === "company_representative") {
      setCurrentView("employer");
    } else if (user.role === "admin") {
      setCurrentView("admin");
    } else {
      setCurrentView("discovery");
    }
    setViewHistory([]);
  };

  if (authStatus === "loading") {
    return (
      <div className="auth-shell">
        <div className="empty-state-card" style={{ maxWidth: "340px" }}>
          <div className="skeleton skeleton-avatar" style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
          <h3>Connecting to JobBoard</h3>
          <p>Verifying secure session tokens...</p>
        </div>
      </div>
    );
  }

  // Auth pages view
  if (currentView === "auth-login" || currentView === "auth-register") {
    return (
      <>
        <Navbar
          currentView={currentView}
          onViewChange={handleNavigateView}
          onOpenPostJob={() => setShowGlobalPostJobModal(true)}
          onGoBack={handleGoBack}
          canGoBack={canGoBack}
        />
        <AuthPage
          initialMode={currentView === "auth-register" ? "register" : "login"}
          onAuthSuccess={handleAuthSuccess}
          onModeChange={(mode) => setCurrentView(`auth-${mode}`)}
        />
      </>
    );
  }

  return (
    <div className="app-root">
      <Navbar
        currentView={currentView}
        onViewChange={handleNavigateView}
        onOpenPostJob={() => setShowGlobalPostJobModal(true)}
        onGoBack={handleGoBack}
        canGoBack={canGoBack}
      />

      <main className="app-main-content">
        {currentView === "discovery" && (
          <DiscoveryPage
            onNavigateAuth={(authMode) => handleNavigateView(authMode)}
          />
        )}

        {currentView === "candidate" && isAuthenticated && isJobSeeker && (
          <CandidateDashboard
            onExploreJobs={() => handleNavigateView("discovery")}
          />
        )}

        {currentView === "employer" && isAuthenticated && isCompanyRep && (
          <EmployerDashboard />
        )}

        {currentView === "admin" && isAuthenticated && isAdmin && (
          <AdminDashboard />
        )}
      </main>

      {/* Global Post Job Modal available to employers from Navbar CTA */}
      {showGlobalPostJobModal && isAuthenticated && isCompanyRep && (
        <JobFormModal
          onClose={() => setShowGlobalPostJobModal(false)}
          onSuccess={() => {
            setShowGlobalPostJobModal(false);
            if (currentView === "employer") {
              setCurrentView("employer");
            } else {
              handleNavigateView("employer");
            }
          }}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
