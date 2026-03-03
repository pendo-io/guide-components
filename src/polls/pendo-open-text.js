import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-open-text> - Free text poll component
 *
 * Provides a text area for open-ended feedback collection.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - placeholder: Placeholder text for the input
 * - rows: Number of rows for the textarea (default: 3)
 * - maxlength: Maximum character length
 * - required: Whether input is required
 * - submit-on-blur: Auto-submit when focus leaves (default: false)
 *
 * Events:
 * - pendo-response: Fired when user submits text { pollId, value, type: 'FreeForm' }
 *
 * Example:
 *   <pendo-open-text question="Any additional feedback?" placeholder="Type here..."></pendo-open-text>
 */
export class PendoOpenText extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.placeholder = this.getAttribute('placeholder') || '';
        this.rows = parseInt(this.getAttribute('rows') || '3', 10);
        this.maxlength = this.getAttribute('maxlength');
        this.required = this.hasAttribute('required');
        this.submitOnBlur = this.hasAttribute('submit-on-blur');

        this._value = '';
        this._submitted = false;

        this.classList.add('pendo-poll', 'pendo-open-text');
        this.render();
    }

    render() {
        const questionId = this.generateId();
        const textareaId = this.generateId();

        this.innerHTML = `
            <div class="pendo-open-text__wrapper">
                ${this.question ? `<label id="${questionId}" for="${textareaId}" class="pendo-poll__question">${this.escapeHtml(this.question)}</label>` : ''}
                <textarea
                    id="${textareaId}"
                    class="pendo-open-text__input"
                    placeholder="${this.escapeHtml(this.placeholder)}"
                    rows="${this.rows}"
                    ${this.maxlength ? `maxlength="${this.maxlength}"` : ''}
                    ${this.required ? 'required' : ''}
                    aria-labelledby="${this.question ? questionId : ''}"
                ></textarea>
                ${this.maxlength ? `<div class="pendo-open-text__counter"><span class="pendo-open-text__count">0</span>/${this.maxlength}</div>` : ''}
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const textarea = this.querySelector('textarea');
        const counter = this.querySelector('.pendo-open-text__count');

        // Track input
        textarea.addEventListener('input', () => {
            this._value = textarea.value;
            if (counter) {
                counter.textContent = textarea.value.length;
            }
        });

        // Submit on blur if configured
        if (this.submitOnBlur) {
            textarea.addEventListener('blur', () => {
                if (this._value && !this._submitted) {
                    this.submit();
                }
            });
        }

        // Submit on Enter (with Ctrl/Cmd)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.submit();
            }
        });
    }

    submit() {
        if (this.required && !this._value.trim()) {
            return false;
        }

        this._submitted = true;

        // Emit response event
        this.emitResponse(this.pollId, this._value, 'FreeForm');

        return true;
    }

    /**
     * Get the current value
     */
    getValue() {
        return this._value;
    }

    /**
     * Set the value programmatically
     */
    setValue(value) {
        this._value = value;
        const textarea = this.querySelector('textarea');
        if (textarea) {
            textarea.value = value;
        }
    }

    /**
     * Check if the response has been submitted
     */
    isSubmitted() {
        return this._submitted;
    }

    /**
     * Focus the textarea
     */
    focus() {
        const textarea = this.querySelector('textarea');
        textarea?.focus();
    }
}

customElements.define('pendo-open-text', PendoOpenText);
