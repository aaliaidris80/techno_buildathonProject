/**
 * DocuPing - Dashboard / Overview Controller
 * Connected to /api/documents & /api/documents/checklist
 */

import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { toast } from "./components/toast.js";

export const DASHBOARD_DATA = {
  user: { name: "Student", fullName: "Student", email: "", initial: "S" },
  metrics: {
    readinessPercentage: 0,
    readinessStatus: "Loading readiness...",
    documentsSaved: 0,
    documentsSavedContext: "Across your vaults"
  }
};

export async function initDashboard({ basePath = "" } = {}) {
  initUserGreeting();
  initNotificationsDropdown();
  initVaultCardListeners(basePath);
  initStatCardInteractions(basePath);
  initLogoutHandler(basePath);
  await loadLiveDashboardMetrics();
}

async function loadLiveDashboardMetrics() {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  if (!token) {
    initProgressRing(0);
    return;
  }

  try {
    const [docsRes, checklistRes] = await Promise.all([
      api.get(CONFIG.ENDPOINTS.DOCUMENTS.LIST),
      api.get(CONFIG.ENDPOINTS.DOCUMENTS.CHECKLIST)
    ]);

    const docs = docsRes.documents || [];
    const readinessObj = checklistRes.readiness || {};
    const percentage = typeof readinessObj === "number"
      ? readinessObj
      : (readinessObj.percentage ?? readinessObj.score ?? 0);

    DASHBOARD_DATA.metrics.documentsSaved = docs.length;
    DASHBOARD_DATA.metrics.readinessPercentage = Math.round(percentage);

    // Update DOM elements if present
    const readinessText = document.querySelector("#stat-card-readiness .stat-card-value, #readiness-percentage-text");
    if (readinessText) readinessText.textContent = `${DASHBOARD_DATA.metrics.readinessPercentage}%`;

    const savedText = document.querySelector("#stat-card-saved .stat-card-value, #saved-docs-count");
    if (savedText) savedText.textContent = `${docs.length}`;

    // Update category card counts dynamically
    const counts = { academic: 0, career: 0, achievements: 0, health: 0 };
    docs.forEach((d) => {
      const cat = (d.category || "").toLowerCase();
      if (counts[cat] !== undefined) counts[cat]++;
    });

    document.querySelectorAll(".category-card").forEach((card) => {
      const catId = (card.getAttribute("data-category-id") || "").toLowerCase();
      const countEl = card.querySelector(".category-card-count");
      if (countEl && counts[catId] !== undefined) {
        countEl.textContent = `${counts[catId]} doc${counts[catId] === 1 ? "" : "s"}`;
      }
    });

    initProgressRing(DASHBOARD_DATA.metrics.readinessPercentage);
  } catch (err) {
    console.warn("Dashboard live fetch fallback:", err.message);
    initProgressRing(0);
  }
}

export function initUserGreeting() {
  const greetingEl = document.getElementById("dashboard-greeting-name");
  if (!greetingEl) return;

  let userName = DASHBOARD_DATA.user.name;

  try {
    const storedUserJson = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (storedUserJson) {
      const storedUser = JSON.parse(storedUserJson);
      if (storedUser && storedUser.name) {
        userName = storedUser.name.split(" ")[0];
      }
    }
  } catch (e) {}

  const hour = new Date().getHours();
  let timeGreeting = "Good Evening";
  if (hour >= 5 && hour < 12) timeGreeting = "Good Morning";
  else if (hour >= 12 && hour < 17) timeGreeting = "Good Afternoon";

  greetingEl.textContent = `${timeGreeting}, ${userName}!`;
}

export function initProgressRing(percentage = DASHBOARD_DATA.metrics.readinessPercentage) {
  const fillCircle = document.getElementById("progress-circle-fill");
  if (!fillCircle) return;

  const radius = parseFloat(fillCircle.getAttribute("r")) || 34;
  const circumference = 2 * Math.PI * radius;

  fillCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  const offset = circumference - (percentage / 100) * circumference;

  requestAnimationFrame(() => {
    fillCircle.style.strokeDashoffset = `${offset}`;
  });
}

export function initNotificationsDropdown() {
  const btn = document.getElementById("dashboard-notif-btn");
  const dropdown = document.getElementById("dashboard-notif-dropdown");
  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("is-open");
    dropdown.classList.toggle("is-open", !isOpen);
    btn.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

export function initVaultCardListeners() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = card.getAttribute("data-category-id");
      console.log(`[Dashboard] Selected vault category: "${categoryId}"`);
    });
  });
}

export function initStatCardInteractions() {
  const readinessCard = document.getElementById("stat-card-readiness");
  const savedCard = document.getElementById("stat-card-saved");

  if (readinessCard) {
    readinessCard.style.cursor = "pointer";
    readinessCard.addEventListener("click", () => {
      toast.show({
        message: `Document Readiness: ${DASHBOARD_DATA.metrics.readinessPercentage}% complete.`,
        type: "info"
      });
    });
  }

  if (savedCard) {
    savedCard.style.cursor = "pointer";
    savedCard.addEventListener("click", () => {
      toast.show({
        message: `You have ${DASHBOARD_DATA.metrics.documentsSaved} documents safely stored in MongoDB.`,
        type: "success"
      });
    });
  }
}

export function initLogoutHandler(basePath = "") {
  document.querySelectorAll('[data-nav-id="logout"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      toast.info("Logged out successfully.");
      const targetHref = basePath ? `${basePath}pages/login.html` : "pages/login.html";
      setTimeout(() => {
        window.location.href = targetHref;
      }, 600);
    });
  });
}