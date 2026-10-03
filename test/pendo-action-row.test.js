/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PendoButton } from '../src/elements/pendo-button.js';
import { PendoActionRow } from '../src/elements/pendo-action-row.js';
import { parseActionAttribute } from '../src/actions.js';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

/** Read from this file's location; see `host-unpaintable.test.js` for why not `new URL(...)`. */
const defaults = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/defaults.css'),
    'utf8'
);

/** Mount `html` in a guide and return the first row. */
function mount(html) {
    document.body.innerHTML = `<pendo-guide>${html}</pendo-guide>`;
    return document.querySelector('pendo-action-row');
}

/** Click the row and resolve with the actions the client would receive. */
function clickAndCollect(row) {
    let detail = null;
    document.addEventListener('pendo-action', (e) => { detail = e.detail; }, { once: true });
    row.querySelector('button').click();
    return detail;
}

describe('pendo-action-row', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    describe('rendering', () => {
        it('wraps a real button, so it is focusable and keyboard-operable', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');
            const button = row.querySelector('button.pendo-action-row');

            expect(button).not.toBeNull();
            expect(button.type).toBe('button');
            expect(button.querySelector('.pendo-action-row__label').textContent).toBe('Billing');
        });

        it('keeps inline formatting in the label', () => {
            const row = mount('<pendo-action-row action="dismiss">Read the <strong>docs</strong></pendo-action-row>');

            expect(row.querySelector('.pendo-action-row__label').innerHTML).toBe('Read the <strong>docs</strong>');
        });

        it('draws the description as a second line', () => {
            const row = mount('<pendo-action-row action="dismiss" description="Plans and invoices">Billing</pendo-action-row>');

            expect(row.querySelector('.pendo-action-row__description').textContent).toBe('Plans and invoices');
        });

        it('draws no description element when there is none', () => {
            const row = mount('<pendo-action-row action="dismiss">Billing</pendo-action-row>');

            expect(row.querySelector('.pendo-action-row__description')).toBeNull();
        });

        // An attribute value is data. Treating it as markup would let anything that can set a
        // `description` inject elements into the guide.
        it('treats the description as text, never markup', () => {
            const row = mount('<pendo-action-row action="dismiss" description="&lt;img src=x onerror=alert(1)&gt;">Billing</pendo-action-row>');

            expect(row.querySelector('.pendo-action-row__description img')).toBeNull();
            expect(row.querySelector('.pendo-action-row__description').textContent).toBe('<img src=x onerror=alert(1)>');
        });

        it('builds once: a reconnect does not wrap the control in a second one', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');
            const guide = row.parentElement;

            guide.removeChild(row);
            guide.appendChild(row);

            expect(row.querySelectorAll('button')).toHaveLength(1);
            expect(row.querySelector('.pendo-action-row__label').textContent).toBe('Billing');
        });
    });

    // The client gates content with these attributes on whichever element carries them, and removes
    // the element before this one connects. The host being rebuilt and losing them is exactly how
    // `pendo-list-item` silently loses a gate.
    describe('attributes on the authored element', () => {
        it('keeps a gate and the action on the host', () => {
            const row = mount(
                '<pendo-action-row data-pendo-requires-any="a,b" action="go-to-step:2">Billing</pendo-action-row>'
            );

            expect(row.getAttribute('data-pendo-requires-any')).toBe('a,b');
            expect(row.getAttribute('action')).toBe('go-to-step:2');
        });
    });

    describe('click', () => {
        it('emits pendo-action with the parsed actions, bubbling out of the guide', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');

            expect(clickAndCollect(row)).toEqual({ actions: [{ action: 'go-to-step', stepId: '2' }] });
        });

        it('launches a guide by id', () => {
            const row = mount('<pendo-action-row action="launch-guide:abc">Tour</pendo-action-row>');

            expect(clickAndCollect(row)).toEqual({ actions: [{ action: 'launch-guide', guideId: 'abc' }] });
        });

        it('opens a link in a new tab unless told otherwise', () => {
            const row = mount('<pendo-action-row action="link:https://example.com">Docs</pendo-action-row>');

            expect(clickAndCollect(row)).toEqual({
                actions: [{ action: 'link', url: 'https://example.com', target: '_blank' }]
            });
        });

        it('honours target on a link', () => {
            const row = mount('<pendo-action-row action="link:/help" target="_self">Help</pendo-action-row>');

            expect(clickAndCollect(row).actions[0].target).toBe('_self');
        });

        it('runs a compound action list in order', () => {
            const row = mount(
                `<pendo-action-row action='[{"action":"go-to-step","stepId":"2"},{"action":"dismiss"}]'>Go</pendo-action-row>`
            );

            expect(clickAndCollect(row).actions.map((a) => a.action)).toEqual(['go-to-step', 'dismiss']);
        });

        it('dismisses with no action, as a button does', () => {
            const row = mount('<pendo-action-row>Close</pendo-action-row>');

            expect(clickAndCollect(row)).toEqual({ actions: [{ action: 'dismiss' }] });
        });
    });

    describe('trailing glyph', () => {
        const glyphOf = (attrs) => {
            const row = mount(`<pendo-action-row ${attrs}>Item</pendo-action-row>`);
            const trailing = row.querySelector('.pendo-action-row__trailing');
            return trailing ? [...trailing.classList].find((c) => c.endsWith('--chevron') || c.endsWith('--external')) : null;
        };

        it.each([
            ['action="go-to-step:2"', 'pendo-action-row__trailing--chevron'],
            ['action="launch-guide:abc"', 'pendo-action-row__trailing--chevron'],
            ['action="link:https://example.com"', 'pendo-action-row__trailing--external']
        ])('reflects the action: %s', (attrs, expected) => {
            expect(glyphOf(attrs)).toBe(expected);
        });

        it.each(['action="dismiss"', 'action="next-step"', 'action="snooze:1000"', ''])(
            'draws none for an action that opens nothing: %s',
            (attrs) => {
                expect(glyphOf(attrs)).toBeNull();
            }
        );

        it('lets the first action that opens something decide in a compound list', () => {
            expect(glyphOf(`action='[{"action":"dismiss"},{"action":"link","url":"/x"}]'`))
                .toBe('pendo-action-row__trailing--external');
        });

        it('can be suppressed', () => {
            expect(glyphOf('action="go-to-step:2" trailing="none"')).toBeNull();
        });

        it('can be overridden', () => {
            expect(glyphOf('action="go-to-step:2" trailing="external"')).toBe('pendo-action-row__trailing--external');
        });

        it('ignores an unknown override and falls back to the action', () => {
            expect(glyphOf('action="go-to-step:2" trailing="sparkle"')).toBe('pendo-action-row__trailing--chevron');
        });

        // The glyph is decoration; the row's name is its label and description.
        it('hides the glyph from assistive technology', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');

            expect(row.querySelector('.pendo-action-row__trailing svg').getAttribute('aria-hidden')).toBe('true');
        });
    });

    // A second copy of the grammar that drifted would give a row that renders, clicks and does
    // nothing, because the client reads the action objects by property name.
    describe('shares one action grammar with pendo-button', () => {
        const button = new PendoButton();
        const row = new PendoActionRow();

        it.each([
            'dismiss',
            'next-step',
            'go-to-step:3',
            'launch-guide:g-1',
            'link:https://example.com/a?b=c:d',
            'snooze:86400000',
            'custom:thing',
            '{"action":"go-to-step","stepId":"abc"}',
            '[{"action":"submit-poll"},{"action":"dismiss"}]',
            '[not json',
            ''
        ])('parses %j identically', (attr) => {
            expect(row.parseAction(attr)).toEqual(button.parseAction(attr));
            expect(row.parseAction(attr)).toEqual(parseActionAttribute(attr));
        });
    });

    // An authoring surface edits these on the live element; rebuilding the row for each would
    // discard the label the author is typing into.
    describe('attributes changed after the row is built', () => {
        const glyphOf = (row) => {
            const trailing = row.querySelector('.pendo-action-row__trailing');
            return trailing && [...trailing.classList].find((c) => c.endsWith('--chevron') || c.endsWith('--external'));
        };

        it('adds, changes and removes the description line', () => {
            const row = mount('<pendo-action-row action="dismiss">Billing</pendo-action-row>');

            row.setAttribute('description', 'Plans');
            expect(row.querySelector('.pendo-action-row__description').textContent).toBe('Plans');

            row.setAttribute('description', 'Plans and invoices');
            expect(row.querySelectorAll('.pendo-action-row__description')).toHaveLength(1);
            expect(row.querySelector('.pendo-action-row__description').textContent).toBe('Plans and invoices');

            row.removeAttribute('description');
            expect(row.querySelector('.pendo-action-row__description')).toBeNull();
        });

        it('treats a changed description as text, never markup', () => {
            const row = mount('<pendo-action-row action="dismiss">Billing</pendo-action-row>');

            row.setAttribute('description', '<img src=x onerror=alert(1)>');

            expect(row.querySelector('.pendo-action-row__description img')).toBeNull();
        });

        it('re-derives the trailing glyph when the action changes', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');
            expect(glyphOf(row)).toBe('pendo-action-row__trailing--chevron');

            row.setAttribute('action', 'link:https://example.com');
            expect(glyphOf(row)).toBe('pendo-action-row__trailing--external');

            row.setAttribute('action', 'dismiss');
            expect(glyphOf(row)).toBeFalsy();
            expect(row.querySelectorAll('.pendo-action-row__trailing')).toHaveLength(0);
        });

        it('honours a trailing override added and removed later', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');

            row.setAttribute('trailing', 'none');
            expect(row.querySelector('.pendo-action-row__trailing')).toBeNull();

            row.setAttribute('trailing', 'external');
            expect(glyphOf(row)).toBe('pendo-action-row__trailing--external');

            row.removeAttribute('trailing');
            expect(glyphOf(row)).toBe('pendo-action-row__trailing--chevron');
        });

        it('never rebuilds the label', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');
            const label = row.querySelector('.pendo-action-row__label');
            label.textContent = 'Billing and plans';

            row.setAttribute('description', 'Plans');
            row.setAttribute('action', 'dismiss');

            expect(row.querySelector('.pendo-action-row__label')).toBe(label);
            expect(label.textContent).toBe('Billing and plans');
        });

        it('emits the new action on the next click', () => {
            const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');

            row.setAttribute('action', 'launch-guide:abc');

            expect(clickAndCollect(row)).toEqual({ actions: [{ action: 'launch-guide', guideId: 'abc' }] });
        });
    });

    // The click listener lives on the host, so a clone of a built row is not left dead.
    it('still responds to a click after being cloned', () => {
        const row = mount('<pendo-action-row action="go-to-step:2">Billing</pendo-action-row>');
        const copy = row.cloneNode(true);
        row.parentElement.appendChild(copy);

        expect(copy.querySelectorAll('button')).toHaveLength(1);
        expect(clickAndCollect(copy)).toEqual({ actions: [{ action: 'go-to-step', stepId: '2' }] });
    });

    // The same decoy-box problem `pendo-button` had (INT-672): a theme written for tag-based
    // rendering styles the authored tag, which here wraps the real control.
    describe('the host is unpaintable', () => {
        it("drops a legacy theme's host paint", () => {
            document.head.innerHTML = `<style>${defaults}</style><style>
                pendo-guide[data-pendo-theme-id="t1"] pendo-action-row {
                    background: #0b5;
                    border: 2px solid #093;
                    padding: 10px 20px;
                }
            </style>`;
            document.body.innerHTML =
                '<pendo-guide data-pendo-theme-id="t1"><pendo-action-row action="dismiss">Go</pendo-action-row></pendo-guide>';

            const style = getComputedStyle(document.querySelector('pendo-action-row'));

            expect(style.padding).toBe('0px');
            expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        });
    });
});
