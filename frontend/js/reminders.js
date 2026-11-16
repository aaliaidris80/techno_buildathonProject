
/**
 * DocuPing - Ping Reminders
 * Add, display, edit, complete, filter and delete reminders.
 */

import { createSidebar, initSidebar } from "./components/index.js";

const STORAGE_KEY = "docuping_reminders";

document.addEventListener("DOMContentLoaded", () => {
  initReminders();
});

function initReminders() {
  // Initialize shared sidebar
  const sidebarMount = document.getElementById("sidebar-mount");

  if (sidebarMount) {
    sidebarMount.innerHTML = createSidebar("ping-reminders", "../");
    initSidebar();
  }

  // Form elements
  const form = document.getElementById("reminder-form");
  const formCard = document.getElementById("reminder-form-card");
  const reminderList = document.getElementById("reminder-list");

  const openBtn = document.getElementById("open-reminder-form");
  const closeBtn = document.getElementById("close-reminder-form");
  const cancelBtn = document.getElementById("cancel-reminder");

  const titleInput = document.getElementById("reminder-title");
  const categoryInput = document.getElementById("reminder-category");
  const dateInput = document.getElementById("reminder-date");
  const timeInput = document.getElementById("reminder-time");
  const notesInput = document.getElementById("reminder-notes");

  const formMessage = document.getElementById("form-message");
  const toast = document.getElementById("reminder-toast");

  const formHeading = document.getElementById("form-heading");
  const saveButton = document.getElementById("save-reminder-btn");

  let reminders = loadReminders();
  let activeFilter = "all";
  let editingId = null;
  let toastTimeout;

  // Load reminders from localStorage
  function loadReminders() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Could not load reminders:", error);
      return [];
    }
  }

  // Save reminders to localStorage
  function saveReminders() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reminders)
      );

      return true;
    } catch (error) {
      console.error("Could not save reminders:", error);
      showToast("Unable to save. Please check browser storage.");
      return false;
    }
  }

  // Get today's date
  function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Determine reminder status
  function getStatus(reminder) {
    if (reminder.completed) {
      return "completed";
    }

    return reminder.date < getToday()
      ? "overdue"
      : "upcoming";
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  // Prevent HTML injection
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

  // Display toast notification
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  // Update summary cards
  function updateStats() {
    const upcoming = reminders.filter(
      reminder => getStatus(reminder) === "upcoming"
    ).length;

    const overdue = reminders.filter(
      reminder => getStatus(reminder) === "overdue"
    ).length;

    const completed = reminders.filter(
      reminder => getStatus(reminder) === "completed"
    ).length;

    document.getElementById("upcoming-count").textContent = upcoming;
    document.getElementById("overdue-count").textContent = overdue;
    document.getElementById("completed-count").textContent = completed;
  }

  // Category icons
  function getCategoryIcon(category) {
    const icons = {
      Document: "📄",
      Academic: "🎓",
      Health: "🩺",
      Other: "📌"
    };

    return icons[category] || "📌";
  }

  // Render reminders on the page
  function renderReminders() {
    updateStats();

    let filteredReminders = reminders.filter(reminder => {
      return activeFilter === "all" ||
        getStatus(reminder) === activeFilter;
    });

    filteredReminders.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      return a.date.localeCompare(b.date);
    });

    // Empty state
    if (filteredReminders.length === 0) {
      const messages = {
        all: [
          "No reminders yet",
          "Add your first reminder to stay organized."
        ],
        upcoming: [
          "No upcoming reminders",
          "You're all caught up for now."
        ],
        overdue: [
          "No overdue reminders",
          "Great! Nothing is past its due date."
        ],
        completed: [
          "No completed reminders",
          "Completed reminders will appear here."
        ]
      };

      const message = messages[activeFilter];

      reminderList.innerHTML = `
        <div class="empty-reminders">
          <div class="empty-icon">🔔</div>
          <h3>${message[0]}</h3>
          <p>${message[1]}</p>
        </div>
      `;

      return;
    }

    // Create reminder cards
    reminderList.innerHTML = filteredReminders.map(reminder => {
      const status = getStatus(reminder);

      const statusLabels = {
        upcoming: "Upcoming",
        overdue: "Overdue",
        completed: "Completed"
      };

      const categoryClasses = {
        Document: "category-document",
        Academic: "category-academic",
        Health: "category-health",
        Other: "category-other"
      };

      return `
        <article class="reminder-item" data-id="${escapeHTML(reminder.id)}">

          <div class="reminder-main">

            <div class="category-icon ${categoryClasses[reminder.category] || "category-other"}">
              ${getCategoryIcon(reminder.category)}
            </div>

            <div class="reminder-details">

              <h3>${escapeHTML(reminder.title)}</h3>

              <div class="reminder-meta">
                <span>${escapeHTML(reminder.category)}</span>

                <span>📅 ${formatDate(reminder.date)}</span>

                ${reminder.time
                  ? `<span>◷ ${escapeHTML(reminder.time)}</span>`
                  : ""}
              </div>

              ${reminder.notes
                ? `<p class="reminder-notes">${escapeHTML(reminder.notes)}</p>`
                : ""}

            </div>
          </div>

          <div class="reminder-right">

            <span class="status-badge status-${status}">
              ${statusLabels[status]}
            </span>

            <div class="reminder-actions">

              <!-- Edit button -->
              <button
                type="button"
                class="reminder-action-btn"
                data-action="edit"
                data-id="${escapeHTML(reminder.id)}"
                title="Edit reminder"
                aria-label="Edit ${escapeHTML(reminder.title)}"
              >✎</button>

              <!-- Complete button -->
              ${status !== "completed" ? `
                <button
                  type="button"
                  class="reminder-action-btn"
                  data-action="complete"
                  data-id="${escapeHTML(reminder.id)}"
                  title="Mark as completed"
                  aria-label="Mark ${escapeHTML(reminder.title)} as completed"
                >✓</button>
              ` : ""}

              <!-- Delete button -->
              <button
                type="button"
                class="reminder-action-btn delete"
                data-action="delete"
                data-id="${escapeHTML(reminder.id)}"
                title="Delete reminder"
                aria-label="Delete ${escapeHTML(reminder.title)}"
              >×</button>

            </div>
          </div>

        </article>
      `;
    }).join("");
  }

  // Open the form
  function openForm() {
    formCard.hidden = false;
    formMessage.textContent = "";

    formCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    titleInput.focus();
  }

  // Close and reset the form
  function closeForm() {
    formCard.hidden = true;
    form.reset();
    formMessage.textContent = "";

    editingId = null;

    formHeading.textContent = "Create a reminder";
    saveButton.textContent = "Save Reminder";
  }

  // Open form for editing
  function editReminder(reminderId) {
    const reminder = reminders.find(
      item => String(item.id) === String(reminderId)
    );

    if (!reminder) return;

    editingId = reminder.id;

    titleInput.value = reminder.title;
    categoryInput.value = reminder.category;
    dateInput.value = reminder.date;
    timeInput.value = reminder.time || "";
    notesInput.value = reminder.notes || "";

    formHeading.textContent = "Edit reminder";
    saveButton.textContent = "Update Reminder";

    formMessage.textContent = "";

    openForm();
  }

  // Open, close and cancel form
  openBtn.addEventListener("click", () => {
    editingId = null;

    formHeading.textContent = "Create a reminder";
    saveButton.textContent = "Save Reminder";

    form.reset();
    openForm();
  });

  closeBtn.addEventListener("click", closeForm);
  cancelBtn.addEventListener("click", closeForm);

  // Add or update reminder
  form.addEventListener("submit", event => {
    event.preventDefault();

    const reminderData = {
      title: titleInput.value.trim(),
      category: categoryInput.value,
      date: dateInput.value,
      time: timeInput.value,
      notes: notesInput.value.trim()
    };

    if (
      !reminderData.title ||
      !reminderData.category ||
      !reminderData.date
    ) {
      formMessage.textContent =
        "Please fill in all required fields.";

      return;
    }

    // Update existing reminder
    if (editingId !== null) {
      const reminderIndex = reminders.findIndex(
        reminder => String(reminder.id) === String(editingId)
      );

      if (reminderIndex === -1) {
        formMessage.textContent =
          "This reminder could not be found.";

        return;
      }

      const previousReminder = { ...reminders[reminderIndex] };

      reminders[reminderIndex] = {
        ...reminders[reminderIndex],
        ...reminderData,
        updatedAt: new Date().toISOString()
      };

      if (!saveReminders()) {
        reminders[reminderIndex] = previousReminder;
        return;
      }

      closeForm();

      activeFilter = "all";
      updateActiveFilterButton();
      renderReminders();

      showToast("Reminder updated successfully!");

      return;
    }

    // Create new reminder
    const newReminder = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...reminderData,
      completed: false,
      createdAt: new Date().toISOString()
    };

    reminders.push(newReminder);

    if (!saveReminders()) {
      reminders.pop();
      return;
    }

    closeForm();

    activeFilter = "all";
    updateActiveFilterButton();
    renderReminders();

    showToast("Reminder added successfully!");
  });

  // Handle edit, complete and delete actions
  reminderList.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const reminderId = button.dataset.id;
    const action = button.dataset.action;

    const reminderIndex = reminders.findIndex(
      reminder => String(reminder.id) === String(reminderId)
    );

    if (reminderIndex === -1) return;

    // Edit reminder
    if (action === "edit") {
      editReminder(reminderId);
      return;
    }

    // Mark reminder as completed
    if (action === "complete") {
      const previousValue = reminders[reminderIndex].completed;

      reminders[reminderIndex].completed = true;

      if (!saveReminders()) {
        reminders[reminderIndex].completed = previousValue;
        return;
      }

      showToast("Reminder marked as completed!");
    }

    // Delete reminder
    if (action === "delete") {
      const deletedReminder = reminders.splice(reminderIndex, 1)[0];

      if (!saveReminders()) {
        reminders.splice(reminderIndex, 0, deletedReminder);
        return;
      }

      showToast("Reminder deleted.");
    }

    renderReminders();
  });

  // Update active filter styling
  function updateActiveFilterButton() {
    document.querySelectorAll(".filter-btn").forEach(button => {
      const isActive = button.dataset.filter === activeFilter;

      button.classList.toggle("active", isActive);

      button.setAttribute(
        "aria-pressed",
        String(isActive)
      );
    });
  }

  // Filter reminders
  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      updateActiveFilterButton();
      renderReminders();
    });
  });

  // Initial page setup
  updateActiveFilterButton();
  renderReminders();
}
