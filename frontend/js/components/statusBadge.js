/**
 * DocuPing - StatusBadge Component
 * Renders status pill tags matching screenshots 8 and 9.
 */

/**
 * Generates HTML string for a StatusBadge
 * @param {Object} options
 * @param {string} options.text - Label text (e.g., 'Soon', 'Upcoming')
 * @param {'soon' | 'upcoming' | 'missing' | 'default'} options.status - Status variant
 */
export function createStatusBadge({ text, status = "upcoming" } = {}) {
  const normalized = status.toLowerCase();
  let statusClass = "status-badge-upcoming";

  if (normalized === "soon") {
    statusClass = "status-badge-soon";
  } else if (normalized === "missing") {
    statusClass = "status-badge-missing";
  }

  return `<span class="status-badge ${statusClass}">${text}</span>`;
}
