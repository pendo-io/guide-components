import { PendoBaseElement } from '../base-element.js';

/**
 * The layout class that makes a guide ordinary page content rather than a dialog.
 *
 * Named like `pendo-guide--lightbox` and friends, because it comes from the same place: the
 * renderer picks the layout, not the markup.
 */
const EMBEDDED_CLASS = 'pendo-guide--embedded';

/**
 * <pendo-guide> - The main container element for a guide step.
 *
 * Attributes:
 *   step - Current step number (1-indexed)
 *   total-steps - Total number of steps in the guide
 *
 * Features:
 *   - Focus trapping for modal behavior
 *   - Escape key to dismiss
 *   - Progress indicator for multi-step guides
 *   - Proper ARIA dialog semantics
 *   - An embedded mode (`pendo-guide--embedded`) that keeps the progress indicator and drops the
 *     dialog semantics, the focus trap and the Escape handler
 *
 * A renderer choosing embedded mode sets the class before appending the element. The mode is read
 * once, on connect, because the autofocus a dialog performs cannot be taken back after the fact.
 */
class PendoGuide extends PendoBaseElement {
    connectedCallback() {
        // Add base class for styling
        this.classList.add('pendo-guide');

        // Multi-step progress indicator. An embed is a step sequence like any other, so this runs
        // for one too.
        const step = parseInt(this.getAttribute('step') || '1', 10);
        const totalSteps = parseInt(this.getAttribute('total-steps') || '1', 10);
        if (totalSteps > 1) {
            this.renderProgress(step, totalSteps);
        }

        if (this.isEmbedded()) return;

        this.enterDialogMode();

        // Page content does not take the reader's focus when it appears, so this is the dialog's
        // alone.
        requestAnimationFrame(() => this.focusFirst());
    }

    disconnectedCallback() {
        this.removeKeyboardHandlers();
    }

    isEmbedded() {
        return this.classList.contains(EMBEDDED_CLASS);
    }

    enterDialogMode() {
        // Accessibility: dialog role and labeling
        this.setAttribute('role', 'dialog');
        this.setAttribute('aria-modal', 'true');

        const title = this.querySelector('pendo-title');
        if (title) {
            const id = title.id || (title.id = this.generateId());
            this.setAttribute('aria-labelledby', id);
        }

        // Setup keyboard handlers
        this.setupKeyboardHandlers();
        this.setupFocusTrap();
    }

    removeKeyboardHandlers() {
        if (this._keydownHandler) {
            this.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }
        if (this._focusTrapHandler) {
            this.removeEventListener('keydown', this._focusTrapHandler);
            this._focusTrapHandler = null;
        }
    }

    setupKeyboardHandlers() {
        this._keydownHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.emitAction('dismiss');
            }
        };
        this.addEventListener('keydown', this._keydownHandler);
    }

    setupFocusTrap() {
        this._focusTrapHandler = (e) => {
            if (e.key !== 'Tab') return;

            const focusableSelector =
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            const focusable = Array.from(this.querySelectorAll(focusableSelector))
                .filter(el => !el.disabled && el.offsetParent !== null);

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        this.addEventListener('keydown', this._focusTrapHandler);
    }

    focusFirst() {
        const focusableSelector =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = this.querySelector(focusableSelector);
        if (focusable && !focusable.disabled) {
            focusable.focus();
        }
    }

    renderProgress(step, totalSteps) {
        const progress = document.createElement('div');
        progress.className = 'pendo-guide__progress';
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-valuenow', String(step));
        progress.setAttribute('aria-valuemin', '1');
        progress.setAttribute('aria-valuemax', String(totalSteps));
        progress.setAttribute('aria-label', `Step ${step} of ${totalSteps}`);

        const dots = Array.from({ length: totalSteps }, (_, i) => {
            const isComplete = i < step;
            const isCurrent = i === step - 1;
            const classes = ['pendo-guide__progress-dot'];
            if (isComplete) classes.push('pendo-guide__progress-dot--complete');
            if (isCurrent) classes.push('pendo-guide__progress-dot--current');
            return `<span class="${classes.join(' ')}" aria-hidden="true"></span>`;
        }).join('');

        progress.innerHTML = `
            <span class="pendo-guide__progress-text">Step ${step} of ${totalSteps}</span>
            <div class="pendo-guide__progress-dots">${dots}</div>
        `;

        this.insertBefore(progress, this.firstChild);
    }
}

export { PendoGuide };
