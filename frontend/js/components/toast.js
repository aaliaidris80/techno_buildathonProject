/**
 * DocuPing - Toast Notifications Component
 * Floating non-blocking feedback notifications.
 */

import { ICONS } from "../utils/icons.js";

class ToastManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      this.container.setAttribute("aria-live", "polite");
      this.container.setAttribute("aria-atomic", "true");
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  /**
   * Displays a toast notification
   * @param {Object} options
   * @param {string} options.message - Notification text
   * @param {'success' | 'warning' | 'danger' | 'info'} [options.type='success']
   * @param {number} [options.duration=3500] - Duration in ms before auto-dismiss
   */
  show({ message, type = "success", duration = 3500 }) {
    const container = this.ensureContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = ICONS.check(20);
    if (type === "warning") iconSvg = ICONS.bell(20);
    if (type === "danger") iconSvg = ICONS.close(20);
    if (type === "info") iconSvg = ICONS.checklist(20);

    toast.innerHTML = `
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-message">${message}</span>
      <button type="button" class="toast-close" aria-label="Dismiss notification">
        ${ICONS.close(14)}
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    const closeBtn = toast.querySelector(".toast-close");
    let timer = null;

    const dismiss = () => {
      clearTimeout(timer);
      toast.classList.remove("is-visible");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    };

    closeBtn.addEventListener("click", dismiss);

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }
  }

  success(message, duration) {
    this.show({ message, type: "success", duration });
  }

  warning(message, duration) {
    this.show({ message, type: "warning", duration });
  }

  info(message, duration) {
    this.show({ message, type: "info", duration });
  }

  error(message, duration) {
    this.show({ message, type: "danger", duration });
  }
}

export const toast = new ToastManager();
