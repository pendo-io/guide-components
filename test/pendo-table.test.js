/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as library from '../src/index.js';
import { PendoTable, PendoTableRow, PendoTableCell } from '../src/elements/pendo-table.js';
import { registerGuideComponents } from '../src/register.js';
import { flatDefaults, ruleBody } from './css-source.js';

registerGuideComponents();

const CELL_IN = (count) => `pendo-table:has(> pendo-table-row > pendo-table-cell:nth-of-type(${count}))`;
const GRID_COUNTS = [2, 3, 4, 5, 6, 7, 8];

/** Everything inside the `@supports` block that lays the table out as a grid. */
const GRID_BLOCK = (() => {
    const start = flatDefaults.indexOf('@supports (grid-template-columns: subgrid) and selector(:has(*)) {');
    expect(start, 'no grid block').toBeGreaterThan(-1);
    let depth = 0;
    for (let i = flatDefaults.indexOf('{', start); i < flatDefaults.length; i++) {
        if (flatDefaults[i] === '{') depth++;
        else if (flatDefaults[i] === '}' && --depth === 0) return flatDefaults.slice(start, i + 1);
    }
    throw new Error('unclosed grid block');
})();

/** The declarations of the rule for `selector` inside the grid block. */
function gridRuleBody(selector) {
    const start = GRID_BLOCK.indexOf(`${selector} {`);
    expect(start, `no grid rule for \`${selector}\``).toBeGreaterThan(-1);
    return GRID_BLOCK.slice(start + selector.length + 2, GRID_BLOCK.indexOf('}', start));
}

/** Mount a table with one row per entry of `cellsPerRow`, the first a header row. */
function mountTable(cellsPerRow) {
    const rows = cellsPerRow.map((count, r) => {
        const cells = Array.from({ length: count }, (_, c) => `<pendo-table-cell>R${r}C${c}</pendo-table-cell>`);
        return `<pendo-table-row${r === 0 ? ' header' : ''}>${cells.join('')}</pendo-table-row>`;
    });
    document.body.innerHTML = `<pendo-guide><pendo-guide-content><pendo-table>${rows.join('')}</pendo-table></pendo-guide-content></pendo-guide>`;
    return document.querySelector('pendo-table');
}

/**
 * The column count whose rule sets this table's grid. The count rules share a specificity, so
 * the one latest in the sheet wins where several match; read the sheet's order rather than assume
 * it, or swapping two rules would go unnoticed.
 */
function winningColumnCount(table) {
    const position = (count) => GRID_BLOCK.indexOf(`${CELL_IN(count)} {`);
    const matching = GRID_COUNTS.filter((count) => table.matches(CELL_IN(count)));
    return matching.length ? matching.reduce((a, b) => (position(a) > position(b) ? a : b)) : 1;
}

const roles = (table) => [...table.querySelectorAll('pendo-table-row')].map((row) => [row.getAttribute('role'), ...[...row.children].map((cell) => cell.getAttribute('role'))]);

describe('pendo-table', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    describe('elements', () => {
        it('registers all three tags', () => {
            expect(customElements.get('pendo-table')).toBe(PendoTable);
            expect(customElements.get('pendo-table-row')).toBe(PendoTableRow);
            expect(customElements.get('pendo-table-cell')).toBe(PendoTableCell);
        });

        it('exports all three classes from the package entry', () => {
            expect(library.PendoTable).toBe(PendoTable);
            expect(library.PendoTableRow).toBe(PendoTableRow);
            expect(library.PendoTableCell).toBe(PendoTableCell);
        });

        // The client gates content by removing elements before the guide connects, and an editor
        // reads the authored markup back, so connecting may add the roles and nothing else.
        it('leaves the authored markup as it was apart from the roles, connected and reconnected', () => {
            const authored =
                '<pendo-table data-pendo-requires-any="g1">' +
                '<pendo-table-row header=""><pendo-table-cell>Plan</pendo-table-cell><pendo-table-cell>Seats</pendo-table-cell></pendo-table-row>' +
                '<pendo-table-row data-pendo-requires-guide="g2"><pendo-table-cell>Growth <strong>new</strong></pendo-table-cell><pendo-table-cell>500</pendo-table-cell></pendo-table-row>' +
                '</pendo-table>';
            document.body.innerHTML = `<pendo-guide><pendo-guide-content>${authored}</pendo-guide-content></pendo-guide>`;
            const table = document.querySelector('pendo-table');
            const withoutRoles = () => table.outerHTML.replace(/ role="[a-z]+"/g, '');

            expect(table).toBeInstanceOf(PendoTable);
            expect(table.firstElementChild).toBeInstanceOf(PendoTableRow);
            expect(table.firstElementChild.firstElementChild).toBeInstanceOf(PendoTableCell);
            expect(withoutRoles()).toBe(authored);

            document.querySelector('pendo-guide').appendChild(table);
            expect(withoutRoles()).toBe(authored);
        });

        it('keeps a link in a cell working, as it does in text', () => {
            const table = mountTable([1]);
            const cell = table.querySelector('pendo-table-cell');
            cell.innerHTML = 'See <pendo-link href="https://example.com/plans">plans</pendo-link>';

            const anchor = cell.querySelector('pendo-link > a.pendo-link');
            expect(anchor).not.toBeNull();
            expect(anchor.getAttribute('href')).toBe('https://example.com/plans');
        });
    });

    describe('roles', () => {
        // A screen reader reads a table from these: without them the cells are a run of text.
        it('reads as a table, a header row of column headers, and rows of cells', () => {
            const table = mountTable([2, 2]);

            expect(table.getAttribute('role')).toBe('table');
            expect(roles(table)).toEqual([
                ['row', 'columnheader', 'columnheader'],
                ['row', 'cell', 'cell']
            ]);
        });

        it('has no column headers without a header row', () => {
            const table = mountTable([2, 2]);
            table.firstElementChild.removeAttribute('header');

            expect(roles(table)).toEqual([
                ['row', 'cell', 'cell'],
                ['row', 'cell', 'cell']
            ]);
        });

        // An editor turns `header` on and off on the live row.
        it('follows the header attribute when it changes on a live row', () => {
            const table = mountTable([2, 2]);
            const body = table.lastElementChild;

            body.setAttribute('header', '');
            expect(roles(table)[1]).toEqual(['row', 'columnheader', 'columnheader']);

            body.removeAttribute('header');
            expect(roles(table)[1]).toEqual(['row', 'cell', 'cell']);
        });

        it('gives a cell added to a row, or moved between rows, the role of its new row', () => {
            const table = mountTable([1, 1]);
            const [header, body] = table.children;

            header.insertAdjacentHTML('beforeend', '<pendo-table-cell>New</pendo-table-cell>');
            expect(header.lastElementChild.getAttribute('role')).toBe('columnheader');

            body.appendChild(header.lastElementChild);
            expect(body.lastElementChild.getAttribute('role')).toBe('cell');
        });

        // ARIA allows a cell only in a row and a row only in a table; out of place, a role would
        // announce a table part with no table around it.
        it('gives a cell outside a row, and a row outside a table, no role', () => {
            document.body.innerHTML =
                '<pendo-guide><pendo-table-cell>Loose</pendo-table-cell><pendo-table-row><pendo-table-cell>In a row</pendo-table-cell></pendo-table-row></pendo-guide>';

            expect(document.querySelector('pendo-guide > pendo-table-cell').hasAttribute('role')).toBe(false);
            expect(document.querySelector('pendo-table-row').hasAttribute('role')).toBe(false);
            expect(document.querySelector('pendo-table-row > pendo-table-cell').getAttribute('role')).toBe('cell');
        });

        it('drops the role it gave a cell moved out of its row, and keeps one an author wrote', () => {
            const table = mountTable([2]);
            const [moved, kept] = table.querySelectorAll('pendo-table-cell');
            kept.setAttribute('role', 'note');
            const guide = document.querySelector('pendo-guide');

            guide.appendChild(moved);
            guide.appendChild(kept);

            expect(moved.hasAttribute('role')).toBe(false);
            expect(kept.getAttribute('role')).toBe('note');
        });
    });

    // A table that scrolls must be reachable by keyboard: Safari does not focus a scroll container,
    // and the guide's focus trap lists only controls and `[tabindex]`.
    describe('keyboard scrolling', () => {
        let observers;
        let original;

        beforeEach(() => {
            observers = [];
            original = globalThis.ResizeObserver;
            globalThis.ResizeObserver = class {
                constructor(callback) {
                    this.callback = callback;
                    this.observed = [];
                    this.disconnected = false;
                    observers.push(this);
                }
                observe(target) {
                    this.observed.push(target);
                }
                disconnect() {
                    this.disconnected = true;
                }
            };
        });

        afterEach(() => {
            globalThis.ResizeObserver = original;
        });

        /** Give `table` a scroll width and a box width, then let its observer report. */
        function resize(table, scrollWidth, clientWidth) {
            Object.defineProperty(table, 'scrollWidth', { configurable: true, value: scrollWidth });
            Object.defineProperty(table, 'clientWidth', { configurable: true, value: clientWidth });
            observers.at(-1).callback([]);
        }

        it('watches the table and its rows, whose width grows with the columns', () => {
            const table = mountTable([2, 2]);

            expect(observers).toHaveLength(1);
            expect(observers[0].observed).toEqual([table, ...table.children]);
        });

        it('is focusable only while it overflows', () => {
            const table = mountTable([2, 2]);

            resize(table, 300, 200);
            expect(table.getAttribute('tabindex')).toBe('0');

            resize(table, 200, 200);
            expect(table.hasAttribute('tabindex')).toBe(false);
        });

        it('leaves a tabindex an author wrote', () => {
            const table = mountTable([2, 2]);
            table.setAttribute('tabindex', '-1');

            resize(table, 300, 200);
            resize(table, 200, 200);

            expect(table.getAttribute('tabindex')).toBe('-1');
        });

        it('stops watching once it leaves the page', () => {
            const table = mountTable([2]);
            table.remove();

            expect(observers[0].disconnected).toBe(true);
        });

        it('draws an inset focus ring, which a scrolling region around it cannot clip', () => {
            const body = ruleBody('pendo-table:focus-visible');

            expect(body).toContain('outline: 2px solid var(--pendo-focus);');
            expect(body).toContain('outline-offset: -2px;');
        });
    });

    describe('layout', () => {
        // A table wider than the guide scrolls inside it rather than widening the guide.
        it('is a scroll container held to the guide, which a theme rule cannot turn back into a box', () => {
            const body = ruleBody('pendo-table');

            expect(body).toContain('display: block !important;');
            expect(body).toContain('overflow-x: auto;');
            expect(body).toContain('max-width: 100%;');
        });

        // A column is at least as wide as its longest word, so a table whose words do not fit
        // scrolls. An inherited `anywhere` would let every column shrink to one letter instead.
        it('never breaks a word, whatever the table sits in', () => {
            expect(ruleBody('pendo-table')).toContain('overflow-wrap: normal;');
        });

        it('lines the columns up with table display where the grid is not available', () => {
            expect(ruleBody('pendo-table-row')).toContain('display: table-row !important;');
            expect(ruleBody('pendo-table-cell')).toContain('display: table-cell !important;');
        });

        it('lays the table out as a grid of subgrid rows where it can, so the table fills the guide', () => {
            expect(gridRuleBody('pendo-table')).toContain('display: grid !important;');
            expect(gridRuleBody('pendo-table')).toContain('grid-template-columns: auto;');

            const row = gridRuleBody('pendo-table-row');
            expect(row).toContain('display: grid !important;');
            expect(row).toContain('grid-column: 1 / -1;');
            expect(row).toContain('grid-template-columns: subgrid;');
        });

        it.each(GRID_COUNTS)('gives a table with %i cells in a row that many auto columns', (count) => {
            expect(gridRuleBody(CELL_IN(count))).toContain(`grid-template-columns: repeat(${count}, auto);`);
        });

        it.each(GRID_COUNTS.map((count) => [count, count]))('picks %i columns for %i cells a row', (count) => {
            expect(winningColumnCount(mountTable([count, count]))).toBe(count);
        });

        it('picks one column for one cell a row', () => {
            expect(winningColumnCount(mountTable([1, 1]))).toBe(1);
        });

        // The count is the most cells any row has, so a short row leaves its last columns empty
        // instead of a long row spilling out of the grid.
        it('counts the longest row', () => {
            expect(winningColumnCount(mountTable([2, 4, 3]))).toBe(4);
        });

        it('counts only cells, not another child', () => {
            const table = mountTable([2, 2]);
            table.lastElementChild.insertAdjacentHTML('beforeend', '<pendo-text>Stray</pendo-text>');

            expect(winningColumnCount(table)).toBe(2);
        });

        // A gated cell is removed before the guide connects.
        it('counts the cells that are there', () => {
            const table = mountTable([3, 3]);
            table.querySelectorAll('pendo-table-row').forEach((row) => row.lastElementChild.remove());

            expect(winningColumnCount(table)).toBe(2);
        });

        // A row takes only the table's columns, so a cell past the last one would wrap onto a second
        // line inside its row.
        it('falls back to table display past 8 columns', () => {
            const table = mountTable([9, 9]);
            const row = table.firstElementChild;
            const cell = row.firstElementChild;
            const MANY = CELL_IN(9);

            expect(table.matches(MANY)).toBe(true);
            expect(gridRuleBody(MANY)).toContain('display: block !important;');
            expect(row.matches(`${MANY} > pendo-table-row`)).toBe(true);
            expect(gridRuleBody(`${MANY} > pendo-table-row`)).toContain('display: table-row !important;');
            expect(cell.matches(`${MANY} > pendo-table-row > pendo-table-cell`)).toBe(true);
            expect(gridRuleBody(`${MANY} > pendo-table-row > pendo-table-cell`)).toContain('display: table-cell !important;');

            expect(mountTable([8, 8]).matches(MANY)).toBe(false);
        });

        // A banner is a row whose content region is never narrower than its content, so a table
        // there would widen the bar instead of scrolling. A tooltip sizes to its content and still
        // grows to fit a table, so only the banner's region gives way.
        it('takes only the room a banner has left', () => {
            const selector = '.pendo-guide--banner > pendo-guide-content:has(pendo-table)';
            document.body.innerHTML =
                '<pendo-guide class="pendo-guide pendo-guide--banner"><pendo-guide-content><pendo-table><pendo-table-row><pendo-table-cell>A</pendo-table-cell></pendo-table-row></pendo-table></pendo-guide-content></pendo-guide>';

            expect(document.querySelector('pendo-guide-content').matches(selector)).toBe(true);
            expect(ruleBody(selector)).toContain('flex: 1 1 0;');
            expect(ruleBody(selector)).toContain('min-width: 0;');
        });

        it('hides a part marked hidden, which its own display would otherwise outrank', () => {
            mountTable([1, 1]);
            const selector = ':is(pendo-table, pendo-table-row, pendo-table-cell)[hidden]';
            const row = document.querySelector('pendo-table-row');
            row.setAttribute('hidden', '');

            expect(ruleBody(selector)).toContain('display: none !important;');
            expect(row.matches(selector)).toBe(true);
        });

        it('keeps its own bottom margin outside a content region, and drops it as the last block', () => {
            expect(ruleBody('pendo-table')).toContain('margin: 0 0 var(--pendo-spacing) 0;');
            expect(ruleBody('pendo-table:last-child')).toContain('margin-bottom: 0;');
        });
    });

    describe('look', () => {
        it('draws cells from their tokens', () => {
            const body = ruleBody('pendo-table-cell');

            expect(body).toContain('padding: var(--pendo-table-cell-padding, var(--pendo-spacing-xs) var(--pendo-spacing-sm));');
            expect(body).toContain('border-bottom: var(--pendo-table-border, 1px solid var(--pendo-border));');
            expect(ruleBody('pendo-table')).toContain('font-size: var(--pendo-table-font-size, 0.875rem);');
        });

        it('draws a line between rows, not under the last one', () => {
            const table = mountTable([1, 1, 1]);
            const selector = 'pendo-table-row:last-of-type > pendo-table-cell';

            expect(ruleBody(selector)).toContain('border-bottom: none;');
            expect([...table.querySelectorAll('pendo-table-cell')].map((cell) => cell.matches(selector))).toEqual([false, false, true]);
        });

        it('draws only a header row\'s cells as headings, from the header tokens', () => {
            const table = mountTable([1, 1]);
            const selector = 'pendo-table-row[header] > pendo-table-cell';
            const body = ruleBody(selector);

            expect([...table.querySelectorAll('pendo-table-cell')].map((cell) => cell.matches(selector))).toEqual([true, false]);
            expect(body).toContain('background: var(--pendo-table-header-bg, rgba(0, 0, 0, 0.04));');
            expect(body).toContain('color: var(--pendo-table-header-text, var(--pendo-text));');
            expect(body).toContain('font-weight: var(--pendo-table-header-font-weight, 600);');
        });
    });

    it('reads no table token without a fallback', () => {
        const bare = [...flatDefaults.matchAll(/var\(\s*(--pendo-table-[a-z0-9-]+)\s*\)/g)].map((m) => m[1]);
        expect(bare).toEqual([]);
    });
});
