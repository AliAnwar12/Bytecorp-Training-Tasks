import apiClient from "./apiClient";

export const skillsApi = {
  /**
   * Fetch all global platform skills
   * Endpoint: GET /api/v1/skills/
   */
  getSkills: async () => {
    const response = await apiClient.get("/skills/");
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Create a new platform skill (Admin only)
   * Endpoint: POST /api/v1/skills/
   */
  createSkill: async (name) => {
    const response = await apiClient.post("/skills/", { name: name.trim() });
    return response.data;
  },

  /**
   * Fetch current user's attached skills
   * Endpoint: GET /api/v1/my-skills/
   */
  getMySkills: async () => {
    const response = await apiClient.get("/my-skills/");
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Add a skill to the current user's profile
   * Endpoint: POST /api/v1/my-skills/
   */
  addMySkill: async (skillId) => {
    const response = await apiClient.post("/my-skills/", { skill: Number(skillId) });
    return response.data;
  },

  /**
   * Remove a skill from the current user's profile
   * Endpoint: DELETE /api/v1/my-skills/{id}/
   */
  removeMySkill: async (userSkillId) => {
    const response = await apiClient.delete(`/my-skills/${userSkillId}/`);
    return response.data;
  },

  /**
   * Fetch all job-skill links
   * Endpoint: GET /api/v1/job-skills/
   */
  getJobSkills: async () => {
    const response = await apiClient.get("/job-skills/");
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Link a skill to a job (Employer / Admin only)
   * Endpoint: POST /api/v1/job-skills/
   */
  addJobSkill: async (jobId, skillId) => {
    const response = await apiClient.post("/job-skills/", {
      job: Number(jobId),
      skill: Number(skillId),
    });
    return response.data;
  },

  /**
   * Remove a skill link from a job (Employer / Admin only)
   * Endpoint: DELETE /api/v1/job-skills/{id}/
   */
  removeJobSkill: async (jobSkillId) => {
    const response = await apiClient.delete(`/job-skills/${jobSkillId}/`);
    return response.data;
  },
};

export default skillsApi;
