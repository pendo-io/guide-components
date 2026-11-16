/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { registerGuideComponents } from '../src/register.js';
import { flatDefaults, ruleBody } from './css-source.js';

registerGuideComponents();

const GUIDE = '.pendo-guide.pendo-guide';
// A column of a `pendo-columns` is a content region too, so every rhythm rule names both.
const REGION = ':is(pendo-guide-content, pendo-column)';
const escape = (selector) => selector.replace(/[().]/g, '\\$&');
const RESET = new RegExp(`${escape(GUIDE)} ${escape(REGION)} > :is\\(([^)]*)\\) \\{ margin-block: 0; \\}`);
const RESET_TARGETS = `:is(${RESET.exec(flatDefaults)[1]})`;
const DIVIDER = `${GUIDE} ${REGION} > .pendo-guide__divider`;
const DIVIDER_AFTER_ROW = `${GUIDE} ${REGION} > pendo-action-row + .pendo-guide__divider`;
const DIVIDER_BEFORE_ROW = `${GUIDE} ${REGION} > .pendo-guide__divider:has(+ pendo-action-row)`;
const ROW_AFTER_DIVIDER = `${GUIDE} ${REGION} > .pendo-guide__divider + pendo-action-row`;
const ROW_BEFORE_DIVIDER = `${GUIDE} ${REGION} > pendo-action-row:has(+ .pendo-guide__divider)`;

function mount(inner) {
    document.body.innerHTML = `<pendo-guide><pendo-guide-content>${inner}</pendo-guide-content></pendo-guide>`;
    return document.querySelector('pendo-guide-content');
}

/** Mount `inner` in the first of two columns, straight in the guide, with no content region. */
function mountInColumn(inner) {
    document.body.innerHTML = `<pendo-guide><pendo-columns><pendo-column>${inner}</pendo-column><pendo-column></pendo-column></pendo-columns></pendo-guide>`;
    return document.querySelector('pendo-column');
}

/** Every block a content region holds, as the tag and the markup that mounts one. */
const BLOCKS = [
    ['pendo-title', '<pendo-title>T</pendo-title>'],
    ['pendo-text', '<pendo-text>T</pendo-text>'],
    ['pendo-image', '<pendo-image src="x.png"></pendo-image>'],
    ['pendo-video', '<pendo-video src="https://example.com/v.mp4"></pendo-video>'],
    ['pendo-list', '<pendo-list><li>A</li></pendo-list>'],
    ['pendo-input', '<pendo-input></pendo-input>'],
    ['pendo-star-rating', '<pendo-star-rating poll-id="p"></pendo-star-rating>'],
    ['pendo-nps', '<pendo-nps poll-id="p"></pendo-nps>'],
    ['pendo-number-scale', '<pendo-number-scale poll-id="p"></pendo-number-scale>'],
    ['pendo-emoji-scale', '<pendo-emoji-scale poll-id="p"></pendo-emoji-scale>'],
    ['pendo-open-text', '<pendo-open-text poll-id="p"></pendo-open-text>'],
    ['pendo-button', '<pendo-button action="dismiss">Go</pendo-button>'],
    ['pendo-link', '<pendo-link href="https://example.com">Docs</pendo-link>'],
    ['pendo-columns', '<pendo-columns><pendo-column></pendo-column><pendo-column></pendo-column></pendo-columns>'],
];

// Selectors and declarations are read rather than computed: jsdom's cascade ignores specificity,
// and every rule here exists to out-specify an element's own margin.
describe('content rhythm', () => {
    it('lays the region out as a column spaced by one gap a theme cannot override', () => {
        const region = ruleBody('pendo-guide-content');

        expect(region).toContain('display: flex !important;');
        expect(region).toContain('flex-direction: column !important;');
        expect(region).toContain('gap: var(--pendo-content-gap, var(--pendo-spacing-xs)) !important;');
    });

    // An element left out of the reset keeps a margin that assumes block flow, and in a flex column
    // that margin adds to the gap instead of collapsing into it.
    it.each(BLOCKS)("drops %s's own vertical margin inside the region", (_tag, html) => {
        expect(mount(html).firstElementChild.matches(`${GUIDE} ${REGION} > ${RESET_TARGETS}`)).toBe(true);
    });

    // A column spaces its blocks with the same gap, in a content region or straight in the guide.
    it.each(BLOCKS)("drops %s's own vertical margin inside a column", (_tag, html) => {
        expect(mountInColumn(html).firstElementChild.matches(`${GUIDE} ${REGION} > ${RESET_TARGETS}`)).toBe(true);
    });

    it('spaces dividers and rows inside a column as it does in the region', () => {
        const column = mountInColumn('<pendo-text>Intro</pendo-text><pendo-divider></pendo-divider><pendo-action-row action="dismiss">Row</pendo-action-row>');
        const divider = column.querySelector('pendo-divider');

        expect(divider.matches(DIVIDER)).toBe(true);
        expect(divider.matches(DIVIDER_BEFORE_ROW)).toBe(true);
        expect(column.querySelector('pendo-action-row').matches(ROW_AFTER_DIVIDER)).toBe(true);
    });

    // (0,3,1) against a stored dark palette's (0,2,2) `.dark pendo-guide[data-pendo-theme-id] pendo-text
    // { margin-bottom }`, which would otherwise add its margin to the gap. An inline margin still wins.
    it("prefixes the reset with the guide so it out-specifies a theme's scoped element margins", () => {
        expect(flatDefaults).toMatch(RESET);
    });

    it('spaces a section divider by the gap plus its own token', () => {
        expect(ruleBody(DIVIDER)).toContain('margin-block: var(--pendo-divider-spacing, var(--pendo-spacing-xs));');
    });

    // A row pads its own text, so beside a divider the row takes the divider's spacing on that side
    // and gives back its own padding, which an author may set on that row alone.
    it('moves the spacing beside a row from the divider onto the row', () => {
        const handBack = 'max(calc(-1 * var(--pendo-content-gap, var(--pendo-spacing-xs))), var(--pendo-divider-spacing, var(--pendo-spacing-xs)) - var(--pendo-action-row-padding-y, var(--pendo-spacing-xs)))';
        expect(ruleBody(DIVIDER_AFTER_ROW)).toContain('margin-top: 0;');
        expect(ruleBody(DIVIDER_BEFORE_ROW)).toContain('margin-bottom: 0;');
        expect(ruleBody(ROW_AFTER_DIVIDER)).toContain(`margin-top: ${handBack};`);
        expect(ruleBody(ROW_BEFORE_DIVIDER)).toContain(`margin-bottom: ${handBack};`);

        const row = '<pendo-action-row action="dismiss">Row</pendo-action-row>';
        const region = mount(
            `<pendo-text>Intro</pendo-text><pendo-divider></pendo-divider>${row}${row}<pendo-divider></pendo-divider><pendo-text>Footer</pendo-text><pendo-divider></pendo-divider><pendo-text>End</pendo-text>`
        );
        const dividers = [...region.querySelectorAll('pendo-divider')].map((d) => [d.matches(DIVIDER_AFTER_ROW), d.matches(DIVIDER_BEFORE_ROW)]);
        const rows = [...region.querySelectorAll('pendo-action-row')].map((r) => [r.matches(ROW_AFTER_DIVIDER), r.matches(ROW_BEFORE_DIVIDER)]);

        expect(dividers).toEqual([[false, true], [true, false], [false, false]]);
        expect(rows).toEqual([[true, false], [false, true]]);
    });

    // Stacked in the column, the side-by-side spacing between neighbouring buttons would indent the second.
    it('drops the inline spacing between stacked buttons and links', () => {
        expect(ruleBody(`${GUIDE} ${REGION} > :is(pendo-button, pendo-link)`)).toContain('margin-inline: 0;');
    });

    // On the region itself, which a theme's token on the guide root only reaches by inheritance.
    it('closes the gap in a banner even when a theme sets one', () => {
        expect(ruleBody('.pendo-guide--banner > pendo-guide-content')).toContain('--pendo-content-gap: 0px !important;');
    });

    // The sticky title turns the gap into padding plus a negative margin; losing the margin to the
    // reset would leave a slideout's title the gap further from its content than any other card's.
    it("keeps the slideout's sticky title above the reset", () => {
        expect(flatDefaults).toContain('.pendo-guide.pendo-guide--slideout:has(> pendo-guide-content) > pendo-guide-content > pendo-title:first-child');
    });

    // An empty child has no content height to hold it open, so a capped region that outgrows its cap
    // would shrink a divider to nothing.
    it('scrolls a capped region rather than shrinking its children', () => {
        expect(ruleBody(`${GUIDE} ${REGION} > *`)).toContain('flex-shrink: 0;');
    });

    it('keeps the elements their own margins outside a content region', () => {
        document.body.innerHTML = '<pendo-guide><pendo-text>T</pendo-text><pendo-divider></pendo-divider></pendo-guide>';

        expect(document.querySelector('pendo-text').matches(`${GUIDE} ${REGION} > ${RESET_TARGETS}`)).toBe(false);
        expect(document.querySelector('pendo-divider').matches(DIVIDER)).toBe(false);
    });
});
