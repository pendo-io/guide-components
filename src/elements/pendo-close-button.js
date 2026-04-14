import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-close-button> - Accessible close button for guides.
 *
 * Renders an "×" icon positioned in the upper-right corner of the parent
 * pendo-guide container. Emits a 'dismiss' action when clicked.
 *
 * Usage:
 *   <pendo-guide>
 *       <pendo-close-button></pendo-close-button>
 *       <pendo-guide-content>...</pendo-guide-content>
 *   </pendo-guide>
 */
class PendoCloseButton extends PendoBaseElement {
    connectedCallback() {
        this.render();
    }

    render() {
        // Style the custom element directly — no inner <button>
        this.classList.add('pendo-close-button');
        this.setAttribute('role', 'button');
        this.setAttribute('tabindex', '0');
        this.setAttribute('aria-label', 'Close');
        this.textContent = '\u00D7'; // × character

        this.addEventListener('click', (e) => {
            e.preventDefault();
            this.emitAction('dismiss');
        });
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.emitAction('dismiss');
            }
        });
    }
}

export { PendoCloseButton };
