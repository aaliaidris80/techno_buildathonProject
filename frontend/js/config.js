/**
 * DocuPing - Frontend Configuration
 * Centralized settings and backend endpoint mappings.
 */

export const CONFIG = {
  APP_NAME: "DocuPing",
  VERSION: "1.0.0",

  // LOCAL TESTING — switch back to "https://techno-buildathonproject.onrender.com/api" before committing.
  API_BASE_URL: "http://localhost:5000/api",

  // Exact Backend Route Mappings
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      PROTECTED: "/protected"
    },
    DOCUMENTS: {
      PREVIEW: "/documents/preview",
      CONFIRM: "/documents/confirm",
      LIST: "/documents",
      SEARCH: (q) => `/documents/search?q=${encodeURIComponent(q)}`,
      CHECKLIST: "/documents/checklist",
      DETAIL: (id) => `/documents/${id}`,
      UPDATE: (id) => `/documents/${id}`,
      DELETE: (id) => `/documents/${id}`,
      FILE: (id) => `/documents/${id}/file`
    },
    REMINDERS: {
      LIST: "/reminders",
      CREATE: "/reminders",
      UPDATE: (id) => `/reminders/${id}`,
      DELETE: (id) => `/reminders/${id}`
    }
  },

  STORAGE_KEYS: {
    AUTH_TOKEN: "docuping_auth_token",
    USER_DATA: "docuping_user_data",
    THEME: "docuping_theme"
  }
};