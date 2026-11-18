/**
 * DocuPing - TopBar Component
 * In-page header with search input, notifications, and user avatar.
 */

import { ICONS } from "../utils/icons.js";

/**
 * Generates HTML string for TopBar
 * @param {Object} options
 * @param {boolean} options.showSearch - Whether to render search input
 * @param {string} options.searchPlaceholder - Placeholder text for search input
 * @param {string} options.userInitial - Letter displayed in user avatar
 */
export function createTopBar({
  showSearch = true,
  searchPlaceholder = "Search documents...",
  userInitial = "A"
} = {}) {
  const searchHtml = showSearch
    ? `
      <div class="topbar-search-container">
        <div class="input-container">
          <span class="input-icon-left">${ICONS.search(18)}</span>
          <input 
            type="search" 
            class="topbar-search-input form-input has-icon-left" 
            id="topbar-search" 
            placeholder="${searchPlaceholder}"
            aria-label="Search" 
          />
        </div>
      </div>
    `
    : `<div class="topbar-search-container"></div>`;

  return `
    <header class="topbar" id="app-topbar">
      ${searchHtml}

      <div class="topbar-actions">
        <button class="topbar-btn" id="notifications-btn" aria-label="Notifications">
          ${ICONS.bell(20)}
        </button>

        <a href="pages/settings.html" class="user-avatar" id="user-avatar" aria-label="User Profile">${userInitial}</a>
      </div>
    </header>
  `;
}

/**
 * Initializes TopBar event listeners (search typing, notification click)
 */
export function initTopBar({ onSearch, onNotificationClick } = {}) {
  const searchInput = document.getElementById("topbar-search");
  const notifBtn = document.getElementById("notifications-btn");

  if (searchInput && onSearch) {
    searchInput.addEventListener("input", (e) => {
      onSearch(e.target.value.trim());
    });
  }

  if (notifBtn && onNotificationClick) {
    notifBtn.addEventListener("click", onNotificationClick);
  }
}
