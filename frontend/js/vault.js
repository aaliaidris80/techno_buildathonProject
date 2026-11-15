/**
 * DocuPing - My Vault Page Controller
 * Matches Screenshot 4 (4. My Vault@1x.png), Screenshot 6 (Upload) & Screenshot 7 (Track Only)
 * Manages search, category filtering, sorting, modals, file validation, and prototype persistence.
 */

import { CONFIG } from "./config.js";
import { modal } from "./components/modal.js";
import { toast } from "./components/toast.js";
import { ICONS } from "./utils/icons.js";
import { createDocumentCard } from "./components/documentCard.js";

const STORAGE_KEY = "docuping_documents";

export const INITIAL_DOCUMENTS = [
  {
    id: "doc-1",
    name: "Semester Marksheet.pdf",
    type: "pdf",
    category: "Academic",
    date: "12 Oct 2025",
    issueDate: "2025-10-12",
    expiryDate: null,
    status: "valid",
    isTracked: false,
    size: "1.4 MB",
    notes: "Semester 5 official grade sheet issued by university."
  },
  {
    id: "doc-2",
    name: "ICPC Certificate.pdf",
    type: "pdf",
    category: "Achievements",
    date: "08 Oct 2025",
    issueDate: "2025-10-08",
    expiryDate: null,
    status: "valid",
    isTracked: false,
    size: "820 KB",
    notes: "Regional qualifying round participation certificate."
  },
  {
    id: "doc-3",
    name: "Resume.pdf",
    type: "doc",
    category: "Career",
    date: "05 Oct 2025",
    issueDate: "2025-10-05",
    expiryDate: null,
    status: "valid",
    isTracked: false,
    size: "340 KB",
    notes: "Updated software developer resume (Autumn 2025)."
  },
  {
    id: "doc-4",
    name: "Passport.pdf",
    type: "pdf",
    category: "Academic",
    date: "20 Sep 2025",
    issueDate: "2016-01-15",
    expiryDate: "14 Dec 2025",
    status: "soon",
    isTracked: false,
    size: "2.1 MB",
    notes: "Passport identification page. Needs renewal soon."
  },
  {
    id: "doc-5",
    name: "Health Insurance Card.png",
    type: "image",
    category: "Health",
    date: "15 Aug 2025",
    issueDate: "2025-04-01",
    expiryDate: "31 Mar 2026",
    status: "valid",
    isTracked: false,
    size: "1.2 MB",
    notes: "Student group mediclaim policy card."
  },
  {
    id: "doc-6",
    name: "College ID Card",
    type: "track",
    category: "Academic",
    date: "01 Aug 2025",
    issueDate: "2024-08-01",
    expiryDate: "30 Jun 2027",
    status: "tracked",
    isTracked: true,
    reminder: "30 days before",
    notes: "Campus library & hostel pass details tracked for expiry."
  },
  {
    id: "doc-7",
    name: "Fee Receipt.pdf",
    type: "pdf",
    category: "Academic",
    date: "28 Aug 2025",
    issueDate: "2025-08-28",
    expiryDate: null,
    status: "valid",
    isTracked: false,
    size: "650 KB",
    notes: "Semester 6 tuition fee receipt acknowledgment."
  },
  {
    id: "doc-8",
    name: "Internship Offer Letter.docx",
    type: "doc",
    category: "Career",
    date: "18 Jul 2025",
    issueDate: "2025-07-18",
    expiryDate: null,
    status: "valid",
    isTracked: false,
    size: "410 KB",
    notes: "Summer software engineering internship confirmation."
  }
];

class VaultController {
  constructor() {
    this.documents = [];
    this.state = {
      searchQuery: "",
      category: "all",
      sortBy: "recent"
    };
  }

  init() {
    this.loadDocuments();
    this.checkUrlCategoryParam();
    this.bindEvents();
    this.render();
  }

  // 1. Storage & State Management
  loadDocuments() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.documents = JSON.parse(stored);
      } else {
        this.documents = [...INITIAL_DOCUMENTS];
        this.saveDocuments();
      }
    } catch (e) {
      console.warn("Storage error, using mock documents:", e);
      this.documents = [...INITIAL_DOCUMENTS];
    }
  }

  saveDocuments() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.documents));
    } catch (e) {
      console.warn("Storage write error:", e);
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

  // 2. Event Binding
  bindEvents() {
    // Search input
    const searchInput = document.getElementById("vault-search-input");
    const clearBtn = document.getElementById("vault-search-clear");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.searchQuery = e.target.value.trim().toLowerCase();
        if (clearBtn) {
          clearBtn.style.display = this.state.searchQuery ? "flex" : "none";
        }
        this.render();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        this.state.searchQuery = "";
        clearBtn.style.display = "none";
        this.render();
      });
    }

    // Category filter pills
    const pillsContainer = document.getElementById("vault-filter-pills");
    if (pillsContainer) {
      pillsContainer.addEventListener("click", (e) => {
        const pill = e.target.closest(".vault-filter-pill");
        if (!pill) return;

        const category = pill.getAttribute("data-category") || "all";
        this.setCategory(category);
      });
    }

    // Sort select
    const sortSelect = document.getElementById("vault-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.state.sortBy = e.target.value;
        this.render();
      });
    }

    // Action buttons: Upload & Track Only
    const uploadBtn = document.getElementById("btn-upload-doc");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => this.openUploadModal());
    }

    const trackBtn = document.getElementById("btn-track-doc");
    if (trackBtn) {
      trackBtn.addEventListener("click", () => this.openTrackModal());
    }

    // Document Grid Event Delegation (Cards, Menus, Actions)
    const grid = document.getElementById("vault-docs-grid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        // Menu toggle button
        const menuBtn = e.target.closest('[data-action="menu"]');
        if (menuBtn) {
          e.stopPropagation();
          const docId = menuBtn.getAttribute("data-doc-id");
          this.toggleDocumentMenu(docId);
          return;
        }

        // Action menu items
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

        // Card click (defaults to viewing document)
        const card = e.target.closest(".doc-card");
        if (card && !e.target.closest(".doc-card-actions")) {
          const docId = card.getAttribute("data-doc-id");
          this.viewDocument(docId);
        }
      });
    }

    // Close menus on outside click
    document.addEventListener("click", () => {
      this.closeAllMenus();
    });

    // Close menus on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllMenus();
      }
    });
  }

  setCategory(category) {
    this.state.category = category.toLowerCase();

    // Update active pill styling
    const pills = document.querySelectorAll(".vault-filter-pill");
    pills.forEach((p) => {
      const pCat = p.getAttribute("data-category") || "all";
      if (pCat.toLowerCase() === this.state.category) {
        p.classList.add("is-active");
        p.setAttribute("aria-selected", "true");
      } else {
        p.classList.remove("is-active");
        p.setAttribute("aria-selected", "false");
      }
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
    document.querySelectorAll(".doc-menu-dropdown.is-open").forEach((m) => {
      m.classList.remove("is-open");
    });
    document.querySelectorAll('[data-action="menu"][aria-expanded="true"]').forEach((b) => {
      b.setAttribute("aria-expanded", "false");
    });
  }

  // 3. Filtering and Sorting Pipeline
  getFilteredDocuments() {
    let result = [...this.documents];

    // Filter by Category
    if (this.state.category !== "all") {
      result = result.filter(
        (doc) => doc.category.toLowerCase() === this.state.category
      );
    }

    // Filter by Search Query
    if (this.state.searchQuery) {
      const q = this.state.searchQuery;
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          (doc.notes && doc.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (this.state.sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.state.sortBy === "expiry") {
      result.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });
    } else {
      // "recent" default (date descending matching Screenshot 4)
      result.sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });
    }

    return result;
  }

  // 4. Render Grid & Counts
  render() {
    const grid = document.getElementById("vault-docs-grid");
    const countBadge = document.getElementById("vault-count-badge");
    if (!grid) return;

    const filtered = this.getFilteredDocuments();

    // Update document count badge
    if (countBadge) {
      countBadge.textContent = `${this.documents.length} document${this.documents.length === 1 ? "" : "s"}`;
    }

    // Render Empty State if no matches
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="vault-empty-state" role="region" aria-label="No documents found">
          <div class="empty-state-icon" aria-hidden="true">
            ${ICONS.search(36)}
          </div>
          <h3 class="empty-state-title">No documents found</h3>
          <p class="empty-state-desc">
            ${
              this.state.searchQuery
                ? `No documents matched "${this.state.searchQuery}" in ${this.state.category === "all" ? "any category" : this.state.category}.`
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

      const resetBtn = document.getElementById("btn-reset-filters");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          this.state.searchQuery = "";
          const searchInput = document.getElementById("vault-search-input");
          if (searchInput) searchInput.value = "";
          this.setCategory("all");
        });
      }

      const emptyUploadBtn = document.getElementById("btn-empty-upload");
      if (emptyUploadBtn) {
        emptyUploadBtn.addEventListener("click", () => this.openUploadModal());
      }

      return;
    }

    // Render Document Cards
    grid.innerHTML = filtered.map((doc) => createDocumentCard(doc)).join("");
  }

  // 5. Upload Document Modal Workflow (Screenshot 6)
  openUploadModal() {
    let selectedFile = null;

    const contentHtml = `
      <form id="upload-doc-form" novalidate>
        <!-- Drag & Drop Zone -->
        <div class="upload-drop-zone" id="modal-drop-zone" tabindex="0" role="button" aria-label="Upload document file drop zone">
          <input type="file" id="modal-file-input" style="display: none;" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          <div class="upload-zone-icon" aria-hidden="true">
            ${ICONS.upload(44)}
          </div>
          <h3 class="upload-zone-title">Upload Document</h3>
          <p class="upload-zone-subtitle">Drag & drop your file here, or click to browse</p>
          <p class="upload-zone-hint">Supports: PDF, DOC, DOCX, JPG, PNG (Max 15MB) | OCR enabled</p>

          <div class="upload-selected-preview" id="modal-file-preview">
            <div class="preview-file-details">
              ${ICONS.file(20)}
              <div>
                <div class="preview-file-name" id="preview-name">file.pdf</div>
                <div class="preview-file-size" id="preview-size">1.2 MB</div>
              </div>
            </div>
            <button type="button" class="preview-remove-btn" id="preview-remove-btn" aria-label="Remove selected file">&times;</button>
          </div>
        </div>
        <div class="form-error" id="file-error" style="display: none; margin-bottom: 1rem;"></div>

        <!-- Document Details Form -->
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label form-label-required" for="upload-doc-name">Document Name</label>
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
            <label class="form-label" for="upload-doc-issue-date">Issue Date</label>
            <input type="date" class="form-input" id="upload-doc-issue-date" />
          </div>
        </div>

        <div class="grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" for="upload-doc-expiry-date">Expiry Date (Optional)</label>
            <input type="date" class="form-input" id="upload-doc-expiry-date" />
          </div>
          <div class="form-group">
            <label class="form-label" for="upload-doc-reminder">Reminder Preference</label>
            <select class="form-select" id="upload-doc-reminder">
              <option value="30 days before">30 days before</option>
              <option value="14 days before">14 days before</option>
              <option value="7 days before">7 days before</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label" for="upload-doc-notes">Notes (Optional)</label>
          <textarea class="form-textarea" id="upload-doc-notes" rows="2" placeholder="Add optional tags, references, or context..."></textarea>
        </div>

        <div style="font-size: 0.8125rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.5rem;">
          ${ICONS.check(16)}
          <span>OCR will automatically extract key text to verify document authenticity.</span>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-save-upload">
        ${ICONS.upload(16)}
        <span>Save Document</span>
      </button>
    `;

    modal.open({
      title: "Upload Document to Vault",
      contentHtml,
      footerHtml
    });

    // Wire Drag & Drop and File Picker
    const dropZone = document.getElementById("modal-drop-zone");
    const fileInput = document.getElementById("modal-file-input");
    const previewBox = document.getElementById("modal-file-preview");
    const previewName = document.getElementById("preview-name");
    const previewSize = document.getElementById("preview-size");
    const removeBtn = document.getElementById("preview-remove-btn");
    const nameInput = document.getElementById("upload-doc-name");
    const fileError = document.getElementById("file-error");

    function handleFile(file) {
      if (!file) return;

      const allowedExts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
      const ext = "." + file.name.split(".").pop().toLowerCase();
      const maxSize = 15 * 1024 * 1024; // 15MB

      if (!allowedExts.includes(ext)) {
        if (fileError) {
          fileError.textContent = "Unsupported format. Please upload PDF, DOC, DOCX, JPG, or PNG.";
          fileError.style.display = "block";
        }
        return;
      }

      if (file.size > maxSize) {
        if (fileError) {
          fileError.textContent = "File size exceeds 15MB limit. Please select a smaller file.";
          fileError.style.display = "block";
        }
        return;
      }

      if (fileError) fileError.style.display = "none";
      selectedFile = file;

      // Update preview UI
      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      if (previewBox) previewBox.classList.add("is-visible");

      // Auto-populate document name if empty
      if (nameInput && !nameInput.value) {
        nameInput.value = file.name;
      }
    }

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", (e) => {
        if (e.target.closest("#preview-remove-btn")) return;
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      });

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("is-dragover");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("is-dragover");
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("is-dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedFile = null;
        if (fileInput) fileInput.value = "";
        if (previewBox) previewBox.classList.remove("is-visible");
      });
    }

    // Save button handler
    const saveBtn = document.getElementById("btn-save-upload");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const name = nameInput?.value.trim();
        const nameError = document.getElementById("name-error");

        if (!name) {
          if (nameError) {
            nameError.textContent = "Please enter a document name.";
            nameError.style.display = "block";
          }
          nameInput?.focus();
          return;
        }

        const category = document.getElementById("upload-doc-category")?.value || "Academic";
        const issueDate = document.getElementById("upload-doc-issue-date")?.value || "";
        const expiryDate = document.getElementById("upload-doc-expiry-date")?.value || null;
        const notes = document.getElementById("upload-doc-notes")?.value.trim() || "";

        let fileType = "pdf";
        if (selectedFile) {
          const ext = selectedFile.name.split(".").pop().toLowerCase();
          if (["doc", "docx"].includes(ext)) fileType = "doc";
          else if (["jpg", "jpeg", "png"].includes(ext)) fileType = "image";
        }

        const newDoc = {
          id: "doc-" + Date.now(),
          name,
          type: fileType,
          category,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          issueDate,
          expiryDate: expiryDate
            ? new Date(expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : null,
          status: expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 86400000) ? "soon" : "valid",
          isTracked: false,
          size: selectedFile ? (selectedFile.size / 1024).toFixed(0) + " KB" : "1.2 MB",
          notes
        };

        this.documents.unshift(newDoc);
        this.saveDocuments();
        modal.close();
        toast.success(`"${name}" uploaded successfully.`);
        this.render();
      });
    }
  }

  // 6. Track Only Modal Workflow (Screenshot 7)
  openTrackModal() {
    const contentHtml = `
      <form id="track-doc-form" novalidate>
        <div class="track-header-badge">
          <div class="track-badge-icon" aria-hidden="true">
            ${ICONS.clock(28)}
          </div>
          <div class="track-badge-text">
            <h3>Track Only</h3>
            <p>Add a reminder without uploading the file</p>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label form-label-required" for="track-doc-name">Document Name *</label>
            <input type="text" class="form-input" id="track-doc-name" placeholder="e.g. College ID Card" required />
            <div class="form-error" id="track-name-error" style="display: none;"></div>
          </div>
          <div class="form-group">
            <label class="form-label form-label-required" for="track-doc-type">Document Type *</label>
            <select class="form-select" id="track-doc-type" required>
              <option value="Academic">Academic</option>
              <option value="Career">Career</option>
              <option value="Achievements">Achievements</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" for="track-doc-issue-date">Issue Date</label>
            <input type="date" class="form-input" id="track-doc-issue-date" />
          </div>
          <div class="form-group">
            <label class="form-label form-label-required" for="track-doc-expiry-date">Expiry Date *</label>
            <input type="date" class="form-input" id="track-doc-expiry-date" required />
            <div class="form-error" id="track-expiry-error" style="display: none;"></div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="track-doc-reminder">Reminder Preference</label>
          <select class="form-select" id="track-doc-reminder">
            <option value="30 days before">30 days before</option>
            <option value="14 days before">14 days before</option>
            <option value="7 days before">7 days before</option>
            <option value="1 day before">1 day before</option>
            <option value="On expiry date">On expiry date</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" for="track-doc-notes">Notes (Optional)</label>
          <textarea class="form-textarea" id="track-doc-notes" rows="2" placeholder="e.g. Card number, renewal office, requirements..."></textarea>
        </div>

        <!-- Highlight checkmarks matching screenshot 7 -->
        <ul class="track-highlights-list" aria-label="Tracked benefits">
          <li class="track-highlight-item">
            <span class="track-check-icon" aria-hidden="true">${ICONS.check(12)}</span>
            <span>Add document details manually without uploading files</span>
          </li>
          <li class="track-highlight-item">
            <span class="track-check-icon" aria-hidden="true">${ICONS.check(12)}</span>
            <span>Set expiry date & get notified automatically</span>
          </li>
          <li class="track-highlight-item">
            <span class="track-check-icon" aria-hidden="true">${ICONS.check(12)}</span>
            <span>Never miss important university or career deadlines</span>
          </li>
        </ul>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-save-track">
        ${ICONS.bell(16)}
        <span>+ Add Tracked Record</span>
      </button>
    `;

    modal.open({
      title: "Add Document to Track Only",
      contentHtml,
      footerHtml
    });

    const saveTrackBtn = document.getElementById("btn-save-track");
    if (saveTrackBtn) {
      saveTrackBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("track-doc-name");
        const expiryInput = document.getElementById("track-doc-expiry-date");
        const nameError = document.getElementById("track-name-error");
        const expiryError = document.getElementById("track-expiry-error");

        let isValid = true;
        const name = nameInput?.value.trim();
        const expiry = expiryInput?.value;

        if (!name) {
          if (nameError) {
            nameError.textContent = "Please enter document name.";
            nameError.style.display = "block";
          }
          isValid = false;
        } else if (nameError) {
          nameError.style.display = "none";
        }

        if (!expiry) {
          if (expiryError) {
            expiryError.textContent = "Expiry date is required for tracked items.";
            expiryError.style.display = "block";
          }
          isValid = false;
        } else if (expiryError) {
          expiryError.style.display = "none";
        }

        if (!isValid) return;

        const category = document.getElementById("track-doc-type")?.value || "Academic";
        const issueDate = document.getElementById("track-doc-issue-date")?.value || "";
        const reminder = document.getElementById("track-doc-reminder")?.value || "30 days before";
        const notes = document.getElementById("track-doc-notes")?.value.trim() || "";

        const newTrackedDoc = {
          id: "track-" + Date.now(),
          name,
          type: "track",
          category,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          issueDate,
          expiryDate: new Date(expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          status: "tracked",
          isTracked: true,
          reminder,
          notes
        };

        this.documents.unshift(newTrackedDoc);
        this.saveDocuments();
        modal.close();
        toast.success(`Tracked reminder set for "${name}".`);
        this.render();
      });
    }
  }

  // 7. View Document Details Modal
  viewDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    const contentHtml = `
      <div class="view-doc-dialog">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; gap: 0.875rem;">
            <div class="doc-card-icon ${doc.isTracked ? 'is-tracked' : (doc.type === 'doc' ? 'is-doc' : 'is-pdf')}">
              ${doc.isTracked ? ICONS.clock(36) : ICONS.file(36)}
            </div>
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.25rem 0;">${doc.name}</h3>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span class="doc-category-pill">${doc.category}</span>
                <span class="doc-type-badge ${doc.type === 'doc' ? 'is-doc' : 'is-pdf'}">${doc.type.toUpperCase()}</span>
                ${doc.isTracked ? '<span class="status-badge status-badge-tracked">Tracked Record</span>' : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom: 1.25rem;">
          <div class="stat-card" style="padding: 1rem 1.25rem;">
            <span class="stat-card-label">Uploaded / Added</span>
            <span style="font-size: 1.125rem; font-weight: 600; color: var(--color-text-primary);">${doc.date || "N/A"}</span>
          </div>
          <div class="stat-card" style="padding: 1rem 1.25rem;">
            <span class="stat-card-label">Expiry Date</span>
            <span style="font-size: 1.125rem; font-weight: 600; color: ${doc.expiryDate ? 'var(--color-primary)' : 'var(--color-text-muted)'};">
              ${doc.expiryDate || "Does not expire"}
            </span>
          </div>
        </div>

        ${
          doc.notes
            ? `
          <div style="background-color: var(--color-bg); padding: 1rem 1.25rem; border-radius: 8px; border: 1px solid var(--color-border); margin-bottom: 1.25rem;">
            <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 0.25rem;">Notes</div>
            <p style="margin: 0; font-size: 0.875rem; color: var(--color-text-primary); line-height: 1.45;">${doc.notes}</p>
          </div>
        `
            : ""
        }

        <div style="background-color: #FAF8F4; border: 1px dashed #DDD7CE; border-radius: 8px; padding: 2rem; text-align: center;">
          <div style="color: var(--color-primary); margin-bottom: 0.5rem;">${ICONS.file(32)}</div>
          <div style="font-size: 0.9375rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 0.25rem;">Document Preview Available</div>
          <div style="font-size: 0.8125rem; color: var(--color-text-muted);">Encrypted storage &bull; Verified metadata</div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-modal-close>Close</button>
      <button type="button" class="btn btn-primary" id="btn-modal-edit-doc">
        ${ICONS.edit(16)}
        <span>Edit Details</span>
      </button>
    `;

    modal.open({
      title: "Document Details",
      contentHtml,
      footerHtml
    });

    const editBtn = document.getElementById("btn-modal-edit-doc");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        modal.close();
        this.editDocument(docId);
      });
    }
  }

  // 8. Edit Document Details Modal
  editDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    const contentHtml = `
      <form id="edit-doc-form" novalidate>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label form-label-required" for="edit-doc-name">Document Name</label>
          <input type="text" class="form-input" id="edit-doc-name" value="${doc.name}" required />
          <div class="form-error" id="edit-name-error" style="display: none;"></div>
        </div>

        <div class="grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label form-label-required" for="edit-doc-category">Category</label>
            <select class="form-select" id="edit-doc-category" required>
              <option value="Academic" ${doc.category === "Academic" ? "selected" : ""}>Academic</option>
              <option value="Career" ${doc.category === "Career" ? "selected" : ""}>Career</option>
              <option value="Achievements" ${doc.category === "Achievements" ? "selected" : ""}>Achievements</option>
              <option value="Health" ${doc.category === "Health" ? "selected" : ""}>Health</option>
              <option value="Finance" ${doc.category === "Finance" ? "selected" : ""}>Finance</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-doc-expiry">Expiry Date</label>
            <input type="text" class="form-input" id="edit-doc-expiry" placeholder="e.g. 14 Dec 2026" value="${doc.expiryDate || ""}" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label" for="edit-doc-notes">Notes</label>
          <textarea class="form-textarea" id="edit-doc-notes" rows="3">${doc.notes || ""}</textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-save-edit">
        ${ICONS.check(16)}
        <span>Update Details</span>
      </button>
    `;

    modal.open({
      title: `Edit "${doc.name}"`,
      contentHtml,
      footerHtml
    });

    const saveEditBtn = document.getElementById("btn-save-edit");
    if (saveEditBtn) {
      saveEditBtn.addEventListener("click", () => {
        const name = document.getElementById("edit-doc-name")?.value.trim();
        if (!name) {
          const err = document.getElementById("edit-name-error");
          if (err) {
            err.textContent = "Document name cannot be empty.";
            err.style.display = "block";
          }
          return;
        }

        const category = document.getElementById("edit-doc-category")?.value || doc.category;
        const expiryDate = document.getElementById("edit-doc-expiry")?.value.trim() || null;
        const notes = document.getElementById("edit-doc-notes")?.value.trim() || "";

        doc.name = name;
        doc.category = category;
        doc.expiryDate = expiryDate;
        doc.notes = notes;

        this.saveDocuments();
        modal.close();
        toast.success(`"${name}" updated successfully.`);
        this.render();
      });
    }
  }

  // 9. Delete Confirmation Modal
  confirmDeleteDocument(docId) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    const contentHtml = `
      <div style="display: flex; gap: 1rem; align-items: flex-start; padding: 0.5rem 0;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background-color: var(--color-danger-bg); color: var(--color-danger-text); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${ICONS.trash(22)}
        </div>
        <div>
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.5rem 0;">Delete Document?</h3>
          <p style="font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.45; margin: 0;">
            Are you sure you want to permanently delete <strong>"${doc.name}"</strong>? This will remove the document and any active expiration reminders.
          </p>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
      <button type="button" class="btn btn-danger" id="btn-confirm-delete">
        ${ICONS.trash(16)}
        <span>Yes, Delete</span>
      </button>
    `;

    modal.open({
      title: "Confirm Deletion",
      contentHtml,
      footerHtml
    });

    const confirmBtn = document.getElementById("btn-confirm-delete");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        this.documents = this.documents.filter((d) => d.id !== docId);
        this.saveDocuments();
        modal.close();
        toast.success(`"${doc.name}" was deleted.`);
        this.render();
      });
    }
  }
}

export const vaultController = new VaultController();

export function initVault() {
  vaultController.init();
}
