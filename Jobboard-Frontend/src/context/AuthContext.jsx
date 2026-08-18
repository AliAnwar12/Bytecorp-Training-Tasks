import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authApi from "../api/authApi";
import { extractErrorMessage } from "../api/apiClient";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading"); // 'loading' | 'authenticated' | 'unauthenticated'
  const { addToast } = useToast();

  const loadUser = useCallback(async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      return;
    }

    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
      setAuthStatus("authenticated");
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Listen for session expiry from API interceptor
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      addToast("Your session has expired. Please sign in again.", "info");
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, [loadUser, addToast]);

  const login = async (email, password) => {
    try {
      const tokens = await authApi.login({ email, password });
      if (!tokens.access || !tokens.refresh) {
        throw new Error("Invalid login response from server.");
      }

      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);

      const user = await authApi.getMe();
      setCurrentUser(user);
      setAuthStatus("authenticated");
      addToast(`Welcome back, ${user.name}!`, "success");
      return user;
    } catch (error) {
      const message = extractErrorMessage(error);
      throw new Error(message);
    }
  };

  const register = async (registrationData) => {
    try {
      await authApi.register(registrationData);
      // Auto-login upon successful registration
      return await login(registrationData.email, registrationData.password);
    } catch (error) {
      const message = extractErrorMessage(error);
      throw new Error(message);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore backend logout errors during local cleanup
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      addToast("Signed out successfully.", "info");
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updated = await authApi.updateMe(profileData);
      setCurrentUser(updated);
      addToast("Profile updated successfully.", "success");
      return updated;
    } catch (error) {
      const message = extractErrorMessage(error);
      throw new Error(message);
    }
  };

  const isJobSeeker = currentUser?.role === "job_seeker";
  const isCompanyRep = currentUser?.role === "company_representative";
  const isAdmin = currentUser?.role === "admin";

  const value = {
    currentUser,
    authStatus,
    isAuthenticated: authStatus === "authenticated",
    isJobSeeker,
    isCompanyRep,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
