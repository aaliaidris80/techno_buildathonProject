/**
 * DocuPing - Ping Reminders
 * Connected to Backend Reminders APIs (/api/reminders)
 */

import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { createSidebar, initSidebar } from "./components/index.js";

document.addEventListener("DOMContentLoaded", () => {
  initReminders();
});

async function initReminders() {
  const sidebarMount = document.getElementById("sidebar-mount");
  if (sidebarMount) {
    sidebarMount.innerHTML = createSidebar("ping-reminders", "../");
    initSidebar();
  }

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

  let reminders = [];
  let activeFilter = "all";
  let editingId = null;
  let toastTimeout;

  function normalizeReminder(r) {
    const rawDate = r.reminderDate || r.dueDate || r.date || getToday();
    const formattedInputDate = String(rawDate).includes("T")
      ? String(rawDate).split("T")[0]
      : String(rawDate);

    return {
      id: r._id || r.id,
      title: r.title || "Untitled Reminder",
      category: r.category || "Document",
      date: formattedInputDate,
      time: r.time || "",
      notes: r.notes || r.description || "",
      completed: Boolean(r.isCompleted ?? r.completed ?? (r.status === "completed"))
    };
  }

  async function loadRemindersFromBackend() {
    try {
      const res = await api.get(CONFIG.ENDPOINTS.REMINDERS.LIST);
      const list = res.reminders || res.data || [];
      reminders = list.map(normalizeReminder);
    } catch (error) {
      console.error("Could not load reminders from backend:", error.message);
      reminders = [];
    }
  }

  function getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function getStatus(reminder) {
    if (reminder.completed) return "completed";
    return reminder.date < getToday() ? "overdue" : "upcoming";
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? dateString
      : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function updateStats() {
    const upcoming = reminders.filter((r) => getStatus(r) === "upcoming").length;
    const overdue = reminders.filter((r) => getStatus(r) === "overdue").length;
    const completed = reminders.filter((r) => getStatus(r) === "completed").length;

    const upEl = document.getElementById("upcoming-count");
    const ovEl = document.getElementById("overdue-count");
    const coEl = document.getElementById("completed-count");
    if (upEl) upEl.textContent = upcoming;
    if (ovEl) ovEl.textContent = overdue;
    if (coEl) coEl.textContent = completed;
  }

  function getCategoryIcon(category) {
    return { Document: "📄", Academic: "🎓", Health: "🩺", Other: "📌" }[category] || "📌";
  }

  function renderReminders() {
    updateStats();

    const filteredReminders = reminders
      .filter((r) => activeFilter === "all" || getStatus(r) === activeFilter)
      .sort((a, b) => (a.completed !== b.completed ? (a.completed ? 1 : -1) : a.date.localeCompare(b.date)));

    if (filteredReminders.length === 0) {
      reminderList.innerHTML = `
        <div class="empty-reminders">
          <div class="empty-icon">🔔</div>
          <h3>No reminders found</h3>
          <p>Add a reminder to stay on top of document renewals & deadlines.</p>
        </div>
      `;
      return;
    }

    reminderList.innerHTML = filteredReminders.map((reminder) => {
      const status = getStatus(reminder);
      const statusLabels = { upcoming: "Upcoming", overdue: "Overdue", completed: "Completed" };
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
                ${reminder.time ? `<span>◷ ${escapeHTML(reminder.time)}</span>` : ""}
              </div>
              ${reminder.notes ? `<p class="reminder-notes">${escapeHTML(reminder.notes)}</p>` : ""}
            </div>
          </div>

          <div class="reminder-right">
            <span class="status-badge status-${status}">${statusLabels[status]}</span>
            <div class="reminder-actions">
              <button type="button" class="reminder-action-btn" data-action="edit" data-id="${escapeHTML(reminder.id)}" title="Edit">✎</button>
              ${status !== "completed" ? `
                <button type="button" class="reminder-action-btn" data-action="complete" data-id="${escapeHTML(reminder.id)}" title="Mark completed">✓</button>
              ` : ""}
              <button type="button" class="reminder-action-btn delete" data-action="delete" data-id="${escapeHTML(reminder.id)}" title="Delete">×</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function openForm() {
    formCard.hidden = false;
    formMessage.textContent = "";
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInput.focus();
  }

  function closeForm() {
    formCard.hidden = true;
    form.reset();
    formMessage.textContent = "";
    editingId = null;
    formHeading.textContent = "Create a reminder";
    saveButton.textContent = "Save Reminder";
  }

  function editReminder(reminderId) {
    const reminder = reminders.find((item) => String(item.id) === String(reminderId));
    if (!reminder) return;

    editingId = reminder.id;
    titleInput.value = reminder.title;
    categoryInput.value = reminder.category;
    dateInput.value = reminder.date;
    timeInput.value = reminder.time || "";
    notesInput.value = reminder.notes || "";

    formHeading.textContent = "Edit reminder";
    saveButton.textContent = "Update Reminder";
    openForm();
  }

  openBtn?.addEventListener("click", () => {
    editingId = null;
    formHeading.textContent = "Create a reminder";
    saveButton.textContent = "Save Reminder";
    form.reset();
    openForm();
  });

  closeBtn?.addEventListener("click", closeForm);
  cancelBtn?.addEventListener("click", closeForm);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      title: titleInput.value.trim(),
      category: categoryInput.value,
      reminderDate: dateInput.value,
      dueDate: dateInput.value,
      date: dateInput.value,
      time: timeInput.value,
      notes: notesInput.value.trim()
    };

    if (!payload.title || !payload.category || !payload.date) {
      formMessage.textContent = "Please fill in all required fields.";
      return;
    }

    saveButton.disabled = true;
    try {
      if (editingId !== null) {
        await api.put(CONFIG.ENDPOINTS.REMINDERS.UPDATE(editingId), payload);
        showToast("Reminder updated successfully!");
      } else {
        await api.post(CONFIG.ENDPOINTS.REMINDERS.CREATE, payload);
        showToast("Reminder added successfully!");
      }

      closeForm();
      activeFilter = "all";
      updateActiveFilterButton();
      await loadRemindersFromBackend();
      renderReminders();
    } catch (error) {
      formMessage.textContent = error.message || "Unable to save reminder.";
    } finally {
      saveButton.disabled = false;
    }
  });

  reminderList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const reminderId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
      editReminder(reminderId);
      return;
    }

    try {
      if (action === "complete") {
        await api.put(CONFIG.ENDPOINTS.REMINDERS.UPDATE(reminderId), {
          isCompleted: true,
          completed: true,
          status: "completed"
        });
        showToast("Reminder marked as completed!");
      } else if (action === "delete") {
        await api.delete(CONFIG.ENDPOINTS.REMINDERS.DELETE(reminderId));
        showToast("Reminder deleted.");
      }

      await loadRemindersFromBackend();
      renderReminders();
    } catch (error) {
      showToast(error.message || "Action failed.");
    }
  });

  function updateActiveFilterButton() {
    document.querySelectorAll(".filter-btn").forEach((button) => {
      const isActive = button.dataset.filter === activeFilter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      updateActiveFilterButton();
      renderReminders();
    });
  });

  updateActiveFilterButton();
  await loadRemindersFromBackend();
  renderReminders();
}