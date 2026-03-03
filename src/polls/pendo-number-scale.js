import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-number-scale> - Generic number scale poll component
 *
 * Displays a horizontal scale of numbers for rating/scoring.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - min: Minimum value (default: 1)
 * - max: Maximum value (default: 5)
 * - value: Pre-selected value
 * - low-label: Label for the low end (optional)
 * - high-label: Label for the high end (optional)
 *
 * Events:
 * - pendo-response: Fired when user selects a number { pollId, value, type: 'NumberScale' }
 *
 * Example:
 *   <pendo-number-scale question="How satisfied are you?" min="1" max="7"></pendo-number-scale>
 *   <pendo-number-scale question="Rate this feature" min="1" max="5" low-label="Poor" high-label="Excellent"></pendo-number-scale>
 */
export class PendoNumberScale extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.min = parseInt(this.getAttribute('min') || '1', 10);
        this.max = parseInt(this.getAttribute('max') || '5', 10);
        this.value = this.getAttribute('value') ? parseInt(this.getAttribute('value'), 10) : null;
        this.lowLabel = this.getAttribute('low-label') || '';
        this.highLabel = this.getAttribute('high-label') || '';

        this.classList.add('pendo-poll', 'pendo-number-scale');
        this.render();
    }

    render() {
        const questionId = this.generateId();
        const hasLabels = this.lowLabel || this.highLabel;

        this.innerHTML = `
            <fieldset class="pendo-poll__fieldset" role="radiogroup" aria-labelledby="${questionId}">
                ${this.question ? `<legend id="${questionId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</legend>` : ''}
                <div class="pendo-number-scale__wrapper">
                    <div class="pendo-number-scale__scale">
                        ${this.renderScale()}
                    </div>
                    ${hasLabels ? `
                    <div class="pendo-number-scale__labels">
                        <span class="pendo-number-scale__label">${this.escapeHtml(this.lowLabel)}</span>
                        <span class="pendo-number-scale__label">${this.escapeHtml(this.highLabel)}</span>
                    </div>
                    ` : ''}
                </div>
            </fieldset>
        `;

        this.setupEventListeners();
    }

    renderScale() {
        const items = [];
        for (let i = this.min; i <= this.max; i++) {
            const isSelected = this.value === i;
            const optionId = `${this.pollId}-num-${i}`;

            items.push(`
                <label class="pendo-number-scale__item ${isSelected ? 'pendo-number-scale__item--selected' : ''}"
                       data-value="${i}">
                    <input type="radio"
                           name="${this.pollId}"
                           id="${optionId}"
                           value="${i}"
                           ${isSelected ? 'checked' : ''}
                           class="pendo-sr-only">
                    <span class="pendo-number-scale__value">${i}</span>
                </label>
            `);
        }
        return items.join('');
    }

    setupEventListeners() {
        const items = this.querySelectorAll('.pendo-number-scale__item');

        items.forEach((item) => {
            const value = parseInt(item.dataset.value, 10);

            item.addEventListener('click', () => this.selectValue(value));

            const input = item.querySelector('input');
            input.addEventListener('change', () => this.selectValue(value));
        });
    }

    selectValue(value) {
        this.value = value;

        // Update visual state
        const items = this.querySelectorAll('.pendo-number-scale__item');
        items.forEach((item) => {
            const itemValue = parseInt(item.dataset.value, 10);
            item.classList.toggle('pendo-number-scale__item--selected', itemValue === value);
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
        if (value >= this.min && value <= this.max) {
            this.selectValue(value);
        }
    }
}

customElements.define('pendo-number-scale', PendoNumberScale);
