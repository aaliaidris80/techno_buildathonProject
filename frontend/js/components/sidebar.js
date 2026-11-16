
/**
 * DocuPing - AppSidebar Component
 * Persistent navigation sidebar and responsive drawer.
 */

import { ICONS } from "../utils/icons.js";

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", href: "index.html", icon: "overview" },
  { id: "my-vault", label: "My Vault", href: "pages/my-vault.html", icon: "vault" },
  { id: "ping-reminders", label: "Ping Reminders", href: "pages/reminders.html", icon: "bell" },
  { id: "document-checklist", label: "Document Checklist", href: "pages/Checklist.html", icon: "checklist" }
];

export const FOOTER_ITEMS = [
  { id: "settings", label: "Settings", href: "pages/settings.html", icon: "settings" },
  { id: "logout", label: "Logout", href: "pages/login.html", icon: "logout" }
];

/**
 * Generates HTML string for AppSidebar.
 */
export function createSidebar(activeId = "overview", basePath = "") {

  const getHref = (item) => {
    if (item.id === "overview") {
      return basePath ? `${basePath}index.html` : "index.html";
    }

    if (item.href.startsWith("pages/") && basePath) {
      return `${basePath}${item.href}`;
    }

    return item.href;
  };

  const createLink = (item) => {
    const isActive = item.id === activeId;
    const href = getHref(item);

    return `
      <a href="${href}"
         class="sidebar-link ${isActive ? "active" : ""}"
         data-nav-id="${item.id}"
         ${isActive ? 'aria-current="page"' : ""}>
        <span class="sidebar-link-icon">${ICONS[item.icon](20)}</span>
        <span>${item.label}</span>
      </a>
    `;
  };

  const navLinksHtml = NAV_ITEMS.map(createLink).join("");
  const footerLinksHtml = FOOTER_ITEMS.map(createLink).join("");

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
 * Initializes sidebar events.
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
      closeSidebar();
    }
  });

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

      // All other sidebar links navigate normally.
      closeSidebar();
    });
  });
}
