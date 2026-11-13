/**
 * DocuPing - Frontend Configuration
 * Centralized settings and backend endpoint mappings.
 */

export const CONFIG = {
  APP_NAME: "DocuPing",
  VERSION: "1.0.0",
  
  // Backend API Base URL (adjust according to your team's backend port/host)
  API_BASE_URL: "http://localhost:5000/api",

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      ME: "/auth/me"
    },
    DOCUMENTS: {
      LIST: "/documents",
      DETAIL: (id) => `/documents/${id}`,
      CREATE: "/documents",
      UPDATE: (id) => `/documents/${id}`,
      DELETE: (id) => `/documents/${id}`
    },
    NOTIFICATIONS: {
      LIST: "/notifications",
      MARK_READ: (id) => `/notifications/${id}/read`
    }
  },

  // Storage keys for localStorage / sessionStorage
  STORAGE_KEYS: {
    AUTH_TOKEN: "docuping_auth_token",
    USER_DATA: "docuping_user_data",
    THEME: "docuping_theme"
  }
};
