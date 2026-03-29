import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-divider> - Horizontal divider/separator.
 *
 * A simple horizontal rule for visual separation.
 */
class PendoDivider extends PendoBaseElement {
    connectedCallback() {
        this.classList.add('pendo-guide__divider');
        this.setAttribute('role', 'separator');
        this.setAttribute('aria-hidden', 'true');
    }
}

export { PendoDivider };
