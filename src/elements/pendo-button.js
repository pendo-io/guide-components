import { PendoBaseElement } from '../base-element.js';
import { parseActionAttribute } from '../actions.js';

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
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `pendo-button pendo-button--${variant}`;

        // Move inner content to button
        button.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.appendChild(button);

        button.addEventListener('click', () => this.handleClick());
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
     * The grammar is shared with `pendo-action-row`; see `actions.js`.
     *
     * @param {string} attr - The action attribute value
     * @returns {Array} Array of action objects
     */
    parseAction(attr) {
        return parseActionAttribute(attr, this.getAttribute('target') || '_blank');
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
