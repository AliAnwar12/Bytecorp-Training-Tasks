import apiClient from "./apiClient";

export const authApi = {
  /**
   * Register a new user (job_seeker or company_representative)
   * Endpoint: POST /api/v1/auth/register/
   */
  register: async ({ name, email, password, role, bio, years_of_experience }) => {
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || "job_seeker",
    };
    if (bio) payload.bio = bio.trim();
    if (years_of_experience !== undefined && years_of_experience !== "") {
      payload.years_of_experience = Number(years_of_experience);
    }
    const response = await apiClient.post("/auth/register/", payload);
    return response.data;
  },

  /**
   * Login with email and password, returning JWT access and refresh tokens
   * Endpoint: POST /api/v1/auth/login/
   */
  login: async ({ email, password }) => {
    const response = await apiClient.post("/auth/login/", {
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data;
  },

  /**
   * Refresh the access token using the stored refresh token
   * Endpoint: POST /api/v1/auth/refresh/
   */
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post("/auth/refresh/", {
      refresh: refreshToken,
    });
    return response.data;
  },

  /**
   * Logout the current user by blacklisting the refresh token
   * Endpoint: POST /api/v1/auth/logout/
   */
  logout: async (refreshToken) => {
    const response = await apiClient.post("/auth/logout/", {
      refresh: refreshToken,
    });
    return response.data;
  },

  /**
   * Get current authenticated user profile
   * Endpoint: GET /api/v1/auth/me/
   */
  getMe: async () => {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  },

  /**
   * Update current user profile (name, bio, years_of_experience)
   * Endpoint: PATCH /api/v1/auth/me/
   */
  updateMe: async (profileData) => {
    const response = await apiClient.patch("/auth/me/", profileData);
    return response.data;
  },
};

export default authApi;
