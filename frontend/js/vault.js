/**
 * DocuPing - My Vault Page Controller
 * Connected to Backend OCR Preview (/documents/preview), Confirm (/documents/confirm),
 * Search (/documents/search), Update, and Delete APIs.
 */

import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { modal } from "./components/modal.js";
import { toast } from "./components/toast.js";
import { ICONS } from "./utils/icons.js";
import { createDocumentCard } from "./components/documentCard.js";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);

const THUMB_LABELS = { pdf: "PDF", doc: "DOC", image: "IMG", track: "TRACK" };

function mapBackendDocToCard(doc) {
  const ext = (doc.fileName || doc.title || "").split(".").pop().toLowerCase();
  let fileType = "pdf";
  if (doc.isTrackOnly) fileType = "track";
  else if (["doc", "docx"].includes(ext)) fileType = "doc";
  else if (["jpg", "jpeg", "png"].includes(ext)) fileType = "image";

  const rawDate = doc.uploadDate || doc.createdAt || new Date().toISOString();
  const formattedDate = new Date(rawDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const formattedExpiry = doc.expiryDate
    ? new Date(doc.expiryDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : null;

  let status = "valid";
  if (doc.isTrackOnly) status = "tracked";
  else if (doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 86400000)) {
    status = "soon";
  }

  return {
    id: doc._id,
    name: doc.title,
    type: fileType,
    category: doc.category || "Academic",
    date: formattedDate,
    rawDate,
    expiryDate: formattedExpiry,
    rawExpiry: doc.expiryDate || "",
    status,
    isTracked: Boolean(doc.isTrackOnly),
    extractedText: doc.extractedText || "",
    notes: doc.extractedText ? `OCR Extracted: ${doc.extractedText.slice(0, 140)}...` : "",
    fileName: doc.fileName || "",
    mimeType: doc.fileType || "",
    hasFile: !!doc.filePath && !doc.isTrackOnly
  };
}

class VaultController {
  constructor() {
    this.documents = [];
    this.state = {
      searchQuery: "",
      category: "all",
      sortBy: "recent"
    };
    this.selectedId = null;
    this.fileCache = new Map(); // docId -> { blob, url }
    this.previewKey = null;
  }

  async init() {
    this.checkUrlCategoryParam();
    this.bindEvents();
    await this.loadDocuments();
    this.render();
  }

  async loadDocuments() {
    try {
      const endpoint = this.state.searchQuery
        ? CONFIG.ENDPOINTS.DOCUMENTS.SEARCH(this.state.searchQuery)
        : CONFIG.ENDPOINTS.DOCUMENTS.LIST;

      const res = await api.get(endpoint);
      const list = res.documents || [];
      this.documents = list.map(mapBackendDocToCard);
      this.pruneFileCache();
    } catch (e) {
      console.error("Failed to fetch documents from backend:", e.message);
      toast.error("Please login first or check backend connection.");
      this.documents = [];
    }
  }

  checkUrlCategoryParam() {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    if (categoryParam) {
      const normalized = categoryParam.toLowerCase();
      const validCategories = ["all", "academic", "career", "achievements", "health", "finance"];
      if (validCategories.includes(normalized)) {
        this.state.category = normalized;
      }
    }
  }

  bindEvents() {
    const searchInput = document.getElementById("vault-search-input");
    const clearBtn = document.getElementById("vault-search-clear");
    let searchTimer = null;

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.searchQuery = e.target.value.trim();
        if (clearBtn) {
          clearBtn.style.display = this.state.searchQuery ? "flex" : "none";
        }
        clearTimeout(searchTimer);
        searchTimer = setTimeout(async () => {
          await this.loadDocuments();
          this.render();
        }, 300);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        this.state.searchQuery = "";
        clearBtn.style.display = "none";
        await this.loadDocuments();
        this.render();
      });
    }

    const pillsContainer = document.getElementById("vault-filter-pills");
    if (pillsContainer) {
      pillsContainer.addEventListener("click", (e) => {
        const pill = e.target.closest(".vault-filter-pill");
        if (!pill) return;
        this.setCategory(pill.getAttribute("data-category") || "all");
      });
    }

    const sortSelect = document.getElementById("vault-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.state.sortBy = e.target.value;
        this.render();
      });
    }

    const uploadBtn = document.getElementById("btn-upload-doc");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => this.openUploadModal());
    }

    const trackBtn = document.getElementById("btn-track-doc");
    if (trackBtn) {
      trackBtn.addEventListener("click", () => this.openTrackModal());
    }

    const grid = document.getElementById("vault-docs-grid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const menuBtn = e.target.closest('[data-action="menu"]');
        if (menuBtn) {
          e.stopPropagation();
          this.toggleDocumentMenu(menuBtn.getAttribute("data-doc-id"));
          return;
        }

        const actionItem = e.target.closest(".doc-menu-item");
        if (actionItem) {
          e.stopPropagation();
          const action = actionItem.getAttribute("data-action");
          const docId = actionItem.getAttribute("data-doc-id");
          this.closeAllMenus();

          if (action === "view") this.viewDocument(docId);
          if (action === "edit") this.editDocument(docId);
          if (action === "delete") this.confirmDeleteDocument(docId);
          return;
        }

        const card = e.target.closest(".doc-card");
        if (card && !e.target.closest(".doc-card-actions")) {
          this.viewDocument(card.getAttribute("data-doc-id"));
        }
      });
    }

    const list = document.getElementById("vault-docs-list");
    if (list) {
      list.addEventListener("click", (e) => {
        const row = e.target.closest(".vault-row");
        if (row) this.selectDocument(row.getAttribute("data-doc-id"));
      });

      list.addEventListener("keydown", (e) => {
        if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
        const rows = Array.from(list.querySelectorAll(".vault-row"));
        if (rows.length === 0) return;
        e.preventDefault();

        const current = rows.findIndex((r) => r.getAttribute("data-doc-id") === this.selectedId);
        let next = current;
        if (e.key === "ArrowDown") next = Math.min(rows.length - 1, current + 1);
        if (e.key === "ArrowUp") next = Math.max(0, current - 1);
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = rows.length - 1;

        const target = rows[next];
        if (!target) return;
        this.selectDocument(target.getAttribute("data-doc-id"));
        target.focus();
        target.scrollIntoView({ block: "nearest" });
      });
    }

    const preview = document.getElementById("vault-preview");
    if (preview) {
      preview.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-preview-action]");
        if (!actionEl || !this.selectedId) return;
        const action = actionEl.getAttribute("data-preview-action");
        const docId = this.selectedId;

        if (action === "download") this.downloadDocument(docId);
        if (action === "share") this.shareDocument(docId);
        if (action === "rename") this.editDocument(docId);
        if (action === "delete") this.confirmDeleteDocument(docId);
        if (action === "retry") {
          this.previewKey = null;
          this.renderPreview();
        }
      });
    }

    document.addEventListener("click", () => this.closeAllMenus());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeAllMenus();
    });
  }

  setCategory(category) {
    this.state.category = category.toLowerCase();
    document.querySelectorAll(".vault-filter-pill").forEach((p) => {
      const pCat = (p.getAttribute("data-category") || "all").toLowerCase();
      p.classList.toggle("is-active", pCat === this.state.category);
      p.setAttribute("aria-selected", String(pCat === this.state.category));
    });
    this.render();
  }

  toggleDocumentMenu(docId) {
    const menu = document.getElementById(`menu-${docId}`);
    const isCurrentlyOpen = menu?.classList.contains("is-open");
    this.closeAllMenus();

    if (menu && !isCurrentlyOpen) {
      menu.classList.add("is-open");
      const btn = document.querySelector(`[data-action="menu"][data-doc-id="${docId}"]`);
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  }

  closeAllMenus() {
    document.querySelectorAll(".doc-menu-dropdown.is-open").forEach((m) => m.classList.remove("is-open"));
    document.querySelectorAll('[data-action="menu"][aria-expanded="true"]').forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  getFilteredDocuments() {
    let result = [...this.documents];

    if (this.state.category !== "all") {
      result = result.filter((doc) => doc.category.toLowerCase() === this.state.category);
    }

    if (this.state.sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.state.sortBy === "expiry") {
      result.sort((a, b) => {
        if (!a.rawExpiry) return 1;
        if (!b.rawExpiry) return -1;
        return new Date(a.rawExpiry) - new Date(b.rawExpiry);
      });
    } else {
      result.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    }

    return result;
  }

  render() {
    const grid = document.getElementById("vault-docs-grid");
    const list = document.getElementById("vault-docs-list");
    const countBadge = document.getElementById("vault-count-badge");
    if (!grid && !list) return;

    const filtered = this.getFilteredDocuments();

    if (countBadge) {
      countBadge.textContent = `${this.documents.length} document${this.documents.length === 1 ? "" : "s"}`;
    }

    // Category page: keep the classic card grid.
    if (grid) {
      if (filtered.length === 0) {
        this.renderEmptyState(grid);
        return;
      }
      grid.innerHTML = filtered.map((doc) => createDocumentCard(doc)).join("");
      return;
    }

    // My Vault page: list + preview pane.
    const split = list.closest(".vault-split");

    if (filtered.length === 0) {
      split?.classList.add("is-empty");
      this.selectedId = null;
      this.previewKey = null;
      const preview = document.getElementById("vault-preview");
      if (preview) preview.innerHTML = "";
      this.renderEmptyState(list);
      return;
    }

    split?.classList.remove("is-empty");

    if (!filtered.some((d) => d.id === this.selectedId)) {
      this.selectedId = filtered[0].id;
    }

    list.innerHTML = filtered.map((doc) => this.createRow(doc)).join("");
    this.renderPreview();
  }

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="vault-empty-state" role="region" aria-label="No documents found">
        <div class="empty-state-icon" aria-hidden="true">${ICONS.search(36)}</div>
        <h3 class="empty-state-title">No documents found</h3>
        <p class="empty-state-desc">
          ${
            this.state.searchQuery
              ? `No documents matched "${escapeHtml(this.state.searchQuery)}".`
              : `You don't have any documents in ${escapeHtml(this.state.category)} yet.`
          }
        </p>
        <div style="display: flex; gap: 0.75rem;">
          ${
            this.state.searchQuery || this.state.category !== "all"
              ? `<button type="button" class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset Filters</button>`
              : ""
          }
          <button type="button" class="btn btn-primary btn-sm" id="btn-empty-upload">
            ${ICONS.plus(16)}
            <span>Add Document</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-reset-filters")?.addEventListener("click", async () => {
      this.state.searchQuery = "";
      const searchInput = document.getElementById("vault-search-input");
      if (searchInput) searchInput.value = "";
      await this.loadDocuments();
      this.setCategory("all");
    });

    document.getElementById("btn-empty-upload")?.addEventListener("click", () => this.openUploadModal());
  }

  createRow(doc) {
    const isActive = doc.id === this.selectedId;
    const thumbType = THUMB_LABELS[doc.type] ? doc.type : "pdf";
    const id = escapeHtml(doc.id);

    return `
      <button type="button"
        class="vault-row${isActive ? " is-active" : ""}"
        role="option"
        id="vault-row-${id}"
        data-doc-id="${id}"
        aria-selected="${isActive}"
        tabindex="${isActive ? "0" : "-1"}">
        <span class="vault-row-thumb is-${thumbType}" aria-hidden="true">${THUMB_LABELS[thumbType]}</span>
        <span class="vault-row-body">
          <span class="vault-row-name">${escapeHtml(doc.name)}</span>
          <span class="vault-row-meta">${escapeHtml(doc.category)} · ${escapeHtml(doc.date)}</span>
        </span>
        ${doc.status === "soon" ? `<span class="vault-row-dot" title="Expiring soon" aria-label="Expiring soon"></span>` : ""}
      </button>
    `;
  }

  selectDocument(docId) {
    if (!docId || !this.documents.some((d) => d.id === docId)) return;
    this.selectedId = docId;

    document.querySelectorAll("#vault-docs-list .vault-row").forEach((row) => {
      const active = row.getAttribute("data-doc-id") === docId;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-selected", String(active));
      row.setAttribute("tabindex", active ? "0" : "-1");
    });

    this.renderPreview();
  }

  renderPreview() {
    const preview = document.getElementById("vault-preview");
    if (!preview) return;

    const doc = this.documents.find((d) => d.id === this.selectedId);
    if (!doc) {
      preview.innerHTML = "";
      this.previewKey = null;
      return;
    }

    // Avoid reloading the stage (and flashing an iframe) when nothing changed.
    const key = JSON.stringify([doc.id, doc.name, doc.category, doc.date, doc.expiryDate, doc.status, doc.hasFile, doc.mimeType]);
    if (key === this.previewKey) return;
    this.previewKey = key;

    const metaSuffix = doc.isTracked ? "Tracked" : `Uploaded ${escapeHtml(doc.date)}`;
    const isSoon = doc.status === "soon";
    const expiryLabel = doc.expiryDate ? `Expires ${escapeHtml(doc.expiryDate)}` : "No expiry";

    preview.innerHTML = `
      <header class="vault-preview-header">
        <div class="vault-preview-heading">
          <h2 class="vault-preview-title">${escapeHtml(doc.name)}</h2>
          <p class="vault-preview-meta">${escapeHtml(doc.category)} · ${metaSuffix}</p>
        </div>
        ${
          doc.hasFile
            ? `<div class="vault-preview-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-preview-action="download">Download</button>
                <button type="button" class="btn btn-primary btn-sm" data-preview-action="share">Share</button>
              </div>`
            : ""
        }
      </header>

      <div class="vault-preview-stage" id="vault-preview-stage"></div>

      <div class="vault-preview-chips">
        <span class="vault-chip ${isSoon ? "is-amber" : "is-sage"}">${ICONS.calendar(14)} <span>${expiryLabel}</span></span>
        <a href="reminders.html" class="vault-chip is-link">+ Set reminder</a>
        <button type="button" class="vault-chip is-link" data-preview-action="rename">${ICONS.edit(14)} <span>Rename</span></button>
        <button type="button" class="vault-chip is-link is-danger" data-preview-action="delete">${ICONS.trash(14)} <span>Delete</span></button>
      </div>
    `;

    this.renderStage(doc);
  }

  async renderStage(doc) {
    const stage = document.getElementById("vault-preview-stage");
    if (!stage) return;

    if (!doc.hasFile) {
      stage.innerHTML = this.stageMessage(
        doc.isTracked ? "Tracked only" : "No file attached",
        doc.isTracked
          ? "This document is tracked for its expiry date. No file is stored in your vault."
          : "There's no stored file for this document."
      );
      return;
    }

    if (!this.fileCache.has(doc.id)) {
      stage.innerHTML = `<div class="vault-preview-placeholder"><span class="vault-preview-spinner" aria-hidden="true"></span><p>Loading preview…</p></div>`;
    }

    let entry;
    try {
      entry = await this.getFile(doc.id);
    } catch (err) {
      if (this.selectedId !== doc.id) return;
      stage.innerHTML = this.stageMessage(
        "Preview unavailable",
        err.message || "The file could not be loaded.",
        `<button type="button" class="btn btn-secondary btn-sm" data-preview-action="retry">Try again</button>`
      );
      this.previewKey = null;
      return;
    }

    // Selection may have changed while the file was loading.
    if (this.selectedId !== doc.id || !stage.isConnected) return;

    const mime = (entry.blob.type || doc.mimeType || "").toLowerCase();
    const title = escapeHtml(doc.name);

    if (mime === "application/pdf") {
      stage.innerHTML = `<iframe class="vault-preview-frame" src="${entry.url}" title="${title}"></iframe>`;
    } else if (mime.startsWith("image/")) {
      stage.innerHTML = `<img class="vault-preview-image" src="${entry.url}" alt="${title}" />`;
    } else {
      stage.innerHTML = this.stageMessage(
        "No inline preview",
        "This file type can't be previewed in the browser.",
        `<button type="button" class="btn btn-secondary btn-sm" data-preview-action="download">Download file</button>`
      );
    }
  }

  stageMessage(title, desc, actionHtml = "") {
    return `
      <div class="vault-preview-placeholder">
        <div class="empty-state-icon" aria-hidden="true">${ICONS.file(28)}</div>
        <h3 class="vault-preview-placeholder-title">${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
        ${actionHtml}
      </div>
    `;
  }

  async getFile(docId) {
    const cached = this.fileCache.get(docId);
    if (cached) return cached;

    const blob = await api.getBlob(CONFIG.ENDPOINTS.DOCUMENTS.FILE(docId));
    const entry = { blob, url: URL.createObjectURL(blob) };
    this.fileCache.set(docId, entry);
    return entry;
  }

  pruneFileCache() {
    const ids = new Set(this.documents.map((d) => d.id));
    for (const [id, entry] of this.fileCache) {
      if (!ids.has(id)) {
        URL.revokeObjectURL(entry.url);
        this.fileCache.delete(id);
      }
    }
  }

  getDownloadName(doc) {
    // Multer stores files as "<timestamp>-<originalname>"; strip the prefix.
    const stored = (doc.fileName || "").replace(/^\d+-/, "");
    return stored || doc.name || "document";
  }

  async downloadDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc?.hasFile) return;

    try {
      const { url } = await this.getFile(docId);
      const link = document.createElement("a");
      link.href = url;
      link.download = this.getDownloadName(doc);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(err.message || "Download failed.");
    }
  }

  async shareDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc?.hasFile) return;

    try {
      const { blob } = await this.getFile(docId);
      const file = new File([blob], this.getDownloadName(doc), {
        type: blob.type || doc.mimeType || "application/octet-stream"
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: doc.name });
      } else {
        toast.info("Sharing isn't supported in this browser. Use Download instead.");
      }
    } catch (err) {
      if (err?.name === "AbortError") return; // user dismissed the share sheet
      toast.error(err.message || "Share failed.");
    }
  }

  // 5. Two-Step OCR Preview + Confirm Upload Workflow
  openUploadModal() {
    let selectedFile = null;
    let currentUploadId = null;
    let scanToken = 0; // guards against a slower, older OCR request overwriting a newer one

    const contentHtml = `
      <form id="upload-doc-form" novalidate>
        <div class="upload-drop-zone" id="modal-drop-zone" tabindex="0" role="button" aria-label="Upload document file drop zone">
          <input type="file" id="modal-file-input" style="display: none;" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          <div class="upload-zone-icon" aria-hidden="true">${ICONS.upload(44)}</div>
          <h3 class="upload-zone-title">Upload Document</h3>
          <p class="upload-zone-subtitle">Drag & drop your file here, or click to browse</p>
          <p class="upload-zone-hint">Supports: PDF, JPG, PNG (Max 15MB) | Live OCR Auto-Tagging</p>

          <div class="upload-selected-preview" id="modal-file-preview">
            <div class="preview-file-details">
              ${ICONS.file(20)}
              <div>
                <div class="preview-file-name" id="preview-name">file.pdf</div>
                <div class="preview-file-size" id="preview-size">Running OCR...</div>
              </div>
            </div>
            <button type="button" class="preview-remove-btn" id="preview-remove-btn" aria-label="Remove selected file">&times;</button>
          </div>
        </div>
        <div class="form-error" id="file-error" style="display: none; margin-bottom: 1rem;"></div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label form-label-required" for="upload-doc-name">Document Name (Auto-Suggested by OCR)</label>
          <input type="text" class="form-input" id="upload-doc-name" placeholder="e.g. Semester Marksheet" required />
          <div class="form-error" id="name-error" style="display: none;"></div>
        </div>

        <div class="grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label form-label-required" for="upload-doc-category">Category</label>
            <select class="form-select" id="upload-doc-category" required>
              <option value="Academic">Academic</option>
              <option value="Career">Career</option>
              <option value="Achievements">Achievements</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="upload-doc-expiry-date">Expiry Date (Optional)</label>
            <input type="date" class="form-input" id="upload-doc-expiry-date" />
          </div>
        </div>

        <div id="ocr-status-banner" style="font-size: 0.8125rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.5rem;">
          ${ICONS.check(16)}
          <span>Select a file to run Hybrid OCR & auto-detect document type.</span>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-save-upload">
        ${ICONS.upload(16)}
        <span>Confirm & Save Document</span>
      </button>
    `;

    modal.open({
      title: "Upload Document to Vault",
      contentHtml,
      footerHtml
    });

    const dropZone = document.getElementById("modal-drop-zone");
    const fileInput = document.getElementById("modal-file-input");
    const previewBox = document.getElementById("modal-file-preview");
    const previewName = document.getElementById("preview-name");
    const previewSize = document.getElementById("preview-size");
    const removeBtn = document.getElementById("preview-remove-btn");
    const nameInput = document.getElementById("upload-doc-name");
    const categorySelect = document.getElementById("upload-doc-category");
    const fileError = document.getElementById("file-error");
    const ocrBanner = document.getElementById("ocr-status-banner");
    const saveBtn = document.getElementById("btn-save-upload");

    // Save stays disabled until OCR returns an uploadId for the selected file.
    if (saveBtn) saveBtn.disabled = true;

    const showFileError = (message) => {
      if (!fileError) return;
      fileError.textContent = message;
      fileError.style.display = "block";
    };

    async function handleFile(file) {
      if (!file) return;

      const allowedExts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        if (fileError) {
          fileError.textContent = "Unsupported format. Please upload PDF, JPG, or PNG.";
          fileError.style.display = "block";
        }
        return;
      }

      if (fileError) fileError.style.display = "none";
      selectedFile = file;
      currentUploadId = null;
      const token = ++scanToken;

      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = "Scanning with OCR...";
      if (previewBox) previewBox.classList.add("is-visible");
      if (saveBtn) saveBtn.disabled = true;

      try {
        const previewRes = await api.uploadDocument(file);
        if (token !== scanToken) return; // a newer file was picked meanwhile

        if (!previewRes?.uploadId) {
          throw new Error("The server didn't return an upload ID. Please try again.");
        }
        currentUploadId = previewRes.uploadId;

        const suggestedTitle = previewRes.suggestions?.title || file.name;
        const suggestedCategory = previewRes.suggestions?.category || "Academic";

        if (nameInput) nameInput.value = suggestedTitle;
        if (categorySelect) {
          const matchOption = Array.from(categorySelect.options).find(
            (opt) => opt.value.toLowerCase() === suggestedCategory.toLowerCase()
          );
          if (matchOption) categorySelect.value = matchOption.value;
        }

        if (previewSize) {
          previewSize.textContent = `${(file.size / 1024).toFixed(0)} KB • OCR Detected: ${suggestedTitle}`;
        }
        if (ocrBanner) {
          ocrBanner.innerHTML = `${ICONS.check(16)} <span>OCR Complete (${previewRes.sourceType || "hybrid"}): Auto-categorized as <strong>${suggestedCategory}</strong>.</span>`;
        }
        toast.success(`OCR identified: ${suggestedTitle}`);
      } catch (err) {
        if (token !== scanToken) return;
        currentUploadId = null;
        const reason = err.message || "OCR preview failed.";
        const sentence = /[.!?]$/.test(reason) ? reason : `${reason}.`;
        if (previewSize) previewSize.textContent = "OCR scan failed";
        showFileError(`Couldn't process this file: ${sentence} Remove it and try again.`);
        if (ocrBanner) {
          ocrBanner.innerHTML = `<span>OCR didn't complete, so the document can't be saved yet.</span>`;
        }
        toast.error(reason);
      } finally {
        if (token === scanToken && saveBtn) saveBtn.disabled = !currentUploadId;
      }
    }

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", (e) => {
        if (e.target.closest("#preview-remove-btn")) return;
        fileInput.click();
      });
      fileInput.addEventListener("change", (e) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
      });
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("is-dragover");
      });
      dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragover"));
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("is-dragover");
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
      });
    }

    removeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedFile = null;
      currentUploadId = null;
      scanToken++; // discard any OCR request still in flight
      if (fileInput) fileInput.value = "";
      if (fileError) fileError.style.display = "none";
      if (saveBtn) saveBtn.disabled = true;
      if (ocrBanner) {
        ocrBanner.innerHTML = `${ICONS.check(16)} <span>Select a file to run Hybrid OCR & auto-detect document type.</span>`;
      }
      if (previewBox) previewBox.classList.remove("is-visible");
    });

    saveBtn?.addEventListener("click", async () => {
      const name = nameInput?.value.trim();
      const nameError = document.getElementById("name-error");

      if (!currentUploadId) {
        showFileError(
          selectedFile
            ? "This file hasn't been processed yet. Wait for OCR to finish, or remove it and try again."
            : "Please choose a document file first."
        );
        return;
      }

      if (!name) {
        if (nameError) {
          nameError.textContent = "Please enter a document name.";
          nameError.style.display = "block";
        }
        return;
      }

      const category = categorySelect?.value || "Academic";
      const expiryDate = document.getElementById("upload-doc-expiry-date")?.value || undefined;

      saveBtn.disabled = true;
      try {
        await api.post(CONFIG.ENDPOINTS.DOCUMENTS.CONFIRM, {
          uploadId: currentUploadId,
          title: name,
          category,
          expiryDate,
          isTrackOnly: false
        });

        modal.close();
        toast.success(`"${name}" verified & saved to your vault!`);
        await this.loadDocuments();
        this.render();
      } catch (err) {
        toast.error(err.message || "Failed to confirm document.");
      } finally {
        saveBtn.disabled = !currentUploadId;
      }
    });
  }

  openTrackModal() {
    toast.info("To track a document with OCR & expiry alerts, please use Upload Document and set an Expiry Date.");
    this.openUploadModal();
  }

  viewDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    const contentHtml = `
      <div class="view-doc-dialog">
        <div style="display: flex; align-items: center; gap: 0.875rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
          <div class="doc-card-icon ${doc.type === "doc" ? "is-doc" : "is-pdf"}">${ICONS.file(36)}</div>
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.25rem 0;">${doc.name}</h3>
            <span class="doc-category-pill">${doc.category}</span>
          </div>
        </div>
        <div class="grid-2" style="margin-bottom: 1.25rem;">
          <div class="stat-card" style="padding: 1rem 1.25rem;">
            <span class="stat-card-label">Uploaded</span>
            <span style="font-size: 1.125rem; font-weight: 600;">${doc.date}</span>
          </div>
          <div class="stat-card" style="padding: 1rem 1.25rem;">
            <span class="stat-card-label">Expiry Date</span>
            <span style="font-size: 1.125rem; font-weight: 600;">${doc.expiryDate || "Does not expire"}</span>
          </div>
        </div>
        <div style="background-color: var(--color-bg); padding: 1rem 1.25rem; border-radius: 8px; border: 1px solid var(--color-border);">
          <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 0.5rem;">Extracted OCR Text</div>
          <p style="margin: 0; font-size: 0.85rem; white-space: pre-wrap; max-height: 180px; overflow-y: auto;">${doc.extractedText || "No text extracted."}</p>
        </div>
      </div>
    `;

    modal.open({
      title: "Document Details",
      contentHtml,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-modal-close>Close</button>
        <button type="button" class="btn btn-primary" id="btn-modal-edit-doc">${ICONS.edit(16)} <span>Edit Details</span></button>
      `
    });

    document.getElementById("btn-modal-edit-doc")?.addEventListener("click", () => {
      modal.close();
      this.editDocument(docId);
    });
  }

  editDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    modal.open({
      title: `Edit "${doc.name}"`,
      contentHtml: `
        <form id="edit-doc-form" novalidate>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label form-label-required" for="edit-doc-name">Document Name</label>
            <input type="text" class="form-input" id="edit-doc-name" value="${doc.name}" required />
          </div>
          <div class="grid-2" style="margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="edit-doc-category">Category</label>
              <select class="form-select" id="edit-doc-category">
                <option value="Academic" ${doc.category === "Academic" ? "selected" : ""}>Academic</option>
                <option value="Career" ${doc.category === "Career" ? "selected" : ""}>Career</option>
                <option value="Achievements" ${doc.category === "Achievements" ? "selected" : ""}>Achievements</option>
                <option value="Health" ${doc.category === "Health" ? "selected" : ""}>Health</option>
                <option value="Finance" ${doc.category === "Finance" ? "selected" : ""}>Finance</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-doc-expiry">Expiry Date</label>
              <input type="date" class="form-input" id="edit-doc-expiry" value="${doc.rawExpiry ? doc.rawExpiry.split("T")[0] : ""}" />
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-edit">${ICONS.check(16)} <span>Update Details</span></button>
      `
    });

    document.getElementById("btn-save-edit")?.addEventListener("click", async () => {
      const title = document.getElementById("edit-doc-name")?.value.trim();
      const category = document.getElementById("edit-doc-category")?.value;
      const expiryDate = document.getElementById("edit-doc-expiry")?.value || null;
      if (!title) return;

      try {
        await api.put(CONFIG.ENDPOINTS.DOCUMENTS.UPDATE(docId), { title, category, expiryDate });
        modal.close();
        toast.success(`"${title}" updated.`);
        await this.loadDocuments();
        this.render();
      } catch (err) {
        toast.error(err.message || "Update failed.");
      }
    });
  }

  confirmDeleteDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    modal.open({
      title: "Confirm Deletion",
      contentHtml: `<p>Are you sure you want to permanently delete <strong>"${doc.name}"</strong>?</p>`,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
        <button type="button" class="btn btn-danger" id="btn-confirm-delete">${ICONS.trash(16)} <span>Yes, Delete</span></button>
      `
    });

    document.getElementById("btn-confirm-delete")?.addEventListener("click", async () => {
      try {
        await api.delete(CONFIG.ENDPOINTS.DOCUMENTS.DELETE(docId));
        modal.close();
        toast.success(`"${doc.name}" deleted.`);
        await this.loadDocuments();
        this.render();
      } catch (err) {
        toast.error(err.message || "Delete failed.");
      }
    });
  }
}

export const vaultController = new VaultController();
export function initVault() {
  vaultController.init();
}