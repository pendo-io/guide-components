import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-link> - Inline link element
 *
 * Attributes:
 * - href: URL to navigate to
 * - target: Link target (_blank, _self, etc.)
 * - action: Optional action instead of href (e.g., "dismiss", "next-step")
 *
 * Example:
 *   <pendo-link href="https://help.example.com">Learn more</pendo-link>
 *   <pendo-link action="next-step">Continue</pendo-link>
 */
export class PendoLink extends PendoBaseElement {
    connectedCallback() {
        const href = this.getAttribute('href');
        const target = this.getAttribute('target') || '_blank';
        const action = this.getAttribute('action');

        const link = document.createElement('a');
        link.className = 'pendo-link';
        link.innerHTML = this.innerHTML;
        this.innerHTML = '';

        if (href) {
            link.href = href;
            link.target = target;
            link.rel = 'noopener noreferrer';
        } else if (action) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const [actionType, param] = action.split(':');
                this.emitAction(actionType, param ? { param } : {});
            });
        }

        this.appendChild(link);
    }
}

