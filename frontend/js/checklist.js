
/**
 * DocuPing - Document Checklist
 * Handles document categories, progress, filters and custom documents.
 */

import { createSidebar, initSidebar } from "./components/index.js";

const STORAGE_KEY = "docuping_checklist_v1";

// Default student document checklist
const DEFAULT_DOCUMENTS = [
  {
    id: "academic-1",
    name: "Class 10 Marksheet",
    category: "Academic",
    description: "Your Class 10 board examination marksheet.",
    completed: false,
    custom: false
  },
  {
    id: "academic-2",
    name: "Class 12 Marksheet",
    category: "Academic",
    description: "Your Class 12 board examination marksheet.",
    completed: false,
    custom: false
  },
  {
    id: "academic-3",
    name: "College ID Card",
    category: "Academic",
    description: "Your current college identity card.",
    completed: false,
    custom: false
  },
  {
    id: "academic-4",
    name: "College Fee Receipts",
    category: "Academic",
    description: "Important college fee payment receipts.",
    completed: false,
    custom: false
  },
  {
    id: "academic-5",
    name: "Transfer Certificate",
    category: "Academic",
    description: "Your previous institution's transfer certificate.",
    completed: false,
    custom: false
  },
  {
    id: "career-1",
    name: "Updated Resume",
    category: "Career",
    description: "Keep your latest resume ready for opportunities.",
    completed: false,
    custom: false
  },
  {
    id: "career-2",
    name: "Internship Certificates",
    category: "Career",
    description: "Certificates from completed internships.",
    completed: false,
    custom: false
  },
  {
    id: "career-3",
    name: "Experience Letters",
    category: "Career",
    description: "Letters confirming your work experience.",
    completed: false,
    custom: false
  },
  {
    id: "achievements-1",
    name: "Hackathon Certificates",
    category: "Achievements",
    description: "Certificates from hackathons and competitions.",
    completed: false,
    custom: false
  },
  {
    id: "achievements-2",
    name: "Course Completion Certificates",
    category: "Achievements",
    description: "Certificates from online courses and workshops.",
    completed: false,
    custom: false
  },
  {
    id: "achievements-3",
    name: "Club Participation Certificates",
    category: "Achievements",
    description: "Certificates from college clubs and events.",
    completed: false,
    custom: false
  },
  {
    id: "health-1",
    name: "Medical Reports",
    category: "Health",
    description: "Keep important medical reports organized.",
    completed: false,
    custom: false
  },
  {
    id: "health-2",
    name: "Prescriptions",
    category: "Health",
    description: "Important prescriptions from doctors.",
    completed: false,
    custom: false
  },
  {
    id: "finance-1",
    name: "Scholarship Documents",
    category: "Finance",
    description: "Documents required for scholarship applications.",
    completed: false,
    custom: false
  },
  {
    id: "finance-2",
    name: "Bank Account Details",
    category: "Finance",
    description: "Important student bank account records.",
    completed: false,
    custom: false
  }
];

document.addEventListener("DOMContentLoaded", initChecklist);

function initChecklist() {

  // 1. Initialize Sidebar
  const sidebarMount = document.getElementById("sidebar-mount");

  if (sidebarMount) {
    sidebarMount.innerHTML = createSidebar("document-checklist", "../");
    initSidebar();
  }

  // 2. Get HTML Elements
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

  // 3. Load Saved Documents
  function loadDocuments() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return DEFAULT_DOCUMENTS.map((doc) => ({ ...doc }));
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return DEFAULT_DOCUMENTS.map((doc) => ({ ...doc }));
      }

      return parsed;
    } catch (error) {
      console.error("Unable to load checklist:", error);
      return DEFAULT_DOCUMENTS.map((doc) => ({ ...doc }));
    }
  }

  let documents = loadDocuments();

  let activeCategory = "All";
  let activeFilter = "all";
  let toastTimer;

  // 4. Save Documents
  function saveDocuments() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
      return true;
    } catch (error) {
      console.error("Unable to save checklist:", error);
      showToast("Unable to save changes. Check browser storage.");
      return false;
    }
  }

  // 5. Helper: Escape HTML
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  // 6. Category Icons
  function getCategoryIcon(category) {
    const icons = {
      Academic: "🎓",
      Career: "💼",
      Achievements: "🏆",
      Health: "🩺",
      Finance: "💳"
    };

    return icons[category] || "📄";
  }

  // 7. Show Toast
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  // 8. Calculate Overall Progress
  function updateProgress() {
    const total = documents.length;

    const completed = documents.filter(
      (doc) => doc.completed
    ).length;

    const missing = total - completed;

    const percentage = total > 0
      ? Math.round((completed / total) * 100)
      : 0;

    readinessPercentage.textContent = `${percentage}%`;
    circlePercentage.textContent = `${percentage}%`;

    completedCount.textContent = completed;
    missingCount.textContent = missing;
    totalCount.textContent = total;

    progressFill.style.width = `${percentage}%`;

    const degrees = percentage * 3.6;

    readinessCircle.style.background = `
      conic-gradient(
        #1e4538 0deg,
        #1e4538 ${degrees}deg,
        #e9eee9 ${degrees}deg,
        #e9eee9 360deg
      )
    `;

    if (percentage === 100 && total > 0) {
      readinessMessage.textContent =
        "Amazing! All your checklist documents are ready.";
    } else if (percentage >= 50) {
      readinessMessage.textContent =
        "Great progress! You're more than halfway there.";
    } else {
      readinessMessage.textContent =
        "Keep going! Complete your essential document checklist.";
    }
  }

  // 9. Update Category Counts
  function updateCategoryCounts() {
    const categories = [
      "Academic",
      "Career",
      "Achievements",
      "Health",
      "Finance"
    ];

    document.getElementById("category-all-count").textContent =
      documents.length;

    categories.forEach((category) => {
      const count = documents.filter(
        (doc) => doc.category === category
      ).length;

      const elementId = `category-${category.toLowerCase()}-count`;

      document.getElementById(elementId).textContent = count;
    });
  }

  // 10. Update Active Buttons
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

  // 11. Render Checklist
  function renderChecklist() {

    updateProgress();
    updateCategoryCounts();
    updateButtons();

    let filteredDocuments = documents.filter((doc) => {

      const matchesCategory =
        activeCategory === "All" ||
        doc.category === activeCategory;

      const matchesStatus =
        activeFilter === "all" ||
        (activeFilter === "completed" && doc.completed) ||
        (activeFilter === "missing" && !doc.completed);

      return matchesCategory && matchesStatus;
    });

    listHeading.textContent =
      activeCategory === "All"
        ? "All Documents"
        : `${activeCategory} Documents`;

    if (filteredDocuments.length === 0) {
      let message = "No documents found.";
      let description = "Try selecting another filter.";

      if (activeFilter === "completed") {
        message = "No completed documents yet.";
        description = "Mark a document as completed to see it here.";
      }

      if (activeFilter === "missing") {
        message = "All caught up!";
        description = "There are no missing documents in this category.";
      }

      checklistItems.innerHTML = `
        <div class="checklist-empty">
          <div class="checklist-empty-icon">📋</div>
          <h3>${message}</h3>
          <p>${description}</p>
        </div>
      `;

      return;
    }

    checklistItems.innerHTML = filteredDocuments.map((doc) => {

      return `
        <article class="checklist-item ${doc.completed ? "completed" : ""}">

          <div class="checklist-item-main">

            <input
              type="checkbox"
              class="checklist-checkbox"
              data-action="toggle"
              data-id="${escapeHTML(doc.id)}"
              ${doc.completed ? "checked" : ""}
              aria-label="Mark ${escapeHTML(doc.name)} as ${doc.completed ? "missing" : "completed"}"
            >

            <div class="checklist-item-icon">
              ${getCategoryIcon(doc.category)}
            </div>

            <div class="checklist-item-details">
              <h3>${escapeHTML(doc.name)}</h3>
              <p>
                ${escapeHTML(doc.description || doc.category)}
              </p>
            </div>

          </div>

          <div class="checklist-item-right">

            <span class="document-status ${doc.completed ? "completed" : "missing"}">
              ${doc.completed ? "✓ Completed" : "Missing"}
            </span>

            ${doc.custom ? `
              <button
                type="button"
                class="delete-custom-document"
                data-action="delete"
                data-id="${escapeHTML(doc.id)}"
                aria-label="Delete ${escapeHTML(doc.name)}"
                title="Delete custom document"
              >×</button>
            ` : ""}

          </div>

        </article>
      `;

    }).join("");
  }

  // 12. Category Selection
  document.querySelectorAll(".category-card").forEach((button) => {

    button.addEventListener("click", () => {

      activeCategory = button.dataset.category;
      activeFilter = "all";

      renderChecklist();

    });

  });

  // 13. Filter Selection
  document.querySelectorAll(".check-filter").forEach((button) => {

    button.addEventListener("click", () => {

      activeFilter = button.dataset.filter;

      renderChecklist();

    });

  });

  // 14. Mark Documents Completed / Missing
  checklistItems.addEventListener("change", (event) => {

    const checkbox = event.target.closest('[data-action="toggle"]');

    if (!checkbox) return;

    const documentId = checkbox.dataset.id;

    const documentIndex = documents.findIndex(
      (doc) => String(doc.id) === String(documentId)
    );

    if (documentIndex === -1) return;

    const previousValue = documents[documentIndex].completed;

    documents[documentIndex].completed = checkbox.checked;

    if (!saveDocuments()) {
      documents[documentIndex].completed = previousValue;
      renderChecklist();
      return;
    }

    showToast(
      checkbox.checked
        ? "Document marked as completed!"
        : "Document marked as missing."
    );

    renderChecklist();

  });

  // 15. Delete Custom Document
  checklistItems.addEventListener("click", (event) => {

    const button = event.target.closest('[data-action="delete"]');

    if (!button) return;

    const documentId = button.dataset.id;

    const documentIndex = documents.findIndex(
      (doc) => String(doc.id) === String(documentId)
    );

    if (documentIndex === -1) return;

    const deletedDocument = documents.splice(documentIndex, 1)[0];

    if (!saveDocuments()) {
      documents.splice(documentIndex, 0, deletedDocument);
      renderChecklist();
      return;
    }

    showToast("Custom document deleted.");

    renderChecklist();

  });

  // 16. Open Add Document Form
  function openAddForm() {

    addPanel.hidden = false;
    formMessage.textContent = "";

    addPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    nameInput.focus();

  }

  // 17. Close Add Document Form
  function closeAddForm() {

    addPanel.hidden = true;
    addForm.reset();
    formMessage.textContent = "";

  }

  addButton.addEventListener("click", openAddForm);
  closeButton.addEventListener("click", closeAddForm);
  cancelButton.addEventListener("click", closeAddForm);

  // 18. Add Custom Document
  addForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const description = descriptionInput.value.trim();

    if (!name || !category) {
      formMessage.textContent =
        "Please enter a document name and select a category.";

      return;
    }

    const duplicate = documents.some((doc) => {
      return (
        doc.name.toLowerCase() === name.toLowerCase() &&
        doc.category === category
      );
    });

    if (duplicate) {
      formMessage.textContent =
        "This document already exists in this category.";

      return;
    }

    const newDocument = {
      id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      category,
      description: description || `${category} document.`,
      completed: false,
      custom: true
    };

    documents.push(newDocument);

    if (!saveDocuments()) {
      documents.pop();
      return;
    }

    closeAddForm();

    activeCategory = category;
    activeFilter = "all";

    renderChecklist();

    showToast("Custom document added successfully!");

  });

  // 19. Initial Page Render
  renderChecklist();

}
