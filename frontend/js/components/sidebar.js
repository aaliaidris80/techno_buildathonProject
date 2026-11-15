/**
 * DocuPing - AppSidebar Component
 * Persistent navigation sidebar matching DocuPing layout and responsive drawer.
 */

import { ICONS } from "../utils/icons.js";

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", href: "index.html", icon: "overview" },
  { id: "my-vault", label: "My Vault", href: "pages/my-vault.html", icon: "vault" },
  { id: "ping-reminders", label: "Ping Reminders", href: "pages/ping-reminders.html", icon: "bell" },
  { id: "document-checklist", label: "Document Checklist", href: "pages/document-checklist.html", icon: "checklist" }
];

export const FOOTER_ITEMS = [
  { id: "settings", label: "Settings", href: "pages/settings.html", icon: "settings" },
  { id: "logout", label: "Logout", href: "pages/login.html", icon: "logout" }
];

/**
 * Generates HTML string for AppSidebar
 * @param {string} activeId - ID of currently active navigation link
 * @param {string} [basePath=""] - Relative base path prefix (e.g. "../" for pages/)
 */
export function createSidebar(activeId = "overview", basePath = "") {
  const navLinksHtml = NAV_ITEMS.map((item) => {
    const isActive = item.id === activeId;
    const href = item.href.startsWith("pages/") && basePath ? `${basePath}${item.href}` : (item.id === "overview" && basePath ? `${basePath}index.html` : item.href);
    return `
      <a href="${href}" class="sidebar-link ${isActive ? "active" : ""}" data-nav-id="${item.id}" ${isActive ? 'aria-current="page"' : ""}>
        <span class="sidebar-link-icon">${ICONS[item.icon](20)}</span>
        <span>${item.label}</span>
      </a>
    `;
  }).join("");

  const footerLinksHtml = FOOTER_ITEMS.map((item) => {
    const isActive = item.id === activeId;
    const href = item.href.startsWith("pages/") && basePath ? `${basePath}${item.href}` : item.href;
    return `
      <a href="${href}" class="sidebar-link ${isActive ? "active" : ""}" data-nav-id="${item.id}">
        <span class="sidebar-link-icon">${ICONS[item.icon](20)}</span>
        <span>${item.label}</span>
      </a>
    `;
  }).join("");

  const brandHref = basePath ? `${basePath}index.html` : "index.html";

  return `
    <div class="sidebar-backdrop" id="sidebar-backdrop" aria-hidden="true"></div>
    <aside class="app-sidebar" id="app-sidebar" aria-label="Main Navigation">
      <a href="${brandHref}" class="sidebar-brand">
        <span class="sidebar-logo-icon">${ICONS.logo(28)}</span>
        <span class="sidebar-brand-name">DocuPing</span>
      </a>

      <nav class="sidebar-nav">
        ${navLinksHtml}
      </nav>

      <div class="sidebar-footer">
        ${footerLinksHtml}
      </div>
    </aside>
  `;
}

/**
 * Initializes sidebar events (mobile drawer toggle, backdrop close)
 */
export function initSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const toggleBtn = document.getElementById("mobile-menu-toggle");

  if (!sidebar) return;

  function openSidebar() {
    sidebar.classList.add("is-open");
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("is-open");
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeSidebar);
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
      closeSidebar();
    }
  });

  // Handle navigation clicks
  sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const navId = link.getAttribute("data-nav-id");

      if (navId === "logout") {
        e.preventDefault();
        try {
          localStorage.removeItem("docuping_auth_token");
          localStorage.removeItem("docuping_user_data");
        } catch (err) {}
        import("./toast.js").then(({ toast }) => {
          toast.success("Logged out successfully. Redirecting to login...");
          setTimeout(() => {
            window.location.href = link.getAttribute("href");
          }, 800);
        });
        return;
      }

      const href = link.getAttribute("href");
      const isKnownPage = href && (
        href.includes("login.html") ||
        href.includes("signup.html") ||
        href.includes("my-vault.html") ||
        href.includes("dashboard.html") ||
        href.includes("index.html")
      );
      if (href && href.includes("pages/") && !isKnownPage) {
        e.preventDefault();
        const label = link.querySelector("span:last-child")?.textContent || "This";
        import("./toast.js").then(({ toast }) => {
          toast.show({
            message: `"${label}" view is scheduled to be created in the next step.`,
            type: "info"
          });
        });
      }
    });
  });
}
