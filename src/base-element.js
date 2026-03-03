/**
 * Base class for all Pendo guide custom elements.
 * Provides common utilities for event emission and component mapping.
 */
export class PendoBaseElement extends HTMLElement {
    /**
     * Emit an action event (next-step, dismiss, link, etc.)
     * @param {string} action - The action type
     * @param {Object} params - Additional parameters for the action
     */
    emitAction(action, params = {}) {
        this.dispatchEvent(new CustomEvent('pendo-action', {
            detail: { action, params },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Emit a poll response event
     * @param {string} pollId - The poll identifier
     * @param {*} value - The response value
     * @param {string} type - The poll type (starRating, nps, freeForm, etc.)
     */
    emitResponse(pollId, value, type = 'rating') {
        this.dispatchEvent(new CustomEvent('pendo-response', {
            detail: { pollId, value, type },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get a custom component mapping if configured
     * @param {string} name - The component name (button, title, etc.)
     * @returns {Function|null} The custom component constructor or null
     */
    getCustomComponent(name) {
        return window.__pendoComponents?.[name] || null;
    }

    /**
     * Generate a unique ID for accessibility purposes
     * @returns {string} A random ID string
     */
    generateId() {
        return 'pendo-' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Escape HTML to prevent XSS in user-provided content
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
