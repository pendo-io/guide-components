/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

const defaults = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/defaults.css'),
    'utf8'
);

const CONTENT = '<pendo-text>Row one.</pendo-text><pendo-text>Row two.</pendo-text>';

/**
 * The declarations of the rule whose selector list contains `needle`.
 *
 * Read from source because jsdom reports nothing for `top` and resolves `inherit` to transparent,
 * and both are load-bearing here — a sticky element with no `top` never sticks, and the inherited
 * paint is what keeps a themed card's title from going white.
 */
function declarationsFor(needle) {
    const block = defaults.split('}').find((part) => part.includes(needle) && part.includes('{'));
    return block ? block.slice(block.indexOf('{') + 1) : '';
}

/** Mount a guide root with the component sheet applied, and hand back the root. */
function render(attrs, inner) {
    document.head.innerHTML = `<style>${defaults}</style>`;
    document.body.innerHTML = `<pendo-guide ${attrs}>${inner}</pendo-guide>`;
    return document.querySelector('pendo-guide');
}

/**
 * The shape guides are actually built in: the title sits *inside* the content region, which is what
 * the step builder emits and what every authoring example shows. A fixture with the title outside
 * the region is not a guide this renders, and it hides whether the title survives a scroll.
 */
const WRAPPED = `<pendo-guide-content><pendo-title>Help</pendo-title>${CONTENT}</pendo-guide-content><pendo-guide-footer><pendo-button action="dismiss">Back</pendo-button></pendo-guide-footer>`;
const BARE = `<pendo-title>Help</pendo-title>${CONTENT}`;

/**
 * Several tests here assert that a card is *not* flexed. Those are not vacuous: `:has()` is what
 * selects the capped cards, and the positive tests below fail outright if this environment's cascade
 * does not resolve it.
 */
describe('height cap', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    it('scrolls the content region and pins the card when a capped guide has one', () => {
        const root = render('style="max-height: 320px"', WRAPPED);
        const region = root.querySelector('pendo-guide-content');

        expect(getComputedStyle(root).display).toBe('flex');
        expect(getComputedStyle(root).flexDirection).toBe('column');
        // `auto` rather than `hidden`: the region absorbs the slack so nothing reaches the card's
        // edge here and no scrollbar appears, while the chrome-too-tall case below stays reachable.
        expect(getComputedStyle(root).overflowY).toBe('auto');
        expect(getComputedStyle(region).overflowY).toBe('auto');
        // Without this the region's automatic minimum size keeps the card growing past its cap.
        expect(getComputedStyle(region).minHeight).toBe('0px');
    });

    it('pins a title heading the scroll region', () => {
        const root = render('style="max-height: 320px"', WRAPPED);
        const title = root.querySelector('pendo-title');

        // Computed, so this fails if the selector stops matching in the cascade at all.
        expect(getComputedStyle(title).position).toBe('sticky');

        const declarations = declarationsFor('pendo-title:first-child');
        // Sticky without an offset never sticks.
        expect(declarations).toMatch(/top:\s*0/);
        /*
         * No stacking level, asserted from both sides. The close element is emitted before the
         * content region, so an explicit level on the title tied with it and won the tree-order
         * tie-break — measured, a 16x16px overlap with the dismiss control no longer hit-testable.
         * Only a progress row keeps the two apart, and `hideStepProgress` removes that, so the menus
         * this cap exists for are the shape that hits it.
         *
         * Not asserted by mounting a close button: that second child shape makes nwsapi mis-evaluate
         * a later `:has()` in this file, and jsdom cannot hit-test anyway.
         */
        expect(declarations).not.toMatch(/z-index/);
        expect(getComputedStyle(title).zIndex).not.toBe('1');
        expect(declarationsFor('\npendo-close-button {')).toMatch(/z-index:\s*1/);
        // Margin becomes padding: a margin is transparent, so scrolled text would show through the
        // gap under the title instead of passing behind it.
        expect(declarations).toMatch(/margin-bottom:\s*0/);
        expect(declarations).toMatch(/padding-bottom:\s*var\(/);
    });

    /**
     * A themed card is painted by a literal `background` in the theme stylesheet, which never sets
     * `--pendo-bg` — so reading that token would paint the default colour behind the title on every
     * themed guide. Inheriting chains region -> card and lands on whichever one painted.
     */
    it('paints the pinned title from the card rather than the background token', () => {
        // The shorthand, not `background-color`: a gradient card leaves `background-color`
        // transparent, so inheriting only the colour inherits nothing and the body shows through.
        expect(declarationsFor('pendo-title:first-child')).toMatch(/background:\s*inherit/);
        // The chain only works if the region carries the card's paint inwards first.
        expect(declarationsFor('> pendo-guide-content,')).toMatch(/background:\s*inherit/);
    });

    /** Uncapped, nothing scrolls, so nothing should be pinned either. */
    it('leaves a title alone when the guide is uncapped', () => {
        const root = render('', WRAPPED);

        expect(getComputedStyle(root.querySelector('pendo-title')).position).not.toBe('sticky');
    });

    /**
     * Only the content region shrinks. Padding, step progress and footer do not, so a cap they alone
     * exceed — the panel permits 96px of vertical padding against a 200px floor — leaves them past
     * the card's edge. Under `hidden` that clipped them out of reach: a hidden box scrolls under
     * script but offers the reader no scrollbar, wheel or touch. `auto` keeps them reachable.
     */
    it('lets the reader scroll to chrome the cap cannot fit', () => {
        const root = render('style="max-height: 200px; padding-block: 96px"', WRAPPED);

        expect(getComputedStyle(root).overflowY).toBe('auto');
    });

    it('scrolls the whole card when a capped guide has no content region', () => {
        const root = render('style="max-height: 320px"', BARE);

        // Block, not flex: flex would stop adjacent margins collapsing and change the card's height.
        expect(getComputedStyle(root).display).toBe('block');
        expect(getComputedStyle(root).overflowY).toBe('auto');
    });

    it('leaves an uncapped guide as a plain block', () => {
        expect(getComputedStyle(render('', WRAPPED)).display).toBe('block');
        expect(getComputedStyle(render('', BARE)).display).toBe('block');
        // Not `toBe('visible')`: jsdom reports '' for a property no rule declares, rather than the
        // initial value. What matters is that nothing turned the region into a scroller.
        expect(
            getComputedStyle(render('', WRAPPED).querySelector('pendo-guide-content')).overflowY
        ).not.toBe('auto');
    });

    it("scrolls a slideout's content region rather than the card", () => {
        const root = render('class="pendo-guide--slideout"', WRAPPED);

        expect(getComputedStyle(root).display).toBe('flex');
        // Same value a slideout already carried, so the region below is what actually scrolls: the
        // card only does so when its own chrome exceeds the 80vh cap.
        expect(getComputedStyle(root).overflowY).toBe('auto');
        expect(getComputedStyle(root.querySelector('pendo-guide-content')).overflowY).toBe('auto');
    });

    /**
     * Without the exclusion these selectors out-specify `.pendo-guide--banner` — (0,1,2) against its
     * (0,1,0) — and flip its `flex-direction: row` to `column`.
     *
     * `not.toBe` rather than an equality: jsdom reports '' for a property no rule declares.
     */
    it('leaves a capped banner laid out as a row', () => {
        const root = render('class="pendo-guide--banner" style="max-height: 200px"', WRAPPED);

        expect(getComputedStyle(root).flexDirection).toBe('row');
        expect(getComputedStyle(root).overflowY).not.toBe('auto');
    });

    /**
     * The caret is `.pendo-guide--tooltip::before`, positioned outside the card. Any overflow value
     * other than `visible` makes the card a clipping container in *both* axes — `overflow-x: visible`
     * computes to `auto` once `overflow-y` is not visible — which clips the caret away. Measured in a
     * browser: a card with a cap computes `overflow-x: auto` and renders no caret at all.
     */
    /**
     * Excluding a layout from the scrolling rules does not stop `max-height` applying to it —
     * measured, a capped tooltip kept its cap, kept `overflow: visible`, and painted 282px of body
     * text outside the card. The cap is neutralised so the guidance that it does nothing holds.
     */
    it('neutralises a cap on the layouts it excludes', () => {
        for (const layout of ['pendo-guide--tooltip', 'pendo-guide--banner']) {
            const root = render(`class="${layout}" style="max-height: 140px"`, WRAPPED);

            expect(getComputedStyle(root).maxHeight).toBe('none');
        }
    });

    it('leaves a capped tooltip uncapped rather than clipping its caret', () => {
        for (const inner of [WRAPPED, BARE]) {
            const root = render(
                'class="pendo-guide--tooltip pendo-guide--tooltip-top" style="max-height: 200px"',
                inner
            );

            expect(getComputedStyle(root).display).toBe('block');
            expect(getComputedStyle(root).overflowY).not.toBe('auto');
            expect(getComputedStyle(root).overflowY).not.toBe('hidden');
        }
    });

    /**
     * A slideout keeps its own `overflow-y: auto`, so it still scrolls where `:has()` is unsupported
     * and neither branch above matches.
     */
    it('leaves a slideout without a content region scrolling as a whole', () => {
        const root = render('class="pendo-guide--slideout"', BARE);

        expect(getComputedStyle(root).display).toBe('block');
        expect(getComputedStyle(root).overflowY).toBe('auto');
    });
});
