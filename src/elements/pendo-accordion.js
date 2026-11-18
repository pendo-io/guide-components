import { PendoBaseElement } from '../base-element.js';

const CHEVRON =
    '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M3 6l5 5 5-5"/></svg>';

/**
 * <pendo-accordion> - Sections that open and close: an FAQ, release notes with one section per
 * feature, a video behind its title.
 *
 * Children are <pendo-accordion-item> elements. The accordion itself only groups them: each item
 * opens and closes on its own, and opening one does not close another.
 *
 * Example:
 *   <pendo-accordion>
 *     <pendo-accordion-item label="How do I export a report?">
 *       <pendo-text>Open the report and choose Export.</pendo-text>
 *     </pendo-accordion-item>
 *     <pendo-accordion-item label="Who can see my reports?" open>
 *       <pendo-text>Everyone on your team.</pendo-text>
 *     </pendo-accordion-item>
 *   </pendo-accordion>
 */
export class PendoAccordion extends PendoBaseElement {}

/**
 * <pendo-accordion-item> - One section of a <pendo-accordion>: a label row, and a body that the
 * label row opens and closes.
 *
 * Attributes:
 *   label - The text of the label row. Plain text.
 *   open - The item starts open. Without it, the item starts closed. Turning the attribute on or
 *     off opens or closes the item; opening or closing it by hand does not change the attribute.
 *
 * The body is the element's children: the usual content elements (title, text, image, video,
 * button, link, list, table), spaced like the guide's content region. Closing the item stops a
 * video playing in it.
 *
 * The label row and the body's box are built in a shadow root, and the children are slotted into
 * the body. Nothing is added to, moved in or removed from the authored markup: the client removes a
 * gated element (`data-pendo-requires-*`) before the guide connects, and an editor reads the
 * markup back, so the children and the attributes must stay exactly as authored. For the same
 * reason the open or closed state lives in the shadow root, not in the `open` attribute: an editor
 * that saves the guide after a click must save what the author wrote, not where the click left it.
 *
 * The label row is a real `<button>` with `aria-expanded` and `aria-controls`, inside an element
 * with the `heading` role, as the WAI-ARIA accordion pattern has it. A click, Enter or Space opens
 * and closes it. A closed body is `hidden`, so nothing in it is drawn, reached by Tab or read.
 *
 * The look is CSS only, from theme tokens (`--pendo-accordion-*`), through the shadow parts
 * `label`, `icon` and `content`; see `defaults.css`. The `icon` part also takes `icon-open` while the
 * item is open.
 */
export class PendoAccordionItem extends PendoBaseElement {
    static get observedAttributes() {
        return ['label', 'open'];
    }

    constructor() {
        super();
        this.buildShadow();
    }

    connectedCallback() {
        // Read once. A reconnect (moved in the DOM, re-parented by a framework) keeps the state the
        // reader left it in; the attribute is where the item starts, not where it is.
        if (this._initialized) return;
        this._initialized = true;
        this.syncLabel();
        this.expanded = this.hasAttribute('open');
    }

    /**
     * An authoring surface edits `label` and `open` on the live element. Before the first connect
     * there is nothing to do: `connectedCallback` reads the attributes as they stand.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this._initialized) return;
        if (name === 'label') this.syncLabel();
        else this.expanded = newValue !== null;
    }

    /** Whether the body shows. Setting it opens or closes the item, as a click does. */
    get expanded() {
        return this._button.getAttribute('aria-expanded') === 'true';
    }

    set expanded(value) {
        const open = Boolean(value);
        const closing = !open && this.expanded;
        this._button.setAttribute('aria-expanded', String(open));
        this._body.hidden = !open;
        this._icon.setAttribute('part', open ? 'icon icon-open' : 'icon');
        if (closing) this.stopMedia();
    }

    /**
     * A closed body is hidden, but a video playing in it keeps playing, with sound and with no
     * control left on screen to stop it. So closing an item pauses a native video and reloads an
     * embedded player (YouTube, Vimeo), which stops it without a player API: the frame comes back
     * at its start, ready to play again when the item reopens.
     */
    stopMedia() {
        for (const video of this.querySelectorAll('video')) video.pause();
        for (const frame of this.querySelectorAll('iframe')) {
            const src = frame.getAttribute('src');
            if (src) frame.setAttribute('src', src);
        }
    }

    toggle() {
        this.expanded = !this.expanded;
    }

    /**
     * Built once, in the constructor: a shadow root cannot be attached twice, and a clone of an item
     * runs the constructor again and gets a root of its own. Attributes are not read here, since an
     * element made by `createElement` has none yet.
     */
    buildShadow() {
        const root = this.attachShadow({ mode: 'open' });
        const bodyId = this.generateId();

        const heading = document.createElement('div');
        heading.setAttribute('role', 'heading');
        heading.setAttribute('aria-level', '3');

        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('part', 'label');
        button.setAttribute('aria-controls', bodyId);
        button.addEventListener('click', () => this.toggle());

        const text = document.createElement('span');
        const icon = document.createElement('span');
        icon.innerHTML = CHEVRON;
        button.append(text, icon);
        heading.appendChild(button);

        // Two boxes, so the inner one can be a flex column without overriding `hidden` on the outer:
        // a `display` set through `::part()` would outrank the browser's `[hidden] { display: none }`.
        const body = document.createElement('div');
        body.id = bodyId;
        const content = document.createElement('div');
        content.setAttribute('part', 'content');
        content.appendChild(document.createElement('slot'));
        body.appendChild(content);

        root.append(heading, body);

        this._button = button;
        this._text = text;
        this._icon = icon;
        this._body = body;
        this.expanded = false;
    }

    syncLabel() {
        const label = this.getAttribute('label');
        if (!label) console.warn('pendo-accordion-item: missing required "label" attribute');
        // textContent, not innerHTML: an attribute value is data, not markup.
        this._text.textContent = label || '';
    }
}
