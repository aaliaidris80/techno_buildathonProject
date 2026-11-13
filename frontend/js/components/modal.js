/**
 * DocuPing - Modal Dialog Component
 * Fully accessible, keyboard-trapped modal dialog controller.
 */

import { ICONS } from "../utils/icons.js";

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.previousFocusedElement = null;
    this.init();
  }

  init() {
    // Listen for Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModal) {
        this.close();
      }
    });
  }

  /**
   * Opens a modal with given configuration
   * @param {Object} options
   * @param {string} options.title - Header title text
   * @param {string} options.contentHtml - Body HTML
   * @param {string} [options.footerHtml] - Optional footer buttons HTML
   * @param {Function} [options.onClose] - Callback when modal is closed
   */
  open({ title = "", contentHtml = "", footerHtml = "", onClose = null }) {
    this.close(); // Close any open modal

    this.previousFocusedElement = document.activeElement;
    this.onCloseCallback = onClose;

    const modalEl = document.createElement("div");
    modalEl.className = "modal-backdrop";
    modalEl.id = "docuping-active-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "modal-dialog-title");

    modalEl.innerHTML = `
      <div class="modal-container" role="document">
        <div class="modal-header">
          <h2 class="modal-title" id="modal-dialog-title">${title}</h2>
          <button type="button" class="modal-close-btn" id="modal-close-btn" aria-label="Close dialog">
            ${ICONS.close(20)}
          </button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
      </div>
    `;

    document.body.appendChild(modalEl);
    document.body.style.overflow = "hidden";

    // Trigger animation
    requestAnimationFrame(() => {
      modalEl.classList.add("is-open");
    });

    // Close button, data-modal-close & backdrop handlers
    const closeBtn = modalEl.querySelector("#modal-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    modalEl.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        this.close();
      }
    });

    // Accessible keyboard focus trapping
    modalEl.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const focusables = Array.from(
          modalEl.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    this.activeModal = modalEl;

    // Initial focus on first focusable control
    const initialFocusable = modalEl.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (initialFocusable.length > 0) {
      initialFocusable[0].focus();
    }
  }

  /**
   * Closes active modal
   */
  close() {
    if (!this.activeModal) return;

    const modal = this.activeModal;
    modal.classList.remove("is-open");

    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      document.body.style.overflow = "";

      if (this.previousFocusedElement) {
        this.previousFocusedElement.focus();
      }

      if (typeof this.onCloseCallback === "function") {
        this.onCloseCallback();
      }

      this.activeModal = null;
    }, 240);
  }
}

export const modal = new ModalManager();
