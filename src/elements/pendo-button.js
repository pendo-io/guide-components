import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-button> - Action button for guides.
 *
 * Attributes:
 *   action - The action to perform:
 *     - "next-step" - Advance to next step
 *     - "previous-step" - Go back to previous step
 *     - "dismiss" - Close the guide
 *     - "link:URL" - Open a URL
 *     - "launch-guide:GUIDE_ID" - Launch another guide
 *   variant - Visual style: "primary" (default) or "secondary"
 */
class PendoButton extends PendoBaseElement {
    connectedCallback() {
        const action = this.getAttribute('action') || 'dismiss';
        const variant = this.getAttribute('variant') || 'primary';

        // Check for custom component mapping
        const CustomButton = this.getCustomComponent('button');
        if (CustomButton) {
            this.renderCustom(CustomButton, action, variant);
        } else {
            this.renderDefault(action, variant);
        }
    }

    renderDefault(action, variant) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `pendo-button pendo-button--${variant}`;

        // Move inner content to button
        button.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.appendChild(button);

        button.addEventListener('click', () => this.handleClick(action));
    }

    renderCustom(CustomButton, action, variant) {
        // For React/Vue component mapping
        const content = this.innerHTML;
        this.innerHTML = '';

        try {
            const instance = new CustomButton({
                variant,
                onClick: () => this.handleClick(action),
                children: content
            });
            this.appendChild(instance);
        } catch (e) {
            // Fallback to default if custom component fails
            this.innerHTML = content;
            this.renderDefault(action, variant);
        }
    }

    handleClick(action) {
        // Parse action string - supports "action:param" format
        const colonIndex = action.indexOf(':');
        let actionType, param;

        if (colonIndex !== -1) {
            actionType = action.substring(0, colonIndex);
            param = action.substring(colonIndex + 1);
        } else {
            actionType = action;
            param = null;
        }

        switch (actionType) {
            case 'next-step':
            case 'previous-step':
            case 'dismiss':
                this.emitAction(actionType);
                break;
            case 'link':
                this.emitAction('link', {
                    url: param,
                    target: this.getAttribute('target') || '_blank'
                });
                break;
            case 'launch-guide':
                this.emitAction('launch-guide', { guideId: param });
                break;
            default:
                // Unknown action - emit as-is
                this.emitAction(actionType, { param });
        }
    }
}

customElements.define('pendo-button', PendoButton);

export { PendoButton };
