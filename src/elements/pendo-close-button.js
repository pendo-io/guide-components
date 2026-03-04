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
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pendo-close-button';
        button.setAttribute('aria-label', 'Close');

        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '\u00D7'; // × character

        button.appendChild(icon);
        this.appendChild(button);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.emitAction('dismiss');
        });
    }
}

customElements.define('pendo-close-button', PendoCloseButton);

export { PendoCloseButton };
