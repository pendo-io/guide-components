import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-star-rating> - Star rating poll component
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - max: Maximum number of stars (default: 5)
 * - value: Pre-selected value
 *
 * Events:
 * - pendo-response: Fired when user selects a rating { pollId, value, type: 'NumberScale' }
 *
 * Example:
 *   <pendo-star-rating question="How would you rate this feature?" max="5"></pendo-star-rating>
 */
export class PendoStarRating extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.max = parseInt(this.getAttribute('max') || '5', 10);
        this.value = parseInt(this.getAttribute('value') || '0', 10);

        this.classList.add('pendo-poll', 'pendo-star-rating');
        this.render();
    }

    render() {
        const questionId = this.generateId();

        this.innerHTML = `
            <fieldset class="pendo-poll__fieldset" role="radiogroup" aria-labelledby="${questionId}">
                ${this.question ? `<legend id="${questionId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</legend>` : ''}
                <div class="pendo-star-rating__stars">
                    ${this.renderStars()}
                </div>
            </fieldset>
        `;

        this.setupEventListeners();
    }

    renderStars() {
        let html = '';
        for (let i = 1; i <= this.max; i++) {
            const isSelected = i <= this.value;
            const starId = `${this.pollId}-star-${i}`;
            html += `
                <label class="pendo-star-rating__star ${isSelected ? 'pendo-star-rating__star--selected' : ''}"
                       data-value="${i}">
                    <input type="radio"
                           name="${this.pollId}"
                           id="${starId}"
                           value="${i}"
                           ${isSelected ? 'checked' : ''}
                           class="pendo-sr-only">
                    <svg class="pendo-star-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span class="pendo-sr-only">${i} star${i > 1 ? 's' : ''}</span>
                </label>
            `;
        }
        return html;
    }

    setupEventListeners() {
        const stars = this.querySelectorAll('.pendo-star-rating__star');

        stars.forEach((star, index) => {
            const value = index + 1;

            // Click handler
            star.addEventListener('click', () => this.selectRating(value));

            // Hover effects
            star.addEventListener('mouseenter', () => this.highlightStars(value));
            star.addEventListener('mouseleave', () => this.highlightStars(this.value));

            // Keyboard handler
            const input = star.querySelector('input');
            input.addEventListener('change', () => this.selectRating(value));
        });
    }

    highlightStars(upTo) {
        const stars = this.querySelectorAll('.pendo-star-rating__star');
        stars.forEach((star, index) => {
            star.classList.toggle('pendo-star-rating__star--highlighted', index < upTo);
        });
    }

    selectRating(value) {
        this.value = value;

        // Update visual state
        const stars = this.querySelectorAll('.pendo-star-rating__star');
        stars.forEach((star, index) => {
            star.classList.toggle('pendo-star-rating__star--selected', index < value);
        });

        // Emit response event
        this.emitResponse(this.pollId, value, 'NumberScale');
    }

    /**
     * Get the current selected value
     */
    getValue() {
        return this.value;
    }

    /**
     * Set the value programmatically
     */
    setValue(value) {
        this.selectRating(value);
    }
}

