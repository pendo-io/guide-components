import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-nps> - Net Promoter Score poll component
 *
 * Displays a 0-10 scale for NPS surveys with "Not likely" and "Very likely" labels.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - value: Pre-selected value
 * - low-label: Label for low end (default: "Not likely")
 * - high-label: Label for high end (default: "Very likely")
 *
 * Events:
 * - pendo-response: Fired when user selects a score { pollId, value, type: 'NPSRating' }
 *
 * Example:
 *   <pendo-nps question="How likely are you to recommend us to a friend?"></pendo-nps>
 */
export class PendoNps extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.value = this.getAttribute('value') ? parseInt(this.getAttribute('value'), 10) : null;
        this.lowLabel = this.getAttribute('low-label') || 'Not likely';
        this.highLabel = this.getAttribute('high-label') || 'Very likely';

        this.classList.add('pendo-poll', 'pendo-nps');
        this.render();
    }

    render() {
        const questionId = this.generateId();

        this.innerHTML = `
            <fieldset class="pendo-poll__fieldset" role="radiogroup" aria-labelledby="${questionId}">
                ${this.question ? `<legend id="${questionId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</legend>` : ''}
                <div class="pendo-nps__scale">
                    ${this.renderScale()}
                </div>
                <div class="pendo-nps__labels">
                    <span class="pendo-nps__label pendo-nps__label--low">${this.escapeHtml(this.lowLabel)}</span>
                    <span class="pendo-nps__label pendo-nps__label--high">${this.escapeHtml(this.highLabel)}</span>
                </div>
            </fieldset>
        `;

        this.setupEventListeners();
    }

    renderScale() {
        let html = '';
        for (let i = 0; i <= 10; i++) {
            const isSelected = this.value === i;
            const scoreId = `${this.pollId}-score-${i}`;
            const category = this.getCategory(i);

            html += `
                <label class="pendo-nps__score pendo-nps__score--${category} ${isSelected ? 'pendo-nps__score--selected' : ''}"
                       data-value="${i}">
                    <input type="radio"
                           name="${this.pollId}"
                           id="${scoreId}"
                           value="${i}"
                           ${isSelected ? 'checked' : ''}
                           class="pendo-sr-only">
                    <span class="pendo-nps__score-value">${i}</span>
                </label>
            `;
        }
        return html;
    }

    getCategory(score) {
        if (score <= 6) return 'detractor';
        if (score <= 8) return 'passive';
        return 'promoter';
    }

    setupEventListeners() {
        const scores = this.querySelectorAll('.pendo-nps__score');

        scores.forEach((score) => {
            const value = parseInt(score.dataset.value, 10);

            score.addEventListener('click', () => this.selectScore(value));

            const input = score.querySelector('input');
            input.addEventListener('change', () => this.selectScore(value));
        });
    }

    selectScore(value) {
        this.value = value;

        // Update visual state
        const scores = this.querySelectorAll('.pendo-nps__score');
        scores.forEach((score) => {
            const scoreValue = parseInt(score.dataset.value, 10);
            score.classList.toggle('pendo-nps__score--selected', scoreValue === value);
        });

        // Emit response event
        this.emitResponse(this.pollId, value, 'NPSRating');
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
        this.selectScore(value);
    }
}

