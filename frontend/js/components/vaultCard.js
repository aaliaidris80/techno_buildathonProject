/**
 * DocuPing - VaultCard Component
 * Category card for Vault navigation matching Screenshot 3.
 */

import { ICONS } from "../utils/icons.js";

/**
 * Generates HTML string for a VaultCard
 * @param {Object} vault
 * @param {string} vault.id - Category ID (e.g. 'academic', 'career')
 * @param {string} vault.title - Category Name (e.g. 'Academic')
 * @param {string} vault.description - Subtext (e.g. 'Marksheets, ID')
 * @param {string} vault.icon - Key in ICONS object
 * @param {string} vault.href - Link destination
 */
export function createVaultCard({
  id,
  title,
  description,
  icon = "academic",
  href = `pages/vault-category.html?category=${id}`
}) {
  const iconSvg = ICONS[icon] ? ICONS[icon](36) : ICONS.vault(36);

  return `
    <a href="${href}" class="vault-card" data-vault-id="${id}" aria-label="Open ${title} Vault">
      <div class="vault-card-icon" aria-hidden="true">
        ${iconSvg}
      </div>
      <h3 class="vault-card-title">${title}</h3>
      <p class="vault-card-desc">${description}</p>
    </a>
  `;
}
