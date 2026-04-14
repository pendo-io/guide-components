import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-button> - Action button for guides.
 *
 * Attributes:
 *   action - The action(s) to perform. Supports multiple formats:
 *     String format:
 *       - "next-step" - Advance to next step
 *       - "previous-step" - Go back to previous step
 *       - "dismiss" - Close the guide
 *       - "link:URL" - Open a URL
 *       - "launch-guide:GUIDE_ID" - Launch another guide
 *       - "go-to-step:STEP_ID" - Go to a specific step
 *       - "snooze:DURATION_MS" - Snooze the guide
 *     Object format (JSON):
 *       - '{"action":"go-to-step","stepId":"abc123"}'
 *     Array format (JSON) for multiple actions:
 *       - '[{"action":"submit-poll"},{"action":"next-step"}]'
 *   variant - Visual style: "primary" (default) or "secondary"
 */
class PendoButton extends PendoBaseElement {
    connectedCallback() {
        const variant = this.getAttribute('variant') || 'primary';

        // Check for custom component mapping
        const CustomButton = this.getCustomComponent('button');
        if (CustomButton) {
            this.renderCustom(CustomButton, variant);
        } else {
            this.renderDefault(variant);
        }
    }

    renderDefault(variant) {
        // Style the custom element directly — no inner <button>.
        // This allows theme CSS targeting pendo-button to work without
        // conflicting with an inner element's styles.
        this.classList.add('pendo-button', `pendo-button--${variant}`);
        this.setAttribute('role', 'button');
        this.setAttribute('tabindex', '0');

        this.addEventListener('click', () => this.handleClick());
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleClick();
            }
        });
    }

    renderCustom(CustomButton, variant) {
        // For React/Vue component mapping
        const content = this.innerHTML;
        this.innerHTML = '';

        try {
            const instance = new CustomButton({
                variant,
                onClick: () => this.handleClick(),
                children: content
            });
            this.appendChild(instance);
        } catch (e) {
            // Fallback to default if custom component fails
            this.innerHTML = content;
            this.renderDefault(variant);
        }
    }

    /**
     * Parse the action attribute into an array of action objects.
     * Supports multiple formats for backward compatibility and composability.
     *
     * @param {string} attr - The action attribute value
     * @returns {Array} Array of action objects
     */
    parseAction(attr) {
        if (!attr) return [];

        const trimmed = attr.trim();

        // Array of actions: [{"action":"submit-poll"},{"action":"dismiss"}]
        if (trimmed.startsWith('[')) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                return [];
            }
        }

        // Single action object: {"action":"go-to-step","stepId":"abc"}
        if (trimmed.startsWith('{')) {
            try {
                return [JSON.parse(trimmed)];
            } catch (e) {
                return [];
            }
        }

        // String with colon param: "action:param"
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex !== -1) {
            const actionType = trimmed.substring(0, colonIndex);
            const param = trimmed.substring(colonIndex + 1);

            // Map known parameterized actions to proper object format
            switch (actionType) {
                case 'link':
                    return [{
                        action: 'link',
                        url: param,
                        target: this.getAttribute('target') || '_blank'
                    }];
                case 'launch-guide':
                    return [{ action: 'launch-guide', guideId: param }];
                case 'go-to-step':
                    return [{ action: 'go-to-step', stepId: param }];
                case 'snooze':
                    return [{ action: 'snooze', duration: parseInt(param, 10) || null }];
                default:
                    return [{ action: actionType, param }];
            }
        }

        // Simple string action: "dismiss", "next-step", etc.
        return [{ action: trimmed }];
    }

    /**
     * Handle button click - parses action attribute and emits actions array.
     */
    handleClick() {
        const attr = this.getAttribute('action') || 'dismiss';
        const actions = this.parseAction(attr);

        this.dispatchEvent(new CustomEvent('pendo-action', {
            detail: { actions },
            bubbles: true,
            composed: true
        }));
    }
}

export { PendoButton };
