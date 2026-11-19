/**
 * DocuPing - API Client Module
 * Centralized fetch wrapper for backend communication.
 */

import { CONFIG } from "./config.js";

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getAuthToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  }

  getHeaders(customHeaders = {}, isFormData = false) {
    const headers = { ...customHeaders };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    const config = {
      ...options,
      headers: this.getHeaders(options.headers, isFormData)
    };

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(data?.message || `HTTP Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${options.method || "GET"} ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Fetches a binary resource (e.g. a stored document file) with auth headers.
  async getBlob(endpoint) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = {};
    const token = this.getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      let message = `HTTP Error ${response.status}: ${response.statusText}`;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch (_) { /* ignore malformed body */ }
      }
      console.error(`[API Error] GET ${endpoint}:`, message);
      throw new Error(message);
    }

    return response.blob();
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  // Dedicated helper for Multer document upload (/documents/preview)
  uploadDocument(file) {
    const formData = new FormData();
    formData.append("document", file);
    return this.post(CONFIG.ENDPOINTS.DOCUMENTS.PREVIEW, formData);
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(CONFIG.API_BASE_URL);