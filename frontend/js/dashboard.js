/**
 * DocuPing - Dashboard / Overview Controller
 * Matches Screenshot 3 (3. Dashboard@1x.png)
 * Handles mock data, circular progress rendering, notification popover, and vault interactions.
 */

import { CONFIG } from "./config.js";
import { toast } from "./components/toast.js";
import { ICONS } from "./utils/icons.js";

export const DASHBOARD_DATA = {
  user: {
    name: "Ananya",
    fullName: "Ananya Singh",
    email: "ananya@email.com",
    initial: "A"
  },
  metrics: {
    readinessPercentage: 78,
    readinessStatus: "You're almost there!",
    documentsSaved: 24,
    documentsSavedContext: "Across your vaults"
  },
  vaults: [
    {
      id: "academic",
      title: "Academic",
      description: "Marksheets, ID",
      icon: "academic",
      count: 8,
      href: "pages/vault-category.html?category=academic"
    },
    {
      id: "career",
      title: "Career",
      description: "Resume, Internships",
      icon: "career",
      count: 6,
      href: "pages/vault-category.html?category=career"
    },
    {
      id: "achievements",
      title: "Achievements",
      description: "Certificates",
      icon: "achievements",
      count: 5,
      href: "pages/vault-category.html?category=achievements"
    },
    {
      id: "health",
      title: "Health",
      description: "Reports, Meds",
      icon: "health",
      count: 5,
      href: "pages/vault-category.html?category=health"
    }
  ],
  notifications: [
    {
      id: "notif-1",
      title: "Passport Expiry Reminder",
      message: "Expires in 28 days. Schedule renewal soon.",
      time: "2 hours ago",
      type: "warning"
    },
    {
      id: "notif-2",
      title: "Semester Marksheet Verified",
      message: "Semester 5 marksheet saved in Academic vault.",
      time: "Yesterday",
      type: "success"
    }
  ]
};

/**
 * Initializes all Dashboard components and event listeners
 * @param {Object} options
 * @param {string} [options.basePath=""] - Relative base path prefix
 */
export function initDashboard({ basePath = "" } = {}) {
  initUserGreeting();
  initProgressRing();
  initNotificationsDropdown();
  initVaultCardListeners(basePath);
  initStatCardInteractions(basePath);
  initLogoutHandler(basePath);
}

/**
 * 1. Personalize greeting from saved prototype session or mock data
 */
export function initUserGreeting() {
  const greetingEl = document.getElementById("dashboard-greeting-name");
  if (!greetingEl) return;

  let userName = DASHBOARD_DATA.user.name;

  try {
    const storedUserJson = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (storedUserJson) {
      const storedUser = JSON.parse(storedUserJson);
      if (storedUser && storedUser.name) {
        // Take first name
        userName = storedUser.name.split(" ")[0];
      }
    }
  } catch (e) {
    // Fall back to default Ananya
  }

  // Determine time-of-day greeting (or default to screenshot's "Good Evening")
  const hour = new Date().getHours();
  let timeGreeting = "Good Evening";
  if (hour >= 5 && hour < 12) {
    timeGreeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = "Good Afternoon";
  }

  greetingEl.textContent = `${timeGreeting}, ${userName}!`;
}

/**
 * 2. Animate and set circular progress donut ring
 */
export function initProgressRing() {
  const fillCircle = document.getElementById("progress-circle-fill");
  if (!fillCircle) return;

  const percentage = DASHBOARD_DATA.metrics.readinessPercentage; // 78%
  const radius = parseFloat(fillCircle.getAttribute("r")) || 34;
  const circumference = 2 * Math.PI * radius;

  fillCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  const offset = circumference - (percentage / 100) * circumference;

  // Animate smoothly after DOM mount
  requestAnimationFrame(() => {
    fillCircle.style.strokeDashoffset = `${offset}`;
  });
}

/**
 * 3. Notification popover menu and toast feedback
 */
export function initNotificationsDropdown() {
  const btn = document.getElementById("dashboard-notif-btn");
  const dropdown = document.getElementById("dashboard-notif-dropdown");

  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains("is-open");
    if (isOpen) {
      dropdown.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    } else {
      dropdown.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dropdown.classList.contains("is-open")) {
      dropdown.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
  });
}

/**
 * 4. Vault category cards interaction
 */
export function initVaultCardListeners(basePath = "") {
  const cards = document.querySelectorAll(".category-card");

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      const categoryId = card.getAttribute("data-category-id");
      const categoryTitle = card.querySelector(".category-card-title")?.textContent || categoryId;
      
      console.log(`[Dashboard] Selected vault category: "${categoryTitle}"`);
    });
  });
}

/**
 * 5. Interactive Stat Card click handlers
 */
export function initStatCardInteractions(basePath = "") {
  const readinessCard = document.getElementById("stat-card-readiness");
  const savedCard = document.getElementById("stat-card-saved");

  if (readinessCard) {
    readinessCard.style.cursor = "pointer";
    readinessCard.addEventListener("click", () => {
      toast.show({
        message: "Document Readiness: 78% complete. 2 documents require attention.",
        type: "info"
      });
    });
  }

  if (savedCard) {
    savedCard.style.cursor = "pointer";
    savedCard.addEventListener("click", () => {
      toast.show({
        message: "You have 24 documents safely organized across 4 vaults.",
        type: "success"
      });
    });
  }
}

/**
 * 6. Logout handler
 */
export function initLogoutHandler(basePath = "") {
  const logoutLinks = document.querySelectorAll('[data-nav-id="logout"]');

  logoutLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      } catch (err) {
        console.warn("Could not clear localStorage:", err);
      }

      toast.info("Logged out successfully.");

      const targetHref = basePath ? `${basePath}pages/login.html` : "pages/login.html";
      setTimeout(() => {
        window.location.href = targetHref;
      }, 600);
    });
  });
}
