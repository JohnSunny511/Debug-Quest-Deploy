import axios from "axios";
import { API_BASE_URL } from "../config/api";

export function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
}

export function isAuthError(errorOrStatus) {
  const status =
    typeof errorOrStatus === "number"
      ? errorOrStatus
      : errorOrStatus?.response?.status;

  return status === 401 || status === 403;
}

export function redirectToLogin(navigate, options = {}) {
  clearStoredSession();

  if (typeof navigate === "function") {
    navigate("/login", { replace: true, ...options });
    return;
  }

  window.location.href = "/login";
}

export async function validateStoredSession(navigate) {
  const token = localStorage.getItem("token");
  if (!token) {
    clearStoredSession();
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response?.data?.username) {
      localStorage.setItem("username", response.data.username);
    }
    if (response?.data?.role) {
      localStorage.setItem("role", response.data.role);
    }

    return true;
  } catch (error) {
    if (isAuthError(error)) {
      redirectToLogin(navigate);
      return false;
    }

    throw error;
  }
}
