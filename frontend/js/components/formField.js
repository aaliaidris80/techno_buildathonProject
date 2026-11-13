/**
 * DocuPing - FormField Component
 * Reusable accessible form input and dropdown builder matching screenshots 1, 2, and 7.
 */

import { ICONS } from "../utils/icons.js";

/**
 * Generates HTML string for a FormField
 * @param {Object} options
 * @param {string} options.id - Input ID and name
 * @param {string} options.label - Label text
 * @param {string} [options.type='text'] - 'text' | 'email' | 'password' | 'date' | 'select' | 'textarea'
 * @param {string} [options.placeholder='']
 * @param {boolean} [options.required=false]
 * @param {string} [options.icon] - Key in ICONS object
 * @param {Array<{value: string, label: string}>} [options.options] - Dropdown options if type is 'select'
 * @param {string} [options.value='']
 * @param {string} [options.hint='']
 * @param {string} [options.error='']
 */
export function createFormField({
  id,
  label,
  type = "text",
  placeholder = "",
  required = false,
  icon = null,
  options = [],
  value = "",
  hint = "",
  error = ""
}) {
  const isSelect = type === "select";
  const isTextarea = type === "textarea";
  const hasIcon = Boolean(icon && ICONS[icon]);
  const iconHtml = hasIcon ? `<span class="input-icon-left">${ICONS[icon](18)}</span>` : "";
  const iconClass = hasIcon ? "has-icon-left" : "";

  let controlHtml = "";

  if (isSelect) {
    const optionsHtml = options
      .map(
        (opt) => `<option value="${opt.value}" ${opt.value === value ? "selected" : ""}>${opt.label}</option>`
      )
      .join("");

    controlHtml = `
      <select id="${id}" name="${id}" class="form-select ${iconClass}" ${required ? "required" : ""}>
        ${placeholder ? `<option value="" disabled ${!value ? "selected" : ""}>${placeholder}</option>` : ""}
        ${optionsHtml}
      </select>
    `;
  } else if (isTextarea) {
    controlHtml = `
      <textarea id="${id}" name="${id}" class="form-textarea ${iconClass}" placeholder="${placeholder}" ${required ? "required" : ""}>${value}</textarea>
    `;
  } else {
    controlHtml = `
      <input 
        type="${type}" 
        id="${id}" 
        name="${id}" 
        value="${value}"
        class="form-input ${iconClass}" 
        placeholder="${placeholder}" 
        ${required ? "required" : ""} 
      />
    `;
  }

  return `
    <div class="form-field" data-field-id="${id}">
      <label for="${id}" class="form-label ${required ? "form-label-required" : ""}">
        ${label}
      </label>
      <div class="input-container">
        ${iconHtml}
        ${controlHtml}
      </div>
      ${hint ? `<span class="form-hint">${hint}</span>` : ""}
      ${error ? `<span class="form-error" role="alert">${error}</span>` : ""}
    </div>
  `;
}
