import apiClient from "./apiClient";

export const jobsApi = {
  /**
   * Fetch jobs with optional filtering parameters supported by Django backend
   * Endpoint: GET /api/v1/jobs/
   * Supported query filters: location, status, employment_type, salary_min, salary_max, skill, ordering
   */
  getJobs: async (params = {}) => {
    const queryParams = { ...params };

    if (params.location && typeof params.location === "string") {
      queryParams.location = params.location.trim();
    }
    if (params.status === "all") {
      delete queryParams.status;
    }
    if (params.employment_type === "all") {
      delete queryParams.employment_type;
    }
    if (params.salary_min === "" || params.salary_min === undefined) {
      delete queryParams.salary_min;
    }
    if (params.salary_max === "" || params.salary_max === undefined) {
      delete queryParams.salary_max;
    }
    if (params.skill && typeof params.skill === "string") {
      queryParams.skill = params.skill.trim();
    }

    const response = await apiClient.get("/jobs/", { params: queryParams });
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Get single job by ID
   * Endpoint: GET /api/v1/jobs/{id}/
   */
  getJobById: async (id) => {
    const response = await apiClient.get(`/jobs/${id}/`);
    return response.data;
  },

  /**
   * Create a new job listing
   * Endpoint: POST /api/v1/jobs/
   */
  createJob: async ({
    company_id,
    title,
    description,
    location,
    salary_min,
    salary_max,
    employment_type,
    status = "open",
  }) => {
    const payload = {
      company_id: Number(company_id),
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      salary_min: Number(salary_min),
      salary_max: Number(salary_max),
      employment_type,
      status,
    };
    const response = await apiClient.post("/jobs/", payload);
    return response.data;
  },

  /**
   * Update an existing job
   * Endpoint: PATCH /api/v1/jobs/{id}/
   */
  updateJob: async (id, jobData) => {
    const payload = { ...jobData };
    if (payload.salary_min !== undefined) payload.salary_min = Number(payload.salary_min);
    if (payload.salary_max !== undefined) payload.salary_max = Number(payload.salary_max);
    if (payload.company_id !== undefined) payload.company_id = Number(payload.company_id);

    const response = await apiClient.patch(`/jobs/${id}/`, payload);
    return response.data;
  },

  /**
   * Soft delete a job
   * Endpoint: DELETE /api/v1/jobs/{id}/
   */
  deleteJob: async (id) => {
    const response = await apiClient.delete(`/jobs/${id}/`);
    return response.data;
  },
};

export default jobsApi;
