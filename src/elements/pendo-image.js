import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-image> - Image element for guides.
 *
 * Attributes:
 *   src - Image URL (required)
 *   alt - Alt text for accessibility (required)
 *   width - Image width
 *   height - Image height
 */
class PendoImage extends PendoBaseElement {
    connectedCallback() {
        this.classList.add('pendo-guide__image-container');

        const src = this.getAttribute('src');
        const alt = this.getAttribute('alt') || '';
        const width = this.getAttribute('width');
        const height = this.getAttribute('height');

        if (!src) {
            console.warn('pendo-image: missing required "src" attribute');
            return;
        }

        const img = document.createElement('img');
        img.className = 'pendo-guide__image';
        img.src = src;
        img.alt = alt;

        if (width) img.width = parseInt(width, 10);
        if (height) img.height = parseInt(height, 10);

        // Handle loading states
        img.loading = 'lazy';
        img.addEventListener('error', () => {
            this.classList.add('pendo-guide__image-container--error');
        });

        this.appendChild(img);
    }
}

export { PendoImage };
