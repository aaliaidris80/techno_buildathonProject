/**
 * DocuPing - Main Application Entry Point
 * Wires up Sidebar and Dashboard / Overview functionality matching Screenshot 3.
 */

import {
  initSidebar,
  createSidebar,
  modal,
  toast,
  ICONS
} from "./components/index.js";

import { initDashboard } from "./dashboard.js";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

  export function initApp() {
    // 1. Mount AppSidebar with 'overview' as active nav item
    const sidebarContainer = document.getElementById("sidebar-mount");
    if (sidebarContainer) {
      sidebarContainer.innerHTML = createSidebar("overview");
      initSidebar();
    }

    // 2. Initialize Dashboard controller (Progress ring, notifications, vault cards)
    initDashboard({ basePath: "" });
  }
