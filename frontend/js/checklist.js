/**
 * DocuPing - Document Checklist
 * Synced with /api/documents/checklist + custom local checklist items
 */

import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { createSidebar, initSidebar } from "./components/index.js";

const STORAGE_KEY = "docuping_checklist_custom_v1";

const DEFAULT_DOCUMENTS = [
  { id: "academic-1", key: "class_10_marksheet", name: "Class 10 Marksheet", category: "Academic", description: "Your Class 10 board examination marksheet.", completed: false, custom: false },
  { id: "academic-2", key: "class_12_marksheet", name: "Class 12 Marksheet", category: "Academic", description: "Your Class 12 board examination marksheet.", completed: false, custom: false },
  { id: "academic-3", key: "college_id", name: "College ID Card", category: "Academic", description: "Your current college identity card.", completed: false, custom: false },
  { id: "academic-4", key: "fee_receipt", name: "College Fee Receipts", category: "Academic", description: "Important college fee payment receipts.", completed: false, custom: false },
  { id: "academic-5", key: "transfer_certificate", name: "Transfer Certificate", category: "Academic", description: "Your previous institution's transfer certificate.", completed: false, custom: false },
  { id: "career-1", key: "resume", name: "Updated Resume", category: "Career", description: "Keep your latest resume ready for opportunities.", completed: false, custom: false },
  { id: "career-2", key: "internship_certificate", name: "Internship Certificates", category: "Career", description: "Certificates from completed internships.", completed: false, custom: false },
  { id: "career-3", key: "experience_letter", name: "Experience Letters", category: "Career", description: "Letters confirming your work experience.", completed: false, custom: false },
  { id: "achievements-1", key: "hackathon_certificate", name: "Hackathon Certificates", category: "Achievements", description: "Certificates from hackathons and competitions.", completed: false, custom: false },
  { id: "achievements-2", key: "course_certificate", name: "Course Completion Certificates", category: "Achievements", description: "Certificates from online courses and workshops.", completed: false, custom: false },
  { id: "achievements-3", key: "club_certificate", name: "Club Participation Certificates", category: "Achievements", description: "Certificates from college clubs and events.", completed: false, custom: false },
  { id: "health-1", key: "medical_report", name: "Medical Reports", category: "Health", description: "Keep important medical reports organized.", completed: false, custom: false },
  { id: "health-2", key: "prescription", name: "Prescriptions", category: "Health", description: "Important prescriptions from doctors.", completed: false, custom: false },
  { id: "finance-1", key: "scholarship_doc", name: "Scholarship Documents", category: "Finance", description: "Documents required for scholarship applications.", completed: false, custom: false },
  { id: "finance-2", key: "bank_details", name: "Bank Account Details", category: "Finance", description: "Important student bank account records.", completed: false, custom: false }
];

document.addEventListener("DOMContentLoaded", initChecklist);

async function initChecklist() {
  const sidebarMount = document.getElementById("sidebar-mount");
  if (sidebarMount) {
    sidebarMount.innerHTML = createSidebar("document-checklist", "../");
    initSidebar();
  }

  const checklistItems = document.getElementById("checklist-items");
  const readinessPercentage = document.getElementById("readiness-percentage");
  const circlePercentage = document.getElementById("circle-percentage");
  const readinessMessage = document.getElementById("readiness-message");
  const progressFill = document.getElementById("progress-fill");
  const readinessCircle = document.getElementById("readiness-circle");

  const completedCount = document.getElementById("completed-count");
  const missingCount = document.getElementById("missing-count");
  const totalCount = document.getElementById("total-count");
  const listHeading = document.getElementById("list-heading");

  const addButton = document.getElementById("open-add-document");
  const closeButton = document.getElementById("close-add-document");
  const cancelButton = document.getElementById("cancel-add-document");
  const addPanel = document.getElementById("add-document-panel");
  const addForm = document.getElementById("add-document-form");

  const nameInput = document.getElementById("custom-document-name");
  const categoryInput = document.getElementById("custom-document-category");
  const descriptionInput = document.getElementById("custom-document-description");
  const formMessage = document.getElementById("checklist-form-message");
  const toast = document.getElementById("checklist-toast");

  let documents = DEFAULT_DOCUMENTS.map((doc) => ({ ...doc }));
  let backendReadiness = null;
  let activeCategory = "All";
  let activeFilter = "all";
  let toastTimer;

  // Merge any custom local items
  try {
    const customSaved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(customSaved) && customSaved.length > 0) {
      documents = [...documents, ...customSaved];
    }
  } catch (e) {}

  // Sync live status from Backend (/api/documents/checklist + /api/documents)
  async function syncWithBackend() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      const [checklistRes, docsRes] = await Promise.all([
        api.get(CONFIG.ENDPOINTS.DOCUMENTS.CHECKLIST),
        api.get(CONFIG.ENDPOINTS.DOCUMENTS.LIST)
      ]);

      const uploadedDocs = docsRes.documents || [];
      const uploadedKeys = new Set(
        uploadedDocs.map((d) => (d.checklistKey || "").toLowerCase())
      );
      const uploadedTitles = uploadedDocs.map((d) => (d.title || "").toLowerCase());

      // If backend returns structured checklist array, map its completed items
      if (Array.isArray(checklistRes.checklist)) {
        checklistRes.checklist.forEach((item) => {
          const itemKey = (item.key || item.checklistKey || "").toLowerCase();
          const itemName = (item.name || item.title || "").toLowerCase();
          const isDone = Boolean(item.completed || item.uploaded || item.status === "uploaded");

          const existing = documents.find(
            (d) => (d.key && d.key.toLowerCase() === itemKey) || d.name.toLowerCase() === itemName
          );
          if (existing) {
            existing.completed = isDone;
          } else if (itemName) {
            documents.unshift({
              id: `srv-${itemKey || Math.random().toString(16).slice(2)}`,
              key: itemKey,
              name: item.name || item.title,
              category: item.category || "Academic",
              description: item.description || "Required core student document.",
              completed: isDone,
              custom: false
            });
          }
        });
      }

      // Also mark matching documents completed based on uploaded vault documents
      documents.forEach((doc) => {
        if (doc.key && uploadedKeys.has(doc.key.toLowerCase())) {
          doc.completed = true;
        } else if (uploadedTitles.some((t) => t.includes(doc.name.toLowerCase()) || doc.name.toLowerCase().includes(t))) {
          doc.completed = true;
        }
      });

      if (checklistRes.readiness !== undefined) {
        backendReadiness = typeof checklistRes.readiness === "number"
          ? checklistRes.readiness
          : (checklistRes.readiness.percentage ?? checklistRes.readiness.score ?? null);
      }
    } catch (err) {
      console.warn("Checklist backend sync skipped:", err.message);
    }
  }

  function saveCustomDocuments() {
    try {
      const customOnly = documents.filter((d) => d.custom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
      return true;
    } catch (error) {
      showToast("Unable to save changes.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function getCategoryIcon(category) {
    return { Academic: "🎓", Career: "💼", Achievements: "🏆", Health: "🩺", Finance: "💳" }[category] || "📄";
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function updateProgress() {
    const total = documents.length;
    const completed = documents.filter((doc) => doc.completed).length;
    const missing = total - completed;

    const percentage = backendReadiness !== null
      ? Math.round(backendReadiness)
      : (total > 0 ? Math.round((completed / total) * 100) : 0);

    if (readinessPercentage) readinessPercentage.textContent = `${percentage}%`;
    if (circlePercentage) circlePercentage.textContent = `${percentage}%`;
    if (completedCount) completedCount.textContent = completed;
    if (missingCount) missingCount.textContent = missing;
    if (totalCount) totalCount.textContent = total;
    if (progressFill) progressFill.style.width = `${percentage}%`;

    const degrees = percentage * 3.6;
    if (readinessCircle) {
      readinessCircle.style.background = `conic-gradient(#1e4538 0deg, #1e4538 ${degrees}deg, #e9eee9 ${degrees}deg, #e9eee9 360deg)`;
    }

    if (readinessMessage) {
      if (percentage === 100 && total > 0) {
        readinessMessage.textContent = "Amazing! All your checklist documents are ready.";
      } else if (percentage >= 50) {
        readinessMessage.textContent = "Great progress! You're more than halfway there.";
      } else {
        readinessMessage.textContent = "Upload documents in My Vault to automatically boost your readiness score.";
      }
    }
  }

  function updateCategoryCounts() {
    const categories = ["Academic", "Career", "Achievements", "Health", "Finance"];
    const allEl = document.getElementById("category-all-count");
    if (allEl) allEl.textContent = documents.length;

    categories.forEach((category) => {
      const count = documents.filter((doc) => doc.category === category).length;
      const el = document.getElementById(`category-${category.toLowerCase()}-count`);
      if (el) el.textContent = count;
    });
  }

  function updateButtons() {
    document.querySelectorAll(".category-card").forEach((button) => {
      const active = button.dataset.category === activeCategory;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll(".check-filter").forEach((button) => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderChecklist() {
    updateProgress();
    updateCategoryCounts();
    updateButtons();

    const filteredDocuments = documents.filter((doc) => {
      const matchesCategory = activeCategory === "All" || doc.category === activeCategory;
      const matchesStatus =
        activeFilter === "all" ||
        (activeFilter === "completed" && doc.completed) ||
        (activeFilter === "missing" && !doc.completed);
      return matchesCategory && matchesStatus;
    });

    if (listHeading) {
      listHeading.textContent = activeCategory === "All" ? "All Documents" : `${activeCategory} Documents`;
    }

    if (filteredDocuments.length === 0) {
      checklistItems.innerHTML = `
        <div class="checklist-empty">
          <div class="checklist-empty-icon">📋</div>
          <h3>No documents found</h3>
          <p>Try selecting another filter or upload documents in My Vault.</p>
        </div>
      `;
      return;
    }

    checklistItems.innerHTML = filteredDocuments.map((doc) => `
      <article class="checklist-item ${doc.completed ? "completed" : ""}">
        <div class="checklist-item-main">
          <input
            type="checkbox"
            class="checklist-checkbox"
            data-action="toggle"
            data-id="${escapeHTML(doc.id)}"
            ${doc.completed ? "checked" : ""}
          >
          <div class="checklist-item-icon">${getCategoryIcon(doc.category)}</div>
          <div class="checklist-item-details">
            <h3>${escapeHTML(doc.name)}</h3>
            <p>${escapeHTML(doc.description || doc.category)}</p>
          </div>
        </div>
        <div class="checklist-item-right">
          <span class="document-status ${doc.completed ? "completed" : "missing"}">
            ${doc.completed ? "✓ Completed" : "Missing"}
          </span>
          ${doc.custom ? `
            <button type="button" class="delete-custom-document" data-action="delete" data-id="${escapeHTML(doc.id)}">×</button>
          ` : ""}
        </div>
      </article>
    `).join("");
  }

  document.querySelectorAll(".category-card").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      activeFilter = "all";
      renderChecklist();
    });
  });

  document.querySelectorAll(".check-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      renderChecklist();
    });
  });

  checklistItems.addEventListener("change", (event) => {
    const checkbox = event.target.closest('[data-action="toggle"]');
    if (!checkbox) return;

    const idx = documents.findIndex((doc) => String(doc.id) === String(checkbox.dataset.id));
    if (idx === -1) return;

    documents[idx].completed = checkbox.checked;
    backendReadiness = null; // Recalculate dynamically on manual toggle
    saveCustomDocuments();
    showToast(checkbox.checked ? "Document marked as completed!" : "Document marked as missing.");
    renderChecklist();
  });

  checklistItems.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;

    const idx = documents.findIndex((doc) => String(doc.id) === String(button.dataset.id));
    if (idx === -1) return;

    documents.splice(idx, 1);
    saveCustomDocuments();
    showToast("Custom document deleted.");
    renderChecklist();
  });

  function openAddForm() {
    if (!addPanel) return;
    addPanel.hidden = false;
    formMessage.textContent = "";
    addPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput?.focus();
  }

  function closeAddForm() {
    if (!addPanel) return;
    addPanel.hidden = true;
    addForm?.reset();
    formMessage.textContent = "";
  }

  addButton?.addEventListener("click", openAddForm);
  closeButton?.addEventListener("click", closeAddForm);
  cancelButton?.addEventListener("click", closeAddForm);

  addForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const description = descriptionInput.value.trim();

    if (!name || !category) {
      formMessage.textContent = "Please enter a document name and select a category.";
      return;
    }

    documents.push({
      id: `custom-${Date.now()}`,
      name,
      category,
      description: description || `${category} document.`,
      completed: false,
      custom: true
    });

    saveCustomDocuments();
    closeAddForm();
    activeCategory = category;
    activeFilter = "all";
    renderChecklist();
    showToast("Custom document added successfully!");
  });

  await syncWithBackend();
  renderChecklist();
}