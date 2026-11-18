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
    notes: doc.extractedText ? `OCR Extracted: ${doc.extractedText.slice(0, 140)}...` : ""
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
    const countBadge = document.getElementById("vault-count-badge");
    if (!grid) return;

    const filtered = this.getFilteredDocuments();

    if (countBadge) {
      countBadge.textContent = `${this.documents.length} document${this.documents.length === 1 ? "" : "s"}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="vault-empty-state" role="region" aria-label="No documents found">
          <div class="empty-state-icon" aria-hidden="true">${ICONS.search(36)}</div>
          <h3 class="empty-state-title">No documents found</h3>
          <p class="empty-state-desc">
            ${
              this.state.searchQuery
                ? `No documents matched "${this.state.searchQuery}".`
                : `You don't have any documents in ${this.state.category} yet.`
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
      return;
    }

    grid.innerHTML = filtered.map((doc) => createDocumentCard(doc)).join("");
  }

  // 5. Two-Step OCR Preview + Confirm Upload Workflow
  openUploadModal() {
    let selectedFile = null;
    let currentUploadId = null;

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

      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = "Scanning with OCR...";
      if (previewBox) previewBox.classList.add("is-visible");
      if (saveBtn) saveBtn.disabled = true;

      try {
        const previewRes = await api.uploadDocument(file);
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
        if (previewSize) previewSize.textContent = "OCR scan failed";
        toast.error(err.message || "OCR preview failed.");
      } finally {
        if (saveBtn) saveBtn.disabled = false;
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
      if (fileInput) fileInput.value = "";
      if (previewBox) previewBox.classList.remove("is-visible");
    });

    saveBtn?.addEventListener("click", async () => {
      const name = nameInput?.value.trim();
      const nameError = document.getElementById("name-error");

      if (!currentUploadId) {
        toast.error("Please upload a document file first so OCR can process it.");
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
        saveBtn.disabled = false;
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