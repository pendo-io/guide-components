import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-input> - Form input element
 *
 * Attributes:
 * - type: "text" (default), "email", "textarea", "checkbox", "radio", "select"
 * - name: Field name for data collection
 * - label: Label text
 * - placeholder: Placeholder text
 * - required: Whether field is required
 * - value: Initial value
 * - options: For select/radio - comma-separated options or JSON array
 *
 * Events:
 * - pendo-input: Fired on value change with { name, value }
 *
 * Example:
 *   <pendo-input type="text" name="feedback" label="Your feedback" placeholder="Tell us..."></pendo-input>
 *   <pendo-input type="select" name="rating" label="Rating" options="1,2,3,4,5"></pendo-input>
 *   <pendo-input type="checkbox" name="subscribe" label="Subscribe to newsletter"></pendo-input>
 */
export class PendoInput extends PendoBaseElement {
    connectedCallback() {
        const type = this.getAttribute('type') || 'text';
        const name = this.getAttribute('name') || this.generateId();
        const label = this.getAttribute('label');
        const placeholder = this.getAttribute('placeholder') || '';
        const required = this.hasAttribute('required');
        const value = this.getAttribute('value') || '';
        const options = this.getAttribute('options');

        this.classList.add('pendo-input', `pendo-input--${type}`);

        const wrapper = document.createElement('div');
        wrapper.className = 'pendo-input__wrapper';

        // Create label if provided
        if (label && type !== 'checkbox' && type !== 'radio') {
            const labelEl = document.createElement('label');
            labelEl.className = 'pendo-input__label';
            labelEl.textContent = label;
            labelEl.setAttribute('for', name);
            if (required) {
                const req = document.createElement('span');
                req.className = 'pendo-input__required';
                req.textContent = ' *';
                labelEl.appendChild(req);
            }
            wrapper.appendChild(labelEl);
        }

        // Create input based on type
        let inputEl;

        switch (type) {
            case 'textarea':
                inputEl = document.createElement('textarea');
                inputEl.rows = 4;
                break;

            case 'select':
                inputEl = document.createElement('select');
                this._addOptions(inputEl, options, value);
                break;

            case 'checkbox':
            case 'radio':
                inputEl = this._createCheckboxOrRadio(type, name, label, value, options);
                wrapper.appendChild(inputEl);
                this.appendChild(wrapper);
                return;

            default:
                inputEl = document.createElement('input');
                inputEl.type = type;
                break;
        }

        inputEl.className = 'pendo-input__field';
        inputEl.name = name;
        inputEl.id = name;
        inputEl.placeholder = placeholder;
        inputEl.required = required;
        if (value && type !== 'select') inputEl.value = value;

        // Emit input event on change
        inputEl.addEventListener('input', () => this._emitValue(name, inputEl.value));
        inputEl.addEventListener('change', () => this._emitValue(name, inputEl.value));

        wrapper.appendChild(inputEl);
        this.appendChild(wrapper);
    }

    _addOptions(selectEl, optionsStr, selectedValue) {
        if (!optionsStr) return;

        let options;
        try {
            options = JSON.parse(optionsStr);
        } catch {
            options = optionsStr.split(',').map(o => o.trim());
        }

        // Add placeholder option
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select...';
        placeholder.disabled = true;
        placeholder.selected = !selectedValue;
        selectEl.appendChild(placeholder);

        options.forEach(opt => {
            const option = document.createElement('option');
            if (typeof opt === 'object') {
                option.value = opt.value;
                option.textContent = opt.label || opt.value;
            } else {
                option.value = opt;
                option.textContent = opt;
            }
            if (option.value === selectedValue) option.selected = true;
            selectEl.appendChild(option);
        });
    }

    _createCheckboxOrRadio(type, name, label, value, optionsStr) {
        const container = document.createElement('div');
        container.className = `pendo-input__${type}-group`;

        if (optionsStr) {
            // Multiple options (radio group or checkbox group)
            let options;
            try {
                options = JSON.parse(optionsStr);
            } catch {
                options = optionsStr.split(',').map(o => o.trim());
            }

            options.forEach((opt, i) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? (opt.label || opt.value) : opt;
                const id = `${name}-${i}`;

                const item = document.createElement('label');
                item.className = `pendo-input__${type}-item`;

                const input = document.createElement('input');
                input.type = type;
                input.name = name;
                input.id = id;
                input.value = optValue;
                input.addEventListener('change', () => {
                    if (type === 'checkbox') {
                        const checked = container.querySelectorAll('input:checked');
                        const values = Array.from(checked).map(c => c.value);
                        this._emitValue(name, values);
                    } else {
                        this._emitValue(name, optValue);
                    }
                });

                const text = document.createElement('span');
                text.textContent = optLabel;

                item.appendChild(input);
                item.appendChild(text);
                container.appendChild(item);
            });
        } else {
            // Single checkbox
            const item = document.createElement('label');
            item.className = `pendo-input__${type}-item`;

            const input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.id = name;
            input.value = value || 'true';
            input.addEventListener('change', () => {
                this._emitValue(name, input.checked);
            });

            const text = document.createElement('span');
            text.textContent = label || '';

            item.appendChild(input);
            item.appendChild(text);
            container.appendChild(item);
        }

        return container;
    }

    _emitValue(name, value) {
        this.dispatchEvent(new CustomEvent('pendo-input', {
            detail: { name, value },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get current value
     */
    getValue() {
        const input = this.querySelector('input, textarea, select');
        if (!input) return null;

        if (input.type === 'checkbox') {
            const checked = this.querySelectorAll('input:checked');
            return checked.length > 1
                ? Array.from(checked).map(c => c.value)
                : (checked.length === 1 ? checked[0].checked || checked[0].value : false);
        }

        return input.value;
    }

    /**
     * Set value
     */
    setValue(value) {
        const input = this.querySelector('input, textarea, select');
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = !!value;
            } else {
                input.value = value;
            }
        }
    }
}

customElements.define('pendo-input', PendoInput);
