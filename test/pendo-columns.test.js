/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as library from '../src/index.js';
import { PendoColumns, PendoColumn } from '../src/elements/pendo-columns.js';
import { registerGuideComponents } from '../src/register.js';
import { flatDefaults, ruleBody } from './css-source.js';

registerGuideComponents();

const MIN = 'var(--pendo-column-min-width, 120px)';
const GAP = 'var(--pendo-columns-gap, var(--pendo-spacing-sm))';

/** The `flex-basis` that keeps `count` columns in one row until each would be narrower than the minimum. */
const basisFor = (count) =>
    `flex-basis: calc((${count} * ${MIN} + ${count === 2 ? '' : `${count - 1} * `}${GAP} - 100%) * 999);`;

/** The rule that sets the basis for `count` columns. */
const BASIS_RULE = {
    2: 'pendo-columns > pendo-column',
    3: 'pendo-columns:has(> pendo-column:nth-of-type(3)) > pendo-column',
    4: 'pendo-columns:has(> pendo-column:nth-of-type(4)) > pendo-column'
};

/** Mount `count` columns in a guide's content region and return the `pendo-columns`. */
function mountColumns(count, columnAttrs = '') {
    const columns = Array.from({ length: count }, (_, i) => `<pendo-column ${columnAttrs}><pendo-text>Column ${i + 1}</pendo-text></pendo-column>`);
    document.body.innerHTML = `<pendo-guide><pendo-guide-content><pendo-columns>${columns.join('')}</pendo-columns></pendo-guide-content></pendo-guide>`;
    return document.querySelector('pendo-columns');
}

/**
 * The count whose rule sets these columns' basis. The 3 and 4 rules share a specificity above the
 * base rule's, so between them the one later in the sheet wins; read the sheet's order rather than
 * assume it, or swapping the two rules would go unnoticed.
 */
function winningBasisRule(columns) {
    const column = columns.querySelector('pendo-column');
    const position = (count) => flatDefaults.indexOf(`${BASIS_RULE[count]} {`);
    const overrides = [3, 4].filter((count) => column.matches(BASIS_RULE[count]));
    return overrides.length ? overrides.reduce((a, b) => (position(a) > position(b) ? a : b)) : 2;
}

describe('pendo-columns', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    describe('elements', () => {
        it('registers both tags', () => {
            expect(customElements.get('pendo-columns')).toBe(PendoColumns);
            expect(customElements.get('pendo-column')).toBe(PendoColumn);
        });

        it('exports both classes from the package entry', () => {
            expect(library.PendoColumns).toBe(PendoColumns);
            expect(library.PendoColumn).toBe(PendoColumn);
        });

        // The client gates content by removing elements before the guide connects, and an editor
        // reads the authored markup back, so connecting must not add, move or drop anything.
        // The columns hold plain text here so that only these two elements could change anything.
        it('leaves the authored markup exactly as it was, connected and reconnected', () => {
            const authored =
                '<pendo-columns data-pendo-requires-any="g1">' +
                '<pendo-column variant="card" data-pendo-requires-guide="g2">Growth</pendo-column>' +
                '<pendo-column>Enterprise</pendo-column>' +
                '</pendo-columns>';
            document.body.innerHTML = `<pendo-guide><pendo-guide-content>${authored}</pendo-guide-content></pendo-guide>`;
            const columns = document.querySelector('pendo-columns');

            expect(columns).toBeInstanceOf(PendoColumns);
            expect(columns.firstElementChild).toBeInstanceOf(PendoColumn);
            expect(columns.outerHTML).toBe(authored);

            document.querySelector('pendo-guide').appendChild(columns);
            expect(columns.outerHTML).toBe(authored);
        });
    });

    describe('layout', () => {
        // `!important` because Novus scopes theme rules unlayered, so a theme's own `display` or
        // `gap` on the tag would otherwise win and the columns would stop being a wrapping row.
        it('is a wrapping row spaced by its gap token, which a theme rule cannot replace', () => {
            const body = ruleBody('pendo-columns');

            expect(body).toContain('display: flex !important;');
            expect(body).toContain('flex-wrap: wrap !important;');
            expect(body).toContain(`gap: ${GAP} !important;`);
        });

        it('lays each column out as a content region, spaced by the content gap', () => {
            const body = ruleBody('pendo-column');

            expect(body).toContain('display: flex !important;');
            expect(body).toContain('flex-direction: column !important;');
            expect(body).toContain('gap: var(--pendo-content-gap, var(--pendo-spacing-xs)) !important;');
            // Without these a long word widens its column past an equal share of the row, or runs
            // out of it.
            expect(body).toContain('min-width: 0;');
            expect(body).toContain('overflow-wrap: break-word;');
        });

        // A column can be narrower than a button's label, which does not wrap anywhere else.
        it('wraps a button label to the width of its column', () => {
            const body = ruleBody('pendo-column > pendo-button > .pendo-button');

            expect(body).toContain('max-width: 100%;');
            expect(body).toContain('white-space: normal;');
            // The control sizes to its longest word; only `anywhere` lets that word break.
            expect(body).toContain('overflow-wrap: anywhere;');
        });

        it('leaves an action row in a column its own layout', () => {
            document.body.innerHTML =
                '<pendo-guide><pendo-columns><pendo-column><pendo-action-row action="dismiss">Row</pendo-action-row><pendo-button action="dismiss">Go</pendo-button></pendo-column></pendo-columns></pendo-guide>';
            const selector = 'pendo-column > pendo-button > .pendo-button';

            expect(document.querySelector('.pendo-action-row').matches(selector)).toBe(false);
            expect(document.querySelector('button.pendo-button').matches(selector)).toBe(true);
        });

        it('grows the columns into equal shares of the row', () => {
            const body = ruleBody(BASIS_RULE[2]);

            expect(body).toContain('flex-grow: 1;');
            expect(body).toContain('flex-shrink: 1;');
        });

        // Each count needs N minimum widths and the N - 1 gaps between them. Below that width the
        // basis is wider than the row, so every column takes a row of its own; above it, it is
        // negative and clamps to 0.
        it.each([2, 3, 4])('stacks %i columns below the width that gives each one the minimum', (count) => {
            expect(ruleBody(BASIS_RULE[count])).toContain(basisFor(count));
        });

        it.each([
            [2, 2],
            [3, 3],
            [4, 4]
        ])('picks the %i-column threshold for %i columns', (count, expected) => {
            expect(winningBasisRule(mountColumns(count))).toBe(expected);
        });

        // A gated column is removed before the guide connects; the others then share the row as
        // that many columns, not as the count that was authored.
        it('counts the columns that are there, so removing one changes the threshold', () => {
            const columns = mountColumns(3);
            columns.lastElementChild.remove();

            expect(winningBasisRule(columns)).toBe(2);
        });

        it('counts only columns, not another child', () => {
            const columns = mountColumns(2);
            columns.insertAdjacentHTML('afterbegin', '<pendo-text>Stray</pendo-text>');

            expect(winningBasisRule(columns)).toBe(2);
        });

        it('keeps its own bottom margin outside a content region, and drops it as the last block', () => {
            expect(ruleBody('pendo-columns')).toContain('margin: 0 0 var(--pendo-spacing) 0;');
            expect(ruleBody('pendo-columns:last-child')).toContain('margin-bottom: 0;');
        });
    });

    describe('card variant', () => {
        it('paints only a column marked as a card', () => {
            const columns = mountColumns(2);
            columns.firstElementChild.setAttribute('variant', 'card');
            const [card, plain] = columns.children;

            expect(card.matches('pendo-column[variant="card"]')).toBe(true);
            expect(plain.matches('pendo-column[variant="card"]')).toBe(false);
        });

        // A plain column draws nothing of its own, so a row of them reads as text in columns.
        it('gives a plain column no paint of its own', () => {
            const body = ruleBody('pendo-column');

            for (const property of ['background', 'border', 'padding', 'box-shadow']) {
                expect(body).not.toContain(`${property}:`);
            }
        });

        it('draws the card from its tokens, falling back to the guide\'s own border, surface and radius', () => {
            const body = ruleBody('pendo-column[variant="card"]');

            expect(body).toContain('padding: var(--pendo-column-card-padding, var(--pendo-spacing-sm));');
            expect(body).toContain('background: var(--pendo-column-card-bg, var(--pendo-bg));');
            expect(body).toContain('border: var(--pendo-column-card-border, 1px solid var(--pendo-border));');
            expect(body).toContain('border-radius: var(--pendo-column-card-radius, var(--pendo-radius));');
            expect(body).toContain('box-shadow: var(--pendo-column-card-shadow, none);');
        });
    });

    it('reads no column token without a fallback', () => {
        const bare = [...flatDefaults.matchAll(/var\(\s*(--pendo-columns?-[a-z0-9-]+)\s*\)/g)].map((m) => m[1]);
        expect(bare).toEqual([]);
    });
});
