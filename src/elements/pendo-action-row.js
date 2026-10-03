import { PendoBaseElement } from '../base-element.js';
import { parseActionAttribute } from '../actions.js';

const CHEVRON =
    '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M6 3l5 5-5 5"/></svg>';

const EXTERNAL =
    '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M9 2h5v5M14 2L7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5"/></svg>';

const TRAILING_ICONS = { chevron: CHEVRON, external: EXTERNAL };

/** Actions that open something, and the glyph that says so. Anything else gets no glyph. */
const TRAILING_BY_ACTION = {
    'go-to-step': 'chevron',
    'launch-guide': 'chevron',
    link: 'external'
};

/**
 * <pendo-action-row> - A compact menu entry that performs an action.
 *
 * A row is for choosing between several things (open this guide, go to this section, follow this
 * link). `pendo-button` is sized as a call to action, and `pendo-list-item` is prose that re-renders
 * its items and discards their attributes, so neither works as a menu entry.
 *
 * Attributes:
 *   action - What a click does. Same grammar as `pendo-button`, shared via `actions.js`:
 *     "go-to-step:N", "launch-guide:GUIDE_ID", "link:URL", "dismiss", "next-step", ...
 *   description - Optional secondary line under the label. Plain text.
 *   trailing - Optional override for the trailing glyph: "chevron", "external" or "none".
 *     By default the glyph reflects the action: a chevron for `go-to-step` and `launch-guide`
 *     (open something), an external-link glyph for `link`, and nothing for the rest.
 *   target - Where a `link:` action opens. Defaults to a new tab.
 *
 * The label is the element's content, so inline formatting works.
 *
 * Every attribute on the authored element stays on it. The client gates content with
 * `data-pendo-requires-guide` / `data-pendo-requires-any` on whatever carries them, and it removes
 * the element before this one connects; nothing here may rebuild the host and lose them.
 *
 * Example:
 *   <pendo-action-row action="go-to-step:2" description="Plans, invoices and refunds">
 *     Billing
 *   </pendo-action-row>
 */
export class PendoActionRow extends PendoBaseElement {
    static get observedAttributes() {
        return ['description', 'action', 'trailing'];
    }

    constructor() {
        super();
        // On the host rather than the built button, so a clone of an already-built row (which is
        // never rebuilt) still responds to a click.
        this.addEventListener('click', (event) => {
            const row = this.getRow();
            if (row && row.contains(event.target)) this.handleClick();
        });
    }

    connectedCallback() {
        // The row is built once. A reconnect (moved in the DOM, re-parented by a framework) would
        // otherwise wrap the already-built control in a second one.
        if (this.getRow()) return;

        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'pendo-action-row';

        const text = document.createElement('span');
        text.className = 'pendo-action-row__text';

        const label = document.createElement('span');
        label.className = 'pendo-action-row__label';
        label.innerHTML = this.innerHTML;
        text.appendChild(label);
        row.appendChild(text);

        this.innerHTML = '';
        this.appendChild(row);

        this.syncDescription();
        this.syncTrailing();
    }

    /**
     * Keep the built control in step with the attributes after it exists. An authoring surface edits
     * `description`, `action` and `trailing` on the live element, and rebuilding the row for each
     * would discard the label the author is typing into. Before the first build there is nothing to
     * update: `connectedCallback` reads the attributes as they stand.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this.getRow()) return;
        if (name === 'description') this.syncDescription();
        else this.syncTrailing();
    }

    /** The built `button.pendo-action-row`, or null before the first build. */
    getRow() {
        const child = this.firstElementChild;
        return child && child.classList.contains('pendo-action-row') ? child : null;
    }

    syncDescription() {
        const row = this.getRow();
        if (!row) return;
        const text = row.querySelector('.pendo-action-row__text');
        let secondary = text.querySelector('.pendo-action-row__description');
        const description = this.getAttribute('description');
        if (!description) {
            if (secondary) secondary.remove();
            return;
        }
        if (!secondary) {
            secondary = document.createElement('span');
            secondary.className = 'pendo-action-row__description';
            text.appendChild(secondary);
        }
        // textContent, not innerHTML: an attribute value is data, not markup.
        secondary.textContent = description;
    }

    syncTrailing() {
        const row = this.getRow();
        if (!row) return;
        let trailing = row.querySelector(':scope > .pendo-action-row__trailing');
        const glyph = this.resolveTrailing();
        if (!glyph) {
            if (trailing) trailing.remove();
            return;
        }
        if (!trailing) {
            trailing = document.createElement('span');
            row.appendChild(trailing);
        }
        trailing.className = `pendo-action-row__trailing pendo-action-row__trailing--${glyph}`;
        trailing.innerHTML = TRAILING_ICONS[glyph];
    }

    /**
     * Which trailing glyph to draw, if any.
     *
     * Derived from the action so an author never has to think about it. The first action in a
     * compound list that opens something decides, since a row's job is to say where it leads.
     *
     * @returns {'chevron'|'external'|null}
     */
    resolveTrailing() {
        const override = this.getAttribute('trailing');
        if (override === 'none') return null;
        if (override && TRAILING_ICONS[override]) return override;

        const actions = this.parseAction(this.getAttribute('action'));
        for (const entry of actions) {
            if (entry && TRAILING_BY_ACTION[entry.action]) {
                return TRAILING_BY_ACTION[entry.action];
            }
        }
        return null;
    }

    parseAction(attr) {
        return parseActionAttribute(attr, this.getAttribute('target') || '_blank');
    }

    /**
     * Emit the same `pendo-action` event `pendo-button` does, so the client handles a row with no
     * new code: it listens for the event on the guide root and reads `detail.actions`.
     *
     * A row with no `action` dismisses, as a button does. That is the authoring error it looks like
     * (a menu entry that closes the menu), and the guide validator reports it; the component does
     * not invent a different behaviour from the button it sits beside.
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
