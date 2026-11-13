/**
 * DocuPing - DocumentCard Component
 * Renders individual document file cards matching screenshots 4 and 5.
 */

import { ICONS } from "../utils/icons.js";

/**
 * Generates HTML string for a DocumentCard
 * @param {Object} document
 * @param {string} document.id - Unique ID
 * @param {string} document.name - Document filename
 * @param {string} document.type - 'pdf' | 'doc' | 'image' | 'generic'
 * @param {string} document.date - Formatted date string (e.g., '12 Oct 2025')
 */
export function createDocumentCard({ id, name, type = "pdf", date = "" }) {
  const normalizedType = type.toLowerCase();
  const isPdf = normalizedType.includes("pdf");
  const isDoc = normalizedType.includes("doc");

  const typeClass = isPdf ? "is-pdf" : isDoc ? "is-doc" : "is-generic";
  const badgeText = isPdf ? "PDF" : isDoc ? "DOC" : normalizedType.toUpperCase();

  return `
    <article class="doc-card" data-doc-id="${id}" tabindex="0" role="button" aria-label="Document: ${name}">
      <div class="doc-card-header">
        <span class="doc-card-icon ${typeClass}">
          ${ICONS.file(32)}
        </span>
        <span class="doc-type-badge ${typeClass}">${badgeText}</span>
      </div>

      <h3 class="doc-card-title" title="${name}">${name}</h3>

      <div class="doc-card-footer">
        <time class="doc-card-date">${date}</time>
        <button type="button" class="doc-card-menu-btn" data-action="menu" aria-label="Document options">
          ${ICONS.moreVertical(18)}
        </button>
      </div>
    </article>
  `;
}
