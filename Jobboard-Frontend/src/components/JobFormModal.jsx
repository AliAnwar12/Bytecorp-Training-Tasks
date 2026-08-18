import { useState, useEffect } from "react";
import companiesApi from "../api/companiesApi";
import jobsApi from "../api/jobsApi";
import skillsApi from "../api/skillsApi";
import { extractErrorMessage } from "../api/apiClient";
import { useToast } from "../context/ToastContext";

export function JobFormModal({ job = null, onClose, onSuccess }) {
  const isEditing = Boolean(job);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    company_id: job?.company_id || "",
    title: job?.title || "",
    description: job?.description || "",
    location: job?.location || "",
    salary_min: job?.salary_min !== undefined ? job.salary_min : "",
    salary_max: job?.salary_max !== undefined ? job.salary_max : "",
    employment_type: job?.employment_type || "full-time",
    status: job?.status || "open",
  });

  const [companies, setCompanies] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [existingJobSkillMap, setExistingJobSkillMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [compList, skillList] = await Promise.all([
          companiesApi.getCompanies({ mine: "true" }),
          skillsApi.getSkills(),
        ]);
        setCompanies(compList);
        setAllSkills(skillList);

        if (!formData.company_id && compList.length > 0) {
          setFormData((prev) => ({ ...prev, company_id: compList[0].id }));
        }

        if (isEditing && job?.id) {
          const jobSkills = await skillsApi.getJobSkills();
          const currentJobSkills = jobSkills.filter((js) => js.job === job.id);
          const map = {};
          const ids = [];
          currentJobSkills.forEach((js) => {
            map[js.skill] = js.id;
            ids.push(js.skill);
          });
          setExistingJobSkillMap(map);
          setSelectedSkillIds(ids);
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isEditing, job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleSkill = (skillId) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.company_id) {
      setErrorMsg("Please select a company for this listing.");
      return;
    }
    if (Number(formData.salary_max) < Number(formData.salary_min)) {
      setErrorMsg("Maximum salary must be greater than or equal to minimum salary.");
      return;
    }

    try {
      setSubmitting(true);
      let savedJob;

      if (isEditing) {
        savedJob = await jobsApi.updateJob(job.id, formData);
        const toAdd = selectedSkillIds.filter((id) => !existingJobSkillMap[id]);
        const toRemove = Object.keys(existingJobSkillMap)
          .map(Number)
          .filter((id) => !selectedSkillIds.includes(id));

        await Promise.all([
          ...toAdd.map((skillId) => skillsApi.addJobSkill(job.id, skillId)),
          ...toRemove.map((skillId) =>
            skillsApi.removeJobSkill(existingJobSkillMap[skillId])
          ),
        ]);

        addToast("Job listing updated successfully!", "success");
      } else {
        savedJob = await jobsApi.createJob(formData);
        if (selectedSkillIds.length > 0) {
          await Promise.all(
            selectedSkillIds.map((skillId) =>
              skillsApi.addJobSkill(savedJob.id, skillId)
            )
          );
        }
        addToast("Job listing published successfully!", "success");
      }

      if (onSuccess) onSuccess(savedJob);
      onClose();
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Employer Workspace</span>
            <h2 className="modal-title">{isEditing ? "Edit Listing" : "New Job Listing"}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="company-select">Hiring Company</label>
              <select
                id="company-select"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Company</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="job-title-input">Job Title</label>
              <input
                id="job-title-input"
                name="title"
                type="text"
                placeholder="e.g. Senior Systems Engineer"
                value={formData.title}
                onChange={handleChange}
                required
                minLength={3}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="job-location-input">Location</label>
              <input
                id="job-location-input"
                name="location"
                type="text"
                placeholder="e.g. Lahore, Karachi, or Remote"
                value={formData.location}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employment-type-select">Employment Type</label>
              <select
                id="employment-type-select"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                required
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="job-status-select">Status</label>
              <select
                id="job-status-select"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="open">Open (Public)</option>
                <option value="draft">Draft (Private)</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="salary-min-input">Minimum Salary (PKR)</label>
              <input
                id="salary-min-input"
                name="salary_min"
                type="number"
                min="0"
                step="5000"
                placeholder="150000"
                value={formData.salary_min}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="salary-max-input">Maximum Salary (PKR)</label>
              <input
                id="salary-max-input"
                name="salary_max"
                type="number"
                min="0"
                step="5000"
                placeholder="250000"
                value={formData.salary_max}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="job-desc-input">Description & Scope</label>
            <textarea
              id="job-desc-input"
              name="description"
              rows={5}
              placeholder="Describe the mission, responsibilities, and qualifications..."
              value={formData.description}
              onChange={handleChange}
              required
              minLength={10}
            />
          </div>

          {allSkills.length > 0 && (
            <div className="form-group">
              <label>Skills & Technologies</label>
              <div className="skills-selector-grid">
                {allSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      className={`skill-select-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => handleToggleSkill(skill.id)}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              disabled={submitting || loading}
            >
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobFormModal;
