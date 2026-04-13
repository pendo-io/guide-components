import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-title> - A heading/title element for guides.
 *
 * Renders as an h2 with proper styling. The text content
 * is taken from the element's innerHTML.
 */
class PendoTitle extends PendoBaseElement {
    connectedCallback() {
        this.classList.add('pendo-guide__title');

        // Ensure it has an ID for aria-labelledby
        if (!this.id) {
            this.id = this.generateId();
        }

        // Set appropriate role for accessibility
        this.setAttribute('role', 'heading');
        this.setAttribute('aria-level', '2');
    }
}

export { PendoTitle };
