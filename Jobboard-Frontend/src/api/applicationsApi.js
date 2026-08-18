import apiClient from "./apiClient";

export const applicationsApi = {
  /**
   * Submit an application for an open job
   * Endpoint: POST /api/v1/jobs/{job_id}/applications/
   */
  applyToJob: async (jobId, { cover_letter }) => {
    const payload = {};
    if (cover_letter && cover_letter.trim()) {
      payload.cover_letter = cover_letter.trim();
    }
    const response = await apiClient.post(`/jobs/${jobId}/applications/`, payload);
    return response.data;
  },

  /**
   * Fetch applications submitted by current job seeker
   * Endpoint: GET /api/v1/applications/me/
   */
  getMyApplications: async () => {
    const response = await apiClient.get("/applications/me/");
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Fetch all applications for a specific job (Employer / Admin only)
   * Endpoint: GET /api/v1/jobs/{job_id}/applications/list/
   */
  getJobApplications: async (jobId) => {
    const response = await apiClient.get(`/jobs/${jobId}/applications/list/`);
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Update the status of an application (Employer / Admin only)
   * Allowed statuses: 'pending', 'reviewed', 'shortlisted', 'rejected'
   * Endpoint: PATCH /api/v1/job-applications/{id}/status/
   */
  updateApplicationStatus: async (applicationId, status) => {
    const response = await apiClient.patch(`/job-applications/${applicationId}/status/`, {
      status,
    });
    return response.data;
  },

  /**
   * Withdraw / soft delete an application
   * Endpoint: DELETE /api/v1/job-applications/{id}/
   */
  deleteApplication: async (applicationId) => {
    const response = await apiClient.delete(`/job-applications/${applicationId}/`);
    return response.data;
  },
};

export default applicationsApi;
