import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-close-button> - Accessible close button for guides.
 *
 * Renders a close icon positioned in the upper-right corner of the parent
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

        // An icon rather than the "\u00D7" character it replaced: a glyph's ink box sits below the
        // centre of its em box, so the character rendered visibly low in the round hover target no
        // matter how the box was sized. The path is lucide's `x`, drawn on lucide's 24x24 grid.
        button.innerHTML = `
            <svg class="pendo-close-button__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
        `;
        this.appendChild(button);

        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.emitAction('dismiss');
        });
    }
}

export { PendoCloseButton };
