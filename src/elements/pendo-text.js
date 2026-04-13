import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-text> - Body text element for guides.
 *
 * Renders the text content with appropriate styling.
 * Supports basic inline formatting via innerHTML.
 */
class PendoText extends PendoBaseElement {
    connectedCallback() {
        this.classList.add('pendo-guide__text');
    }
}

export { PendoText };
