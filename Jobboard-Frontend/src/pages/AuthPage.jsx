import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AuthPage({ initialMode = "login", onAuthSuccess, onModeChange }) {
  const [mode, setMode] = useState(initialMode === "register" ? "register" : "login");
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "job_seeker",
    bio: "",
    years_of_experience: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setErrorMsg("");
    if (onModeChange) onModeChange(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        const user = await register(formData);
        if (onAuthSuccess) onAuthSuccess(user);
      } else {
        const user = await login(formData.email, formData.password);
        if (onAuthSuccess) onAuthSuccess(user);
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const isRegistering = mode === "register";

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <h1 className="auth-hero-title">
            {isRegistering ? "Create Account" : "Sign In"}
          </h1>
          <p className="auth-hero-desc">
            {isRegistering
              ? "Join a high-signal network connecting developers and engineering teams."
              : "Access your application tracker and hiring pipeline."}
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              className={!isRegistering ? "active" : ""}
              onClick={() => handleTabSwitch("login")}
              role="tab"
            >
              Sign In
            </button>
            <button
              type="button"
              className={isRegistering ? "active" : ""}
              onClick={() => handleTabSwitch("register")}
              role="tab"
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegistering && (
              <>
                <div className="form-group">
                  <label htmlFor="auth-name-input">Full Name</label>
                  <input
                    id="auth-name-input"
                    name="name"
                    type="text"
                    placeholder="Muhammad Ahmed"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                  />
                </div>

                <div className="form-group">
                  <label>I want to join as:</label>
                  <div className="role-selection-grid">
                    <label
                      className={`role-select-card ${formData.role === "job_seeker" ? "selected" : ""
                        }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="job_seeker"
                        checked={formData.role === "job_seeker"}
                        onChange={handleChange}
                      />
                      <div className="role-card-content">
                        <span className="role-card-title">Job Seeker</span>
                        <span className="role-card-desc">Find & apply to roles</span>
                      </div>
                    </label>

                    <label
                      className={`role-select-card ${formData.role === "company_representative" ? "selected" : ""
                        }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="company_representative"
                        checked={formData.role === "company_representative"}
                        onChange={handleChange}
                      />
                      <div className="role-card-content">
                        <span className="role-card-title">Employer</span>
                        <span className="role-card-desc">Post & hire talent</span>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="auth-email-input">Email</label>
              <input
                id="auth-email-input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password-input">Password (min 8 characters)</label>
              <input
                id="auth-password-input"
                name="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            {isRegistering && formData.role === "job_seeker" && (
              <div className="form-group">
                <label htmlFor="auth-exp-input">
                  Years of Experience
                  <span className="optional-tag">Optional</span>
                </label>
                <input
                  id="auth-exp-input"
                  name="years_of_experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_of_experience}
                  onChange={handleChange}
                />
              </div>
            )}

            {errorMsg && (
              <div className="form-error-alert" role="alert">
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="primary-btn full-width-btn auth-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? "Please wait..."
                : isRegistering
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
