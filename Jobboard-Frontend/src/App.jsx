import { useEffect, useState } from "react";
import apiClient from "./api/apiClient";
import JobsPage from "./pages/JobsPage";
import "./index.css";

function App() {
  const [view, setView] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("checking");

  useEffect(() => {
    async function loadCurrentUser() {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setAuthStatus("idle");
        return;
      }

      try {
        const response = await apiClient.get("/auth/me/");
        setCurrentUser(response.data);
        setView("jobs");
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setAuthStatus("idle");
      }
    }

    loadCurrentUser();
  }, []);

  function handleAuthSuccess(user) {
    setCurrentUser(user);
    setView("jobs");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setCurrentUser(null);
    setView("login");
  }

  if (authStatus === "checking") {
    return (
      <main className="auth-shell">
        <p className="info">Checking your session...</p>
      </main>
    );
  }

  if (view === "jobs") {
    return <JobsPage currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <AuthPage
      mode={view}
      onAuthSuccess={handleAuthSuccess}
      onModeChange={setView}
    />
  );
}

function AuthPage({ mode, onAuthSuccess, onModeChange }) {
  const isRegistering = mode === "register";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "job_seeker",
  });
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function fetchCurrentUser() {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  }

  function getErrorMessage(error) {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }

    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }

    if (error.response?.status) {
      return `Request failed with status ${error.response.status}.`;
    }

    if (error.request) {
      return "The backend did not respond. Check that the Django server is running on port 8000.";
    }

    return error.message || "Something went wrong. Please try again.";
  }

  async function login(email, password) {
    const response = await apiClient.post("/auth/login/", { email, password });

    if (!response.data?.access || !response.data?.refresh) {
      throw new Error("Login response did not include access and refresh tokens.");
    }

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);
    return fetchCurrentUser();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      if (isRegistering) {
        await apiClient.post("/auth/register/", {
          name: formData.name.trim(),
          email,
          password,
          role: formData.role,
        });
      }

      const user = await login(email, password);
      onAuthSuccess(user);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setStatus("idle");
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="brand-mark" aria-label="ByteCorp">
            <span>BC</span>
            <strong>ByteCorp</strong>
          </div>
          <p className="eyebrow">Talent Network</p>
          <h1>{isRegistering ? "Create your account" : "Welcome back"}</h1>
          <p className="subtitle">
            {isRegistering
              ? "Join a focused workspace for discovering roles, managing applications, and connecting with high-intent teams."
              : "Sign in to browse curated openings, compare roles quickly, and keep your job search moving."}
          </p>

          <div className="auth-highlights" aria-label="Platform highlights">
            <span>Verified roles</span>
            <span>Smart discovery</span>
            <span>Company profiles</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <p>{isRegistering ? "Start your profile" : "Account access"}</p>
            <span>{isRegistering ? "2 min" : "Secure"}</span>
          </div>

          <div className="auth-tabs" aria-label="Authentication mode">
            <button
              className={!isRegistering ? "active" : ""}
              type="button"
              onClick={() => onModeChange("login")}
            >
              Login
            </button>
            <button
              className={isRegistering ? "active" : ""}
              type="button"
              onClick={() => onModeChange("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <label>
                Full name
                <input
                  minLength="2"
                  name="name"
                  onChange={updateField}
                  required
                  type="text"
                  value={formData.name}
                />
              </label>
            )}

            <label>
              Email
              <input
                autoComplete="email"
                name="email"
                onChange={updateField}
                required
                type="email"
                value={formData.email}
              />
            </label>

            <label>
              Password
              <input
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength="8"
                name="password"
                onChange={updateField}
                required
                type="password"
                value={formData.password}
              />
            </label>

            {isRegistering && (
              <fieldset>
                <legend>Account type</legend>
                <div className="role-options">
                  <label className={formData.role === "job_seeker" ? "selected" : ""}>
                    <input
                      checked={formData.role === "job_seeker"}
                      name="role"
                      onChange={updateField}
                      type="radio"
                      value="job_seeker"
                    />
                    Job Seeker
                  </label>
                  <label
                    className={
                      formData.role === "company_representative" ? "selected" : ""
                    }
                  >
                    <input
                      checked={formData.role === "company_representative"}
                      name="role"
                      onChange={updateField}
                      type="radio"
                      value="company_representative"
                    />
                    Company Rep
                  </label>
                </div>
              </fieldset>
            )}

            {errorMessage && <div className="error-box">{errorMessage}</div>}

            <button
              className="submit-button"
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting"
                ? "Please wait..."
                : isRegistering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default App;
