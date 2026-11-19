/**
 * DocuPing - Frontend Configuration
 * Centralized settings and backend endpoint mappings.
 */

// When the frontend is opened from this machine (e.g. via ./run-local.sh),
// talk to the local backend; everywhere else, use the Render production API.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
const IS_LOCAL = LOCAL_HOSTS.includes(window.location.hostname);

export const CONFIG = {
  APP_NAME: "DocuPing",
  VERSION: "1.0.0",

  API_BASE_URL: IS_LOCAL
    ? "http://localhost:5000/api"
    : "https://techno-buildathonproject.onrender.com/api",

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
