import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-emoji-scale> - Emoji-based rating poll component
 *
 * Displays a scale of emoji faces from sad to happy for quick sentiment capture.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - value: Pre-selected value (1-5)
 * - scale: "3" or "5" (default: "5")
 *
 * Events:
 * - pendo-response: Fired when user selects an emoji { pollId, value, type: 'NumberScale' }
 *
 * Example:
 *   <pendo-emoji-scale question="How are you feeling about this?"></pendo-emoji-scale>
 *   <pendo-emoji-scale question="Quick feedback?" scale="3"></pendo-emoji-scale>
 */
export class PendoEmojiScale extends PendoBaseElement {
    // Emoji sets for different scales
    static EMOJIS_5 = [
        { value: 1, emoji: '😠', label: 'Very unhappy' },
        { value: 2, emoji: '😟', label: 'Unhappy' },
        { value: 3, emoji: '😐', label: 'Neutral' },
        { value: 4, emoji: '🙂', label: 'Happy' },
        { value: 5, emoji: '😄', label: 'Very happy' }
    ];

    static EMOJIS_3 = [
        { value: 1, emoji: '😟', label: 'Unhappy' },
        { value: 2, emoji: '😐', label: 'Neutral' },
        { value: 3, emoji: '😄', label: 'Happy' }
    ];

    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.value = this.getAttribute('value') ? parseInt(this.getAttribute('value'), 10) : null;
        this.scale = this.getAttribute('scale') === '3' ? 3 : 5;
        this.emojis = this.scale === 3 ? PendoEmojiScale.EMOJIS_3 : PendoEmojiScale.EMOJIS_5;

        this.classList.add('pendo-poll', 'pendo-emoji-scale');
        this.render();
    }

    render() {
        const questionId = this.generateId();

        this.innerHTML = `
            <fieldset class="pendo-poll__fieldset" role="radiogroup" aria-labelledby="${questionId}">
                ${this.question ? `<legend id="${questionId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</legend>` : ''}
                <div class="pendo-emoji-scale__options">
                    ${this.renderEmojis()}
                </div>
            </fieldset>
        `;

        this.setupEventListeners();
    }

    renderEmojis() {
        return this.emojis.map(({ value, emoji, label }) => {
            const isSelected = this.value === value;
            const optionId = `${this.pollId}-emoji-${value}`;

            return `
                <label class="pendo-emoji-scale__option ${isSelected ? 'pendo-emoji-scale__option--selected' : ''}"
                       data-value="${value}">
                    <input type="radio"
                           name="${this.pollId}"
                           id="${optionId}"
                           value="${value}"
                           ${isSelected ? 'checked' : ''}
                           class="pendo-sr-only">
                    <span class="pendo-emoji-scale__emoji" role="img" aria-label="${label}">${emoji}</span>
                </label>
            `;
        }).join('');
    }

    setupEventListeners() {
        const options = this.querySelectorAll('.pendo-emoji-scale__option');

        options.forEach((option) => {
            const value = parseInt(option.dataset.value, 10);

            option.addEventListener('click', () => this.selectEmoji(value));

            const input = option.querySelector('input');
            input.addEventListener('change', () => this.selectEmoji(value));
        });
    }

    selectEmoji(value) {
        this.value = value;

        // Update visual state
        const options = this.querySelectorAll('.pendo-emoji-scale__option');
        options.forEach((option) => {
            const optionValue = parseInt(option.dataset.value, 10);
            option.classList.toggle('pendo-emoji-scale__option--selected', optionValue === value);
        });

        // Emit response event (maps to NumberScale for analytics)
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
        this.selectEmoji(value);
    }
}

