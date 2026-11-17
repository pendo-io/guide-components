/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import * as library from '../src/index.js';
import { PendoAccordion, PendoAccordionItem } from '../src/elements/pendo-accordion.js';
import { registerGuideComponents } from '../src/register.js';
import { flatDefaults, ruleBody } from './css-source.js';

registerGuideComponents();

const FAQ =
    '<pendo-accordion>' +
    '<pendo-accordion-item label="How do I export a report?"><pendo-text>Open it and choose Export.</pendo-text></pendo-accordion-item>' +
    '<pendo-accordion-item label="Who can see my reports?" open><pendo-text>Your team.</pendo-text><pendo-button action="dismiss">Got it</pendo-button></pendo-accordion-item>' +
    '</pendo-accordion>';

/** Mount `inner` in a guide's content region and return the guide. */
function mount(inner = FAQ) {
    document.body.innerHTML = `<pendo-guide><pendo-guide-content>${inner}</pendo-guide-content></pendo-guide>`;
    return document.querySelector('pendo-guide');
}

const items = () => [...document.querySelectorAll('pendo-accordion-item')];
const labelRow = (item) => item.shadowRoot.querySelector('[part~="label"]');
const body = (item) => item.shadowRoot.getElementById(labelRow(item).getAttribute('aria-controls'));
const icon = (item) => item.shadowRoot.querySelector('[part~="icon"]');

describe('pendo-accordion', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    describe('elements', () => {
        it('registers both tags', () => {
            expect(customElements.get('pendo-accordion')).toBe(PendoAccordion);
            expect(customElements.get('pendo-accordion-item')).toBe(PendoAccordionItem);
        });

        it('exports both classes from the package entry', () => {
            expect(library.PendoAccordion).toBe(PendoAccordion);
            expect(library.PendoAccordionItem).toBe(PendoAccordionItem);
        });

        // The client gates content by removing elements before the guide connects, and an editor
        // reads the authored markup back, so connecting, reconnecting and opening must not add, move
        // or drop anything in it, the `open` attribute included.
        it('leaves the authored markup exactly as it was, connected, reconnected and toggled', () => {
            const authored =
                '<pendo-accordion data-pendo-requires-any="g1">' +
                '<pendo-accordion-item label="Q1" data-pendo-requires-guide="g2">Answer one</pendo-accordion-item>' +
                '<pendo-accordion-item label="Q2" open="">Answer two</pendo-accordion-item>' +
                '</pendo-accordion>';
            mount(authored);
            const accordion = document.querySelector('pendo-accordion');

            expect(accordion).toBeInstanceOf(PendoAccordion);
            expect(accordion.firstElementChild).toBeInstanceOf(PendoAccordionItem);
            expect(accordion.outerHTML).toBe(authored);

            const [first, second] = items();
            labelRow(first).click();
            labelRow(second).click();
            expect(accordion.outerHTML).toBe(authored);

            document.querySelector('pendo-guide').appendChild(accordion);
            expect(accordion.outerHTML).toBe(authored);
        });

        it('shows its children in the body, through a slot', () => {
            mount();
            const [, item] = items();
            const slot = item.shadowRoot.querySelector('[part="content"] > slot');

            expect(slot.assignedElements()).toEqual([...item.children]);
            expect(body(item).contains(slot)).toBe(true);
        });
    });

    describe('label row', () => {
        it('shows the label as plain text, never as markup', () => {
            mount('<pendo-accordion><pendo-accordion-item label="<b>Bold</b> &amp; more"></pendo-accordion-item></pendo-accordion>');
            const row = labelRow(items()[0]);

            expect(row.textContent).toBe('<b>Bold</b> & more');
            expect(row.querySelector('b')).toBeNull();
        });

        it('follows a label edited on the live item', () => {
            mount();
            const [item] = items();
            item.setAttribute('label', 'How do I share a report?');

            expect(labelRow(item).textContent).toBe('How do I share a report?');
        });

        it('warns about an item without a label', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            mount('<pendo-accordion><pendo-accordion-item></pendo-accordion-item></pendo-accordion>');

            expect(warn).toHaveBeenCalledWith('pendo-accordion-item: missing required "label" attribute');
            expect(labelRow(items()[0]).textContent).toBe('');
            warn.mockRestore();
        });

        // A real button gives Enter and Space and a place in the Tab order with no script of its own.
        it('a11y: is a button that controls the body, inside a heading', () => {
            mount();
            const [item] = items();
            const row = labelRow(item);

            expect(row.localName).toBe('button');
            expect(row.type).toBe('button');
            expect(body(item)).not.toBeNull();
            expect(row.parentElement.getAttribute('role')).toBe('heading');
            expect(row.parentElement.getAttribute('aria-level')).toBe('3');
            expect(icon(item).querySelector('svg').getAttribute('aria-hidden')).toBe('true');
        });

        it('a11y: gives each item a body id of its own', () => {
            mount();
            const [first, second] = items();

            expect(labelRow(first).getAttribute('aria-controls')).not.toBe(labelRow(second).getAttribute('aria-controls'));
        });
    });

    describe('opening and closing', () => {
        it('a11y: starts closed, with the body hidden', () => {
            mount();
            const [item] = items();

            expect(item.expanded).toBe(false);
            expect(labelRow(item).getAttribute('aria-expanded')).toBe('false');
            expect(body(item).hidden).toBe(true);
            expect(icon(item).getAttribute('part')).toBe('icon');
        });

        it('a11y: starts open with `open`', () => {
            mount();
            const [, item] = items();

            expect(item.expanded).toBe(true);
            expect(labelRow(item).getAttribute('aria-expanded')).toBe('true');
            expect(body(item).hidden).toBe(false);
            expect(icon(item).getAttribute('part')).toBe('icon icon-open');
        });

        it('opens and closes on a click of the label row', () => {
            mount();
            const [item] = items();

            labelRow(item).click();
            expect(item.expanded).toBe(true);
            expect(body(item).hidden).toBe(false);

            labelRow(item).click();
            expect(item.expanded).toBe(false);
            expect(body(item).hidden).toBe(true);
        });

        // Each item opens on its own; an FAQ reader may want two answers side by side.
        it('leaves the other items as they are', () => {
            mount();
            const [first, second] = items();

            labelRow(first).click();
            expect(second.expanded).toBe(true);
            labelRow(second).click();
            expect(first.expanded).toBe(true);
        });

        it('sends no action or response event', () => {
            const guide = mount();
            const events = [];
            guide.addEventListener('pendo-action', (e) => events.push(e));
            guide.addEventListener('pendo-response', (e) => events.push(e));

            labelRow(items()[0]).click();
            expect(events).toEqual([]);
        });

        // An authoring surface turns "open at the start" on and off on the live item, and the
        // preview should show the result.
        it('opens and closes when `open` is turned on and off', () => {
            mount();
            const [item] = items();

            item.setAttribute('open', '');
            expect(item.expanded).toBe(true);
            item.removeAttribute('open');
            expect(item.expanded).toBe(false);
        });

        // A hidden body does not stop a video in it: it would play on, with sound and no control.
        it('stops a video playing in its body when it closes', () => {
            mount(
                '<pendo-accordion><pendo-accordion-item label="Tour" open>' +
                    '<pendo-video src="https://example.com/tour.mp4"></pendo-video>' +
                    '<pendo-video src="https://www.youtube.com/watch?v=abcdefghijk"></pendo-video>' +
                    '</pendo-accordion-item></pendo-accordion>'
            );
            const [item] = items();
            const video = item.querySelector('video');
            const frame = item.querySelector('iframe');
            const pause = vi.spyOn(video, 'pause').mockImplementation(() => {});
            const reloads = [];
            new MutationObserver((records) => reloads.push(...records.map((r) => r.attributeName))).observe(frame, { attributes: true });

            labelRow(item).click();

            expect(pause).toHaveBeenCalledTimes(1);
            return Promise.resolve().then(() => {
                expect(reloads).toEqual(['src']);
                expect(frame.getAttribute('src')).toBe('https://www.youtube.com/embed/abcdefghijk');
            });
        });

        it('leaves media alone when it opens, or is set closed while already closed', () => {
            mount('<pendo-accordion><pendo-accordion-item label="Tour"><pendo-video src="https://example.com/tour.mp4"></pendo-video></pendo-accordion-item></pendo-accordion>');
            const [item] = items();
            const pause = vi.spyOn(item.querySelector('video'), 'pause').mockImplementation(() => {});

            item.expanded = false;
            item.expanded = true;

            expect(pause).not.toHaveBeenCalled();
        });

        it('opens and closes through `expanded` and `toggle()`', () => {
            mount();
            const [item] = items();

            item.expanded = true;
            expect(body(item).hidden).toBe(false);
            item.toggle();
            expect(body(item).hidden).toBe(true);
            expect(item.hasAttribute('open')).toBe(false);
        });

        it('keeps the state the reader left it in when it reconnects', () => {
            mount();
            const [item] = items();
            labelRow(item).click();

            item.parentElement.appendChild(item);
            expect(item.expanded).toBe(true);
        });

        it('builds a working label row for an item made by script or cloned', () => {
            mount('<pendo-accordion></pendo-accordion>');
            const made = document.createElement('pendo-accordion-item');
            made.setAttribute('label', 'Made');
            made.setAttribute('open', '');
            document.querySelector('pendo-accordion').appendChild(made);
            const clone = made.cloneNode(true);
            document.querySelector('pendo-accordion').appendChild(clone);

            expect(labelRow(made).textContent).toBe('Made');
            expect(made.expanded).toBe(true);
            expect(clone.shadowRoot).not.toBe(made.shadowRoot);
            expect(labelRow(clone).textContent).toBe('Made');
            labelRow(clone).click();
            expect(clone.expanded).toBe(false);
            expect(made.expanded).toBe(true);
        });
    });

    describe('focus trap', () => {
        // The trap filters candidates on `offsetParent`, which jsdom reports as null for everything.
        // This stands in for a browser's: null for an element in a `hidden` box, walking the flat
        // tree, so a control slotted into a closed item's body counts as not drawn.
        let realOffsetParent;

        const flatParent = (el) => el.assignedSlot || el.parentElement || el.getRootNode().host || null;

        beforeAll(() => {
            realOffsetParent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
            Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
                configurable: true,
                get() {
                    for (let el = this; el; el = flatParent(el)) {
                        if (el.hidden) return null;
                    }
                    return flatParent(this);
                }
            });
        });

        afterAll(() => {
            Object.defineProperty(HTMLElement.prototype, 'offsetParent', realOffsetParent);
        });

        const press = (target, key, init = {}) => {
            const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true, ...init });
            target.dispatchEvent(event);
            return event;
        };

        // A label row is in the item's shadow root: a query of the guide's light DOM would not list
        // it, so Tab from the last row would leave the guide, and Shift+Tab from the first control
        // would skip it.
        it('a11y: wraps Tab from a last label row to the first control, and back', () => {
            mount('<pendo-button action="dismiss">Start</pendo-button><pendo-accordion><pendo-accordion-item label="Q"><pendo-text>A</pendo-text></pendo-accordion-item></pendo-accordion>');
            const start = document.querySelector('pendo-button button');
            const row = labelRow(items()[0]);

            row.focus();
            expect(press(row, 'Tab').defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(start);

            expect(press(start, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
            expect(items()[0].shadowRoot.activeElement).toBe(row);
        });

        // A button in a closed body is not drawn, so the last label row is the last stop, and Tab
        // from it wraps rather than heading for the button the reader cannot see.
        it('a11y: skips the controls in a closed body', () => {
            mount('<pendo-button action="dismiss">Start</pendo-button><pendo-accordion><pendo-accordion-item label="Q"><pendo-button action="dismiss">In body</pendo-button></pendo-accordion-item></pendo-accordion>');
            const [start] = document.querySelectorAll('pendo-button button');
            const row = labelRow(items()[0]);

            row.focus();
            expect(press(row, 'Tab').defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(start);

            items()[0].expanded = true;
            row.focus();
            expect(press(row, 'Tab').defaultPrevented).toBe(false);
        });

        it('a11y: lists a label row before the controls in its body', async () => {
            mount('<pendo-accordion><pendo-accordion-item label="Q" open><pendo-button action="dismiss">In body</pendo-button></pendo-accordion-item></pendo-accordion>');
            await new Promise((resolve) => requestAnimationFrame(resolve));

            expect(items()[0].shadowRoot.activeElement).toBe(labelRow(items()[0]));
        });
    });

    describe('styles', () => {
        it('holds its display against a theme, and hides with `hidden`', () => {
            expect(ruleBody('pendo-accordion')).toContain('display: block !important;');
            expect(ruleBody('pendo-accordion-item')).toContain('display: block !important;');
            expect(ruleBody(':is(pendo-accordion, pendo-accordion-item)[hidden]')).toContain('display: none !important;');
        });

        it('keeps its own bottom margin outside a content region, and drops it as the last block', () => {
            expect(ruleBody('pendo-accordion')).toContain('margin: 0 0 var(--pendo-spacing) 0;');
            expect(ruleBody('pendo-accordion:last-child')).toContain('margin-bottom: 0;');
        });

        it('draws a line between two items, not above the first shown one', () => {
            mount(
                '<pendo-accordion>' +
                    ['A', 'B', 'C'].map((label) => `<pendo-accordion-item label="${label}"><pendo-text>x</pendo-text></pendo-accordion-item>`).join('') +
                    '</pendo-accordion>'
            );
            const [first, second, third] = items();
            const rule = 'pendo-accordion-item:not([hidden]) ~ pendo-accordion-item';

            expect(ruleBody(rule)).toContain('border-top: var(--pendo-accordion-border, 1px solid var(--pendo-border));');
            expect([first, second, third].map((item) => item.matches(rule))).toEqual([false, true, true]);

            // A `hidden` first item leaves the item now first without a line above it.
            first.hidden = true;
            expect([second, third].map((item) => item.matches(rule))).toEqual([false, true]);
        });

        // A button starts from the browser's own look; any of it left would show in the guide.
        it("drops the browser's button look from the label row", () => {
            const body = ruleBody('pendo-accordion-item::part(label)');

            for (const declaration of ['border: none;', 'background: none;', 'font-family: inherit;', 'margin: 0;', 'width: 100%;', 'text-align: start;', 'cursor: pointer;']) {
                expect(body).toContain(declaration);
            }
        });

        // A URL or a German compound is wider than the row; without a break it runs out of the guide
        // and pushes the chevron off the edge. The text span is not a part, so it inherits this.
        it('breaks a label word too long for the row', () => {
            expect(ruleBody('pendo-accordion-item::part(label)')).toContain('overflow-wrap: anywhere;');
        });

        // The ring is drawn 2px inside the row, so the row pads its sides too, and the body pads the
        // same sides so the label and the body line up.
        it('pads the label row and the body on the same sides, with room for the focus ring', () => {
            expect(ruleBody('pendo-accordion-item::part(label)')).toContain(
                'padding: var(--pendo-accordion-label-padding, var(--pendo-spacing-sm) var(--pendo-spacing-xs));'
            );
            expect(ruleBody('pendo-accordion-item::part(content)')).toContain(
                'padding: var(--pendo-accordion-body-padding, 0 var(--pendo-spacing-xs) var(--pendo-spacing-sm));'
            );
        });

        it('turns the chevron while the item is open', () => {
            expect(ruleBody('pendo-accordion-item::part(icon-open)')).toContain('transform: rotate(180deg);');
        });

        // Inset, as an action row's ring is: the content region around the row can scroll and would
        // clip an outline drawn outside it.
        it('a11y: draws a focus ring inside the label row', () => {
            const body = ruleBody('pendo-accordion-item::part(label):focus-visible');

            expect(body).toContain('outline: 2px solid var(--pendo-focus);');
            expect(body).toContain('outline-offset: -2px;');
        });

        // A `display` on the box that carries `hidden` would outrank the browser's own rule and show
        // a closed body.
        it('never sets a display on the box that hides a closed body', () => {
            mount();
            const [item] = items();

            expect(body(item).hasAttribute('part')).toBe(false);
            expect(flatDefaults).not.toMatch(/::part\(body\)/);
        });

        it('reads no accordion token without a fallback', () => {
            const bare = [...flatDefaults.matchAll(/var\(\s*(--pendo-accordion-[a-z0-9-]+)\s*\)/g)].map((m) => m[1]);
            expect(bare).toEqual([]);
        });
    });
});
