/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

const defaults = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/defaults.css'),
    'utf8'
);

const EMBEDDED = 'class="pendo-guide--embedded"';

/** Two buttons, so there is a first and a last for the trap to wrap between. */
const BODY = `
    <pendo-guide-content>
        <pendo-title>Plan your rollout</pendo-title>
        <pendo-text>Pick a date and invite your team.</pendo-text>
    </pendo-guide-content>
    <pendo-guide-footer>
        <pendo-button action="previous-step" variant="secondary">Back</pendo-button>
        <pendo-button action="next-step">Next</pendo-button>
    </pendo-guide-footer>
`;

/**
 * The focus trap filters candidates on `offsetParent`, which jsdom reports as null for everything.
 * Left alone it bails on an empty list, so every trap assertion below — including the ordinary-guide
 * regressions, which are the half that has to fail if embedded mode starts leaking — would pass
 * whether the trap was installed or not.
 */
let realOffsetParent;

beforeAll(() => {
    realOffsetParent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return this.parentElement;
        }
    });
});

afterAll(() => {
    if (realOffsetParent) {
        Object.defineProperty(HTMLElement.prototype, 'offsetParent', realOffsetParent);
    }
});

/** Mount a guide root and hand it back. Pass `EMBEDDED` for an embed, nothing for the default. */
function mount(attrs = '', inner = BODY) {
    document.body.innerHTML = `<pendo-guide ${attrs}>${inner}</pendo-guide>`;
    return document.querySelector('pendo-guide');
}

/** Mount with the component stylesheet applied, for the rules rather than the behaviour. */
function render(attrs, inner = BODY) {
    document.head.innerHTML = `<style>${defaults}</style>`;
    return mount(attrs, inner);
}

/**
 * The declarations of the rule whose selector list contains `needle`.
 *
 * Read from source rather than computed, because `box-shadow` here is a `var()` and jsdom does not
 * resolve custom properties.
 */
function declarationsFor(needle) {
    const block = defaults.split('}').find((part) => part.includes(needle) && part.includes('{'));
    return block ? block.slice(block.indexOf('{') + 1) : '';
}

const buttons = (root) => Array.from(root.querySelectorAll('button'));

/** `connectedCallback` defers `focusFirst` a frame, so focus assertions have to wait for it. */
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Keyed off the focused control when there is one, so the event reaches the root the way a real
 * keypress does, and off the root otherwise — focus parked on `document.body` is outside the guide,
 * and an event dispatched there never reaches it.
 */
function press(root, key, { shiftKey = false } = {}) {
    const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
    const from = root.contains(document.activeElement) ? document.activeElement : root;
    from.dispatchEvent(event);
    return event;
}

function dismissals(root) {
    const seen = [];
    root.addEventListener('pendo-action', (e) => {
        if (e.detail.action === 'dismiss') seen.push(e.detail);
    });
    return seen;
}

describe('embedded mode', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    it('a11y: announces an embed as plain content rather than a dialog', () => {
        const root = mount(EMBEDDED);

        expect(root.getAttribute('role')).toBeNull();
        expect(root.getAttribute('aria-modal')).toBeNull();
        expect(root.getAttribute('aria-labelledby')).toBeNull();
    });

    it('a11y: keeps the dialog semantics on an ordinary guide', () => {
        const root = mount();

        expect(root.getAttribute('role')).toBe('dialog');
        expect(root.getAttribute('aria-modal')).toBe('true');
        expect(root.getAttribute('aria-labelledby')).toBe(root.querySelector('pendo-title').id);
    });

    it('a11y: leaves focus where it was when an embed connects', async () => {
        const root = mount(EMBEDDED);
        await nextFrame();

        expect(document.activeElement).not.toBe(buttons(root)[0]);
        expect(document.activeElement).toBe(document.body);
    });

    it('a11y: still moves focus into an ordinary guide', async () => {
        const root = mount();
        await nextFrame();

        expect(document.activeElement).toBe(buttons(root)[0]);
    });

    it('a11y: lets Tab leave an embed instead of wrapping back into it', () => {
        const root = mount(EMBEDDED);
        const [first, last] = [buttons(root)[0], buttons(root).at(-1)];

        last.focus();
        expect(press(root, 'Tab').defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(last);

        first.focus();
        expect(press(root, 'Tab', { shiftKey: true }).defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(first);
    });

    it('a11y: keeps Tab inside an ordinary guide', () => {
        const root = mount();
        const [first, last] = [buttons(root)[0], buttons(root).at(-1)];

        last.focus();
        expect(press(root, 'Tab').defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(first);

        expect(press(root, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(last);
    });

    it('a11y: ignores Escape in an embed', () => {
        const root = mount(EMBEDDED);
        const seen = dismissals(root);

        expect(press(root, 'Escape').defaultPrevented).toBe(false);
        expect(seen).toEqual([]);
    });

    it('a11y: still dismisses an ordinary guide on Escape', () => {
        const root = mount();
        const seen = dismissals(root);

        press(root, 'Escape');

        expect(seen).toHaveLength(1);
    });

    it('drops its handlers when it leaves the document', () => {
        const root = mount();
        const seen = dismissals(root);

        root.remove();
        press(root, 'Escape');

        expect(seen).toEqual([]);
    });

    it('still renders the progress indicator for a multi-step embed', () => {
        const root = mount(`${EMBEDDED} step="2" total-steps="4"`);
        const progress = root.querySelector('.pendo-guide__progress');

        expect(progress).not.toBeNull();
        expect(progress.getAttribute('aria-valuenow')).toBe('2');
        expect(progress.querySelectorAll('.pendo-guide__progress-dot')).toHaveLength(4);
    });

    it('hands the width to the host and drops the floating shadow', () => {
        const declarations = declarationsFor('\n.pendo-guide--embedded {');

        // `relative`, matching what Pendo's other embedded guides are given, so every kind of
        // embed sits in a host the same way.
        expect(declarations).toMatch(/position:\s*relative/);
        expect(declarations).toMatch(/max-width:\s*none/);
        expect(declarations).toMatch(/width:\s*100%/);
        expect(declarations).toMatch(/box-shadow:\s*var\(--pendo-embedded-shadow,\s*none\)/);

        const root = render(EMBEDDED);
        expect(getComputedStyle(root).position).toBe('relative');
        expect(getComputedStyle(root).maxWidth).toBe('none');
    });

    it('sits flush in its host until a theme opens a margin', () => {
        expect(declarationsFor('\n.pendo-guide--embedded {')).toMatch(
            /margin:\s*var\(--pendo-embedded-margin,\s*0\)/
        );

        // Flush by default, and nothing upstream can open the gap on its own: the card the embed
        // inherits from declares no margin, so the fallback above is the whole story.
        expect(declarationsFor('\npendo-guide,\n.pendo-guide {')).not.toMatch(/(^|;)\s*margin:/);
    });

    it('grows with its content until it is given a cap', () => {
        expect(getComputedStyle(render(EMBEDDED)).display).toBe('block');

        const capped = render(`${EMBEDDED} style="max-height: 320px"`);

        // The cap rules exclude tooltip and banner, and deliberately not this: an embed scrolls its
        // content region, pins its title and fixes its footer like any other capped card.
        expect(getComputedStyle(capped).display).toBe('flex');
        expect(getComputedStyle(capped).overflowY).toBe('auto');
        expect(getComputedStyle(capped.querySelector('pendo-guide-content')).overflowY).toBe('auto');
        expect(getComputedStyle(capped).maxHeight).not.toBe('none');
    });

    /**
     * Last, because mounting a close button makes nwsapi mis-evaluate a later `:has()` in the same
     * file, and the cap assertions above depend on one.
     *
     * Not cosmetic: an authored close button is absolutely positioned, so a static card would hand
     * it to whatever in the host page happens to be positioned and drop it somewhere else entirely.
     */
    it('stays a containing block for an authored close button', () => {
        const root = render(EMBEDDED, `<pendo-close-button></pendo-close-button>${BODY}`);

        expect(root.querySelector('pendo-close-button')).not.toBeNull();
        expect(getComputedStyle(root).position).not.toBe('static');
    });
});
