import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT access token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and parse standardized backend error structures
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Attempt token refresh once if 401 occurs and refresh token is present
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login/") &&
      !originalRequest.url?.includes("/auth/refresh/")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh/`,
            { refresh: refreshToken }
          );

          if (refreshResponse.data?.access) {
            localStorage.setItem("access_token", refreshResponse.data.access);
            if (refreshResponse.data.refresh) {
              localStorage.setItem("refresh_token", refreshResponse.data.refresh);
            }
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Token refresh failed - clean up and broadcast logout
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.dispatchEvent(new Event("auth-session-expired"));
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from backend error responses.
 * Respects the custom Django exception handler shape: { error: { code, message, details } }
 */
export function extractErrorMessage(error) {
  if (!error) return "An unexpected error occurred.";

  if (error.response?.data?.error) {
    const backendError = error.response.data.error;
    if (backendError.details && typeof backendError.details === "object") {
      const detailEntries = Object.entries(backendError.details);
      if (detailEntries.length > 0) {
        const [field, fieldErrors] = detailEntries[0];
        const msg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
        return `${field !== "detail" && field !== "non_field_errors" ? `${field}: ` : ""}${msg}`;
      }
    }
    return backendError.message || "Request failed.";
  }

  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error.response?.status === 404) {
    return "Resource not found.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status >= 500) {
    return "Server error. Please check that the Django backend is running.";
  }

  if (error.request && !error.response) {
    return "Could not connect to the backend server. Please verify Django is running on port 8000.";
  }

  return error.message || "An unexpected error occurred.";
}

export default apiClient;
