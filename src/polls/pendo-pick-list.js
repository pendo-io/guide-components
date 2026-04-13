import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-pick-list> - Multiple choice poll component (select dropdown or radio buttons)
 *
 * Renders a PickList poll as either a <select> dropdown or radio button group,
 * controlled by the `display` attribute.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - display: Render mode — "select" (default) or "radio"
 * - options: JSON string mapping response IDs to display labels
 *            e.g. '{"id1":"Option A","id2":"Option B"}'
 * - value: Pre-selected response ID
 * - placeholder: Placeholder text for select mode (default: "Select…")
 *
 * Events:
 * - pendo-response: Fired when user picks an option { pollId, value, type: 'PickList' }
 *
 * Example (dropdown):
 *   <pendo-pick-list question="What is your role?"
 *       options='{"pm":"Product Manager","eng":"Engineer"}'></pendo-pick-list>
 *
 * Example (radio):
 *   <pendo-pick-list question="What is your role?" display="radio"
 *       options='{"pm":"Product Manager","eng":"Engineer"}'></pendo-pick-list>
 */
export class PendoPickList extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.display = this.getAttribute('display') || 'select';
        this.placeholder = this.getAttribute('placeholder') || 'Select\u2026';
        this.value = this.getAttribute('value') || null;

        this._options = {};
        try {
            this._options = JSON.parse(this.getAttribute('options') || '{}');
        } catch (e) {
            // invalid JSON — render with no options
        }

        this.classList.add('pendo-poll', 'pendo-pick-list');
        this.render();
    }

    render() {
        const questionId = this.generateId();

        if (this.display === 'radio') {
            this.innerHTML = `
                <fieldset class="pendo-poll__fieldset" role="radiogroup" aria-labelledby="${questionId}">
                    ${this.question ? `<legend id="${questionId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</legend>` : ''}
                    <div class="pendo-pick-list__options">
                        ${this.renderRadioOptions()}
                    </div>
                </fieldset>
            `;
            this.setupRadioListeners();
        } else {
            const selectId = this.generateId();
            this.innerHTML = `
                <div class="pendo-pick-list__wrapper">
                    ${this.question ? `<label id="${questionId}" for="${selectId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</label>` : ''}
                    <select id="${selectId}" class="pendo-pick-list__select" aria-labelledby="${this.question ? questionId : ''}">
                        <option value="" disabled ${!this.value ? 'selected' : ''}>${this.escapeHtml(this.placeholder)}</option>
                        ${this.renderSelectOptions()}
                    </select>
                </div>
            `;
            this.setupSelectListeners();
        }
    }

    renderSelectOptions() {
        let html = '';
        for (const [id, label] of Object.entries(this._options)) {
            const isSelected = this.value === id;
            html += `<option value="${this.escapeHtml(id)}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(label)}</option>`;
        }
        return html;
    }

    renderRadioOptions() {
        let html = '';
        for (const [id, label] of Object.entries(this._options)) {
            const isSelected = this.value === id;
            const inputId = `${this.pollId}-opt-${id}`;
            html += `
                <label class="pendo-pick-list__option ${isSelected ? 'pendo-pick-list__option--selected' : ''}"
                       data-value="${this.escapeHtml(id)}">
                    <input type="radio"
                           name="${this.pollId}"
                           id="${inputId}"
                           value="${this.escapeHtml(id)}"
                           ${isSelected ? 'checked' : ''}
                           class="pendo-sr-only">
                    <span class="pendo-pick-list__option-label">${this.escapeHtml(label)}</span>
                </label>
            `;
        }
        return html;
    }

    setupSelectListeners() {
        const select = this.querySelector('select');
        select.addEventListener('change', () => {
            this.selectOption(select.value);
        });
    }

    setupRadioListeners() {
        const options = this.querySelectorAll('.pendo-pick-list__option');

        options.forEach((option) => {
            const value = option.dataset.value;

            option.addEventListener('click', () => this.selectOption(value));

            const input = option.querySelector('input');
            input.addEventListener('change', () => this.selectOption(value));
        });
    }

    selectOption(value) {
        this.value = value;

        if (this.display === 'radio') {
            const options = this.querySelectorAll('.pendo-pick-list__option');
            options.forEach((option) => {
                option.classList.toggle('pendo-pick-list__option--selected', option.dataset.value === value);
            });
        }

        // Emit response — value is the response ID, backend maps to label
        this.emitResponse(this.pollId, value, 'PickList');
    }

    /**
     * Get the current selected value (response ID)
     */
    getValue() {
        return this.value;
    }

    /**
     * Set the value programmatically
     */
    setValue(value) {
        this.selectOption(value);
        if (this.display === 'select') {
            const select = this.querySelector('select');
            if (select) {
                select.value = value;
            }
        }
    }
}
