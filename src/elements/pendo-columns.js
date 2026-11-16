import { PendoBaseElement } from '../base-element.js';

/**
 * <pendo-columns> - Lays content out side by side, in 2 to 4 columns.
 *
 * Children are <pendo-column> elements. Each column holds the usual content elements (title,
 * text, image, button, action row) and spaces them like the guide's content region does.
 *
 * The columns share one row while each can be at least `--pendo-column-min-width` wide. When the
 * guide is too narrow for that, every column moves to its own row, one under the other, in source
 * order. It never wraps part of the way (two columns over one), and it reads the width of the
 * guide, not of the window, so the same markup stacks in a tooltip and stays side by side in a
 * wider lightbox.
 *
 * Layout and look are CSS only, from theme tokens (`--pendo-columns-gap`, `--pendo-column-*`); see
 * `defaults.css`. There is no free-form styling attribute.
 *
 * Example:
 *   <pendo-columns>
 *     <pendo-column variant="card">
 *       <pendo-title>Growth</pendo-title>
 *       <pendo-text>For small teams.</pendo-text>
 *       <pendo-button action="link:https://example.com/growth">Choose Growth</pendo-button>
 *     </pendo-column>
 *     <pendo-column variant="card">
 *       <pendo-title>Enterprise</pendo-title>
 *       <pendo-text>For the whole company.</pendo-text>
 *       <pendo-button action="link:https://example.com/enterprise">Choose Enterprise</pendo-button>
 *     </pendo-column>
 *   </pendo-columns>
 *
 * Neither element changes the DOM. The client removes a gated element (`data-pendo-requires-*`)
 * before the guide connects, and an editor reads the authored markup back, so the columns, their
 * attributes and their children must stay exactly as authored. A removed column needs no handling:
 * the layout counts the columns that are there.
 */
export class PendoColumns extends PendoBaseElement {}

/**
 * <pendo-column> - One column of a <pendo-columns>.
 *
 * Attributes:
 *   variant - "card" draws the column as a card: a border, a background, rounded corners and
 *     padding, all from the `--pendo-column-card-*` tokens. Without it the column has no paint of
 *     its own.
 */
export class PendoColumn extends PendoBaseElement {}
