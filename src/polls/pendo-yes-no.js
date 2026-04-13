import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-yes-no> - Yes/No (PositiveNegative) poll component
 *
 * Renders a binary choice poll as text buttons or thumbs-up/down icons.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - display: Render mode — "button" (default) or "thumbs"
 * - yes-label: Label for the affirmative option (default: "Yes")
 * - no-label: Label for the negative option (default: "No")
 * - value: Pre-selected value ("0" or "1")
 *
 * Events:
 * - pendo-response: Fired when user picks an option { pollId, value, type: 'PositiveNegative' }
 *   value is numeric: 1 for yes, 0 for no
 *
 * Example (buttons):
 *   <pendo-yes-no question="Did you find this helpful?"></pendo-yes-no>
 *
 * Example (thumbs):
 *   <pendo-yes-no question="Was this useful?" display="thumbs"></pendo-yes-no>
 */
export class PendoYesNo extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.display = this.getAttribute('display') || 'button';
        this.yesLabel = this.getAttribute('yes-label') || 'Yes';
        this.noLabel = this.getAttribute('no-label') || 'No';
        this.value = this.hasAttribute('value') ? parseInt(this.getAttribute('value'), 10) : null;

        this.classList.add('pendo-poll', 'pendo-yes-no');
        if (this.display === 'thumbs') {
            this.classList.add('pendo-yes-no--thumbs');
        }
        this.render();
    }

    render() {
        const questionId = this.generateId();

        this.innerHTML = `
            <fieldset class="pendo-poll__fieldset" role="radiogroup" aria-labelledby="${questionId}">
                ${this.question ? `<legend id="${questionId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</legend>` : ''}
                <div class="pendo-yes-no__options">
                    ${this.renderOption(1, this.yesLabel)}
                    ${this.renderOption(0, this.noLabel)}
                </div>
            </fieldset>
        `;

        this.setupEventListeners();
    }

    renderOption(value, label) {
        const isSelected = this.value === value;
        const inputId = `${this.pollId}-opt-${value}`;
        const isThumbs = this.display === 'thumbs';

        const content = isThumbs
            ? `<svg class="pendo-yes-no__icon${value === 0 ? ' pendo-yes-no__icon--down' : ''}" viewBox="0 0 24 24" aria-hidden="true">
                   <path d="M2 20h2V10H2v10zm20-9a2 2 0 0 0-2-2h-6.31l.95-4.57.03-.32a1.49 1.49 0 0 0-.44-1.06L13.17 2 7.59 7.59C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
               </svg>
               <span class="pendo-sr-only">${this.escapeHtml(label)}</span>`
            : `<span class="pendo-yes-no__option-label">${this.escapeHtml(label)}</span>`;

        return `
            <label class="pendo-yes-no__option ${isSelected ? 'pendo-yes-no__option--selected' : ''}"
                   data-value="${value}">
                <input type="radio"
                       name="${this.pollId}"
                       id="${inputId}"
                       value="${value}"
                       ${isSelected ? 'checked' : ''}
                       ${isThumbs ? `aria-label="${this.escapeHtml(label)}"` : ''}
                       class="pendo-sr-only">
                ${content}
            </label>
        `;
    }

    setupEventListeners() {
        const options = this.querySelectorAll('.pendo-yes-no__option');

        options.forEach((option) => {
            const value = parseInt(option.dataset.value, 10);

            option.addEventListener('click', () => this.selectOption(value));

            const input = option.querySelector('input');
            input.addEventListener('change', () => this.selectOption(value));
        });
    }

    selectOption(value) {
        this.value = value;

        const options = this.querySelectorAll('.pendo-yes-no__option');
        options.forEach((option) => {
            option.classList.toggle('pendo-yes-no__option--selected', parseInt(option.dataset.value, 10) === value);
        });

        this.emitResponse(this.pollId, value, 'PositiveNegative');
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.selectOption(value);
    }
}
