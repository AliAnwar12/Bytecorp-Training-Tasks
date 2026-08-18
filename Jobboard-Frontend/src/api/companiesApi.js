import apiClient from "./apiClient";

export const companiesApi = {
  /**
   * Fetch all active companies
   * Endpoint: GET /api/v1/companies/
   */
  getCompanies: async (params = {}) => {
    const response = await apiClient.get("/companies/", { params });
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  /**
   * Get single company by ID
   * Endpoint: GET /api/v1/companies/{id}/
   */
  getCompanyById: async (id) => {
    const response = await apiClient.get(`/companies/${id}/`);
    return response.data;
  },

  /**
   * Create a new company (auto-assigns creating employer as owner)
   * Endpoint: POST /api/v1/companies/
   */
  createCompany: async ({ name, location, description, website }) => {
    const payload = {
      name: name.trim(),
      location: location.trim(),
    };
    if (description) payload.description = description.trim();
    if (website) payload.website = website.trim();

    const response = await apiClient.post("/companies/", payload);
    return response.data;
  },

  /**
   * Update an existing company profile
   * Endpoint: PATCH /api/v1/companies/{id}/
   */
  updateCompany: async (id, companyData) => {
    const response = await apiClient.patch(`/companies/${id}/`, companyData);
    return response.data;
  },

  /**
   * Soft delete a company
   * Endpoint: DELETE /api/v1/companies/{id}/
   */
  deleteCompany: async (id) => {
    const response = await apiClient.delete(`/companies/${id}/`);
    return response.data;
  },
};

export default companiesApi;
