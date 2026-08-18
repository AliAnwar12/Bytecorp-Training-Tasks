import apiClient from "./apiClient";

export const auditApi = {
  /**
   * Fetch audit trail logs (Admin only)
   * Endpoint: GET /api/v1/audit-logs/
   * Optional query filters: action, model_name, object_id, actor, request_id
   */
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get("/audit-logs/", { params });
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },
};

export default auditApi;
