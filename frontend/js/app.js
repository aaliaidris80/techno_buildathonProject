/**
 * DocuPing - Main Application Entry Point
 * Demonstrates and wires up the foundational design system components.
 */

import {
  initSidebar,
  initTopBar,
  createSidebar,
  createTopBar,
  createVaultCard,
  createDocumentCard,
  createStatusBadge,
  createFormField,
  modal,
  toast,
  ICONS
} from "./components/index.js";

document.addEventListener("DOMContentLoaded", () => {
  initDesignSystemShowcase();
});

function initDesignSystemShowcase() {
  // 1. Mount Mobile Topbar toggle listener & AppSidebar
  const sidebarContainer = document.getElementById("sidebar-mount");
  if (sidebarContainer) {
    sidebarContainer.innerHTML = createSidebar("overview");
    initSidebar();
  }

  // 2. Mount TopBar with search & actions
  const topbarContainer = document.getElementById("topbar-mount");
  if (topbarContainer) {
    topbarContainer.innerHTML = createTopBar({
      showSearch: true,
      searchPlaceholder: "Search documents...",
      userInitial: "A"
    });

    initTopBar({
      onSearch: (query) => {
        console.log(`[Search query] "${query}"`);
      },
      onNotificationClick: () => {
        toast.show({
          message: "You have 2 pending document expiry reminders.",
          type: "warning"
        });
      }
    });
  }

  // 3. Mount Vault Category Cards (from Screenshot 3)
  const vaultsContainer = document.getElementById("vaults-grid");
  if (vaultsContainer) {
    const vaults = [
      { id: "academic", title: "Academic", description: "Marksheets, ID", icon: "academic" },
      { id: "career", title: "Career", description: "Resume, Internships", icon: "career" },
      { id: "achievements", title: "Achievements", description: "Certificates", icon: "achievements" },
      { id: "health", title: "Health", description: "Reports, Meds", icon: "health" }
    ];

    vaultsContainer.innerHTML = vaults.map((v) => createVaultCard(v)).join("");
  }

  // 4. Mount Sample Document Cards (from Screenshots 4 & 5)
  const docsContainer = document.getElementById("docs-grid");
  if (docsContainer) {
    const docs = [
      { id: "doc-1", name: "Semester Marksheet.pdf", type: "pdf", date: "12 Oct 2025" },
      { id: "doc-2", name: "ICPC Certificate.pdf", type: "pdf", date: "08 Oct 2025" },
      { id: "doc-3", name: "Resume.pdf", type: "doc", date: "05 Oct 2025" }
    ];

    docsContainer.innerHTML = docs.map((d) => createDocumentCard(d)).join("");

    // Delegate menu and card clicks
    docsContainer.addEventListener("click", (e) => {
      const menuBtn = e.target.closest('[data-action="menu"]');
      if (menuBtn) {
        e.stopPropagation();
        const card = menuBtn.closest(".doc-card");
        toast.show({
          message: `Options for "${card?.querySelector(".doc-card-title")?.textContent}" clicked.`,
          type: "info"
        });
      }
    });
  }

  // 5. Mount Demo Action Listeners (Modal & Toast Triggers)
  setupDemoInteractions();
}

function setupDemoInteractions() {
  const triggerModalBtn = document.getElementById("btn-trigger-modal");
  const triggerToastBtn = document.getElementById("btn-trigger-toast");

  if (triggerModalBtn) {
    triggerModalBtn.addEventListener("click", () => {
      const formHtml = `
        <form id="sample-add-reminder-form" style="display: flex; flex-direction: column; gap: var(--spacing-md);">
          ${createFormField({
            id: "reminder-doc-name",
            label: "Document Name",
            placeholder: "e.g. College ID Card",
            required: true,
            icon: "file"
          })}

          ${createFormField({
            id: "reminder-doc-type",
            label: "Document Type",
            type: "select",
            required: true,
            placeholder: "Select Type",
            icon: "checklist",
            options: [
              { value: "academic", label: "Academic (Marksheet/ID)" },
              { value: "career", label: "Career (Resume/Offer)" },
              { value: "achievements", label: "Achievements & Certificates" },
              { value: "health", label: "Health & Medical" }
            ]
          })}

          ${createFormField({
            id: "reminder-expiry-date",
            label: "Expiry Date",
            type: "date",
            required: true,
            icon: "calendar"
          })}
        </form>
      `;

      const footerHtml = `
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="button" class="btn btn-primary" id="modal-submit-btn">Add Reminder</button>
      `;

      modal.open({
        title: "Add Document Reminder",
        contentHtml: formHtml,
        footerHtml: footerHtml
      });

      // Submit inside modal
      setTimeout(() => {
        const submitBtn = document.getElementById("modal-submit-btn");
        if (submitBtn) {
          submitBtn.addEventListener("click", () => {
            const docNameInput = document.getElementById("reminder-doc-name");
            const name = docNameInput?.value?.trim() || "Document";
            modal.close();
            toast.success(`Reminder for "${name}" added successfully!`);
          });
        }
      }, 50);
    });
  }

  if (triggerToastBtn) {
    triggerToastBtn.addEventListener("click", () => {
      toast.success("Design system tokens and components loaded successfully!");
    });
  }
}

// Global modal reference for inline modal footer button
window.DocuPingModal = modal;
