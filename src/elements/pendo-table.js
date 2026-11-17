import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-table> - A table of data: rows of cells, with an optional header row.
 *
 * Children are <pendo-table-row> elements, and each row's children are <pendo-table-cell>
 * elements. A cell holds text, with inline formatting and an optional <pendo-link>. A row with the
 * `header` attribute holds the column headings.
 *
 * Example:
 *   <pendo-table>
 *     <pendo-table-row header>
 *       <pendo-table-cell>Plan</pendo-table-cell>
 *       <pendo-table-cell>Seats</pendo-table-cell>
 *     </pendo-table-row>
 *     <pendo-table-row>
 *       <pendo-table-cell>Growth</pendo-table-cell>
 *       <pendo-table-cell>500</pendo-table-cell>
 *     </pendo-table-row>
 *   </pendo-table>
 *
 * The columns line up across the rows, and each takes the width its content needs. A table too
 * wide for the guide scrolls sideways inside the guide; it never makes the guide wider. Layout and
 * look are CSS only, from theme tokens (`--pendo-table-*`); see `defaults.css`.
 *
 * The elements are not rebuilt into a `<table>`. The client removes a gated element
 * (`data-pendo-requires-*`) before the guide connects, and an editor reads the authored markup
 * back, so the rows, the cells and their attributes stay where they were authored. A screen reader
 * still reads a table: each element takes the ARIA role of the part it plays, as `pendo-title`
 * takes `heading`. The roles, and a `tabindex` on a table that scrolls, are the only attributes
 * these elements add, and Novus strips both when it saves a guide.
 */
export class PendoTable extends PendoBaseElement {
    connectedCallback() {
        this.setAttribute('role', 'table');
        this.watchOverflow();
    }

    disconnectedCallback() {
        if (this._overflowObserver) this._overflowObserver.disconnect();
        this._overflowObserver = null;
    }

    /**
     * A table that scrolls has to be reachable by keyboard, or a keyboard user cannot scroll it:
     * Safari does not focus a scroll container on its own, and the guide's focus trap lists only
     * controls and `[tabindex]`. So while the table overflows it takes `tabindex="0"`, and it drops
     * it again once it fits, so a table that fits is not a stop on the way through the guide.
     *
     * An authored `tabindex` is the author's to keep: only one this element added is removed.
     */
    watchOverflow() {
        if (this._overflowObserver || typeof ResizeObserver === 'undefined') return;
        this._overflowObserver = new ResizeObserver(() => this.syncScrollFocus());
        this._overflowObserver.observe(this);
        for (const row of this.children) this._overflowObserver.observe(row);
    }

    syncScrollFocus() {
        const overflows = this.scrollWidth > this.clientWidth;
        if (overflows && !this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0');
            this._addedTabindex = true;
        } else if (!overflows && this._addedTabindex) {
            this.removeAttribute('tabindex');
            this._addedTabindex = false;
        }
    }
}

/**
 * <pendo-table-row> - One row of a <pendo-table>.
 *
 * Attributes:
 *   header - The row holds the column headings: its cells read as column headers and are drawn as
 *     headings, from the `--pendo-table-header-*` tokens.
 */
export class PendoTableRow extends PendoBaseElement {
    static get observedAttributes() {
        return ['header'];
    }

    connectedCallback() {
        syncPartRole(this, 'pendo-table', 'row', ['row']);
    }

    /**
     * An authoring surface turns `header` on and off on the live row, and its cells were given
     * their roles when they connected, so they need telling. Before the cells connect there is
     * nothing to update: each reads the row as it stands.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        for (const cell of this.children) {
            if (cell instanceof PendoTableCell) cell.syncRole();
        }
    }
}

/**
 * <pendo-table-cell> - One cell of a <pendo-table-row>.
 *
 * Holds text, with inline formatting and an optional <pendo-link>. A cell in a `header` row is a
 * column header; any other cell is a data cell.
 */
export class PendoTableCell extends PendoBaseElement {
    connectedCallback() {
        this.syncRole();
    }

    syncRole() {
        const row = this.parentElement;
        const role = row && row.hasAttribute('header') ? 'columnheader' : 'cell';
        syncPartRole(this, 'pendo-table-row', role, ['cell', 'columnheader']);
    }
}

/**
 * Give a row or a cell its role only where ARIA allows it: a `row` in a `table`, a `cell` or
 * `columnheader` in a `row`. Out of place (a cell straight in the guide, which the Novus grammar
 * rejects) a role would announce a table part with no table, so the element takes none, and loses
 * one it was given in its old place. A role an author wrote is left alone.
 */
function syncPartRole(element, parentTag, role, ownRoles) {
    const parent = element.parentElement;
    if (parent && parent.localName === parentTag) {
        element.setAttribute('role', role);
    } else if (ownRoles.includes(element.getAttribute('role'))) {
        element.removeAttribute('role');
    }
}
