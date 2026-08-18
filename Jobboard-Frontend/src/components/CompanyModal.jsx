import { useState } from "react";
import companiesApi from "../api/companiesApi";
import { extractErrorMessage } from "../api/apiClient";
import { useToast } from "../context/ToastContext";

export function CompanyModal({ company = null, onClose, onSuccess }) {
  const isEditing = Boolean(company);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: company?.name || "",
    location: company?.location || "",
    website: company?.website || "",
    description: company?.description || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      setSubmitting(true);
      let savedCompany;

      if (isEditing) {
        savedCompany = await companiesApi.updateCompany(company.id, formData);
        addToast("Company profile updated.", "success");
      } else {
        savedCompany = await companiesApi.createCompany(formData);
        addToast("Company registered successfully.", "success");
      }

      if (onSuccess) onSuccess(savedCompany);
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
            <span className="modal-eyebrow">Employer Profile</span>
            <h2 className="modal-title">{isEditing ? "Edit Company Profile" : "Register Company"}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="company-name-input">Company Name</label>
            <input
              id="company-name-input"
              name="name"
              type="text"
              placeholder="e.g. Acme Corporation"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="company-location-input">Headquarters</label>
              <input
                id="company-location-input"
                name="location"
                type="text"
                placeholder="e.g. New York, NY"
                value={formData.location}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="company-website-input">
                Website
                <span className="optional-tag">Optional</span>
              </label>
              <input
                id="company-website-input"
                name="website"
                type="url"
                placeholder="https://company.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company-desc-input">
              About
              <span className="optional-tag">Optional</span>
            </label>
            <textarea
              id="company-desc-input"
              name="description"
              rows={3}
              placeholder="Describe your mission and engineering culture..."
              value={formData.description}
              onChange={handleChange}
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
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyModal;
