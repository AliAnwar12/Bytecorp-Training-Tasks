import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import applicationsApi from "../api/applicationsApi";
import { extractErrorMessage } from "../api/apiClient";

export function ApplicationModal({ job, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (coverLetter.trim() && coverLetter.trim().length < 10) {
      setErrorMsg("Cover letter must be at least 10 characters long if provided.");
      return;
    }

    try {
      setSubmitting(true);
      await applicationsApi.applyToJob(job.id, { cover_letter: coverLetter });
      addToast(`Application for ${job.title} submitted successfully!`, "success");
      if (onSuccess) onSuccess(job.id);
      onClose();
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">{job.company_name}</span>
            <h2 className="modal-title">Apply for {job.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="applicant-summary-box">
            <span className="applicant-summary-title">Applying with your profile:</span>
            <div className="applicant-summary-grid">
              <div>
                <span className="summary-label">Name</span>
                <strong>{currentUser?.name || "Candidate"}</strong>
              </div>
              <div>
                <span className="summary-label">Email</span>
                <strong>{currentUser?.email}</strong>
              </div>
              <div>
                <span className="summary-label">Experience</span>
                <span>{currentUser?.years_of_experience || 0} years</span>
              </div>
            </div>
            {currentUser?.bio && (
              <p className="applicant-bio-preview">"{currentUser.bio}"</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cover-letter-input">
              Cover Statement
              <span className="optional-tag">Optional (min 10 characters)</span>
            </label>
            <textarea
              id="cover-letter-input"
              rows={4}
              placeholder="Tell the hiring team why you are interested in this position..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="form-error-alert" role="alert">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplicationModal;
