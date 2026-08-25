import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/styles/defaults.css', import.meta.url)), 'utf8');

function ruleBody(selector) {
    const start = css.indexOf(selector + ' {');
    expect(start, `${selector} not found`).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
}

/**
 * The caret is a rotated square that takes the card's border via `border: inherit`, so the card's
 * border continues around the caret instead of drawing a line straight across its base. These are
 * geometry guards: nothing in this repo renders CSS, so a wrong constant or direction here would
 * otherwise only surface as a misdrawn caret in a customer's guide.
 */
describe('tooltip caret', () => {
    it('takes its border from the card rather than a colour of its own', () => {
        const base = ruleBody('.pendo-guide--tooltip::before');
        // `inherit` is the whole trick: width, style and colour all come from the card, so the
        // caret is outlined exactly when — and how — the card is.
        expect(base).toContain('border: inherit;');
        expect(base).not.toMatch(/border(-[a-z]+)*-color:\s*(?!inherit)/);
        // content-box, so width/height describe the caret without its border and the inherited
        // border mitres an outline around that. Under border-box the border would eat into the
        // caret instead of growing it, and the placement maths below would not hold.
        expect(base).toContain('box-sizing: content-box;');
    });

    /**
     * rotate(45deg) maps the square's local top and left edges to the caret's two *outer* sides and
     * its right and bottom edges to the two inner ones. Only the outer pair may carry a border: the
     * inner pair is what opens the card's own border up where the caret meets it.
     *
     * The anchor pins the content diamond's far vertex --pendo-caret-size inside the card and the
     * 20.710678% (= 100 * (1/sqrt(2) - 1/2)) walks the box back out, which is what puts the two
     * near vertices exactly on the card's padding-box edge. Anchor and offset have to agree in axis
     * and sign or the border's mitre hangs past the inside of the card's border as a pair of nubs.
     */
    it.each([
        ['bottom', ['border-right-width: 0;', 'border-bottom-width: 0;'], 'bottom: calc(100% - var(--pendo-caret-size));', 'translate(-50%, -20.710678%)'],
        ['top', ['border-top-width: 0;', 'border-left-width: 0;'], 'top: calc(100% - var(--pendo-caret-size));', 'translate(-50%, 20.710678%)'],
        ['left', ['border-bottom-width: 0;', 'border-left-width: 0;'], 'left: calc(100% - var(--pendo-caret-size));', 'translate(20.710678%, -50%)'],
        ['right', ['border-top-width: 0;', 'border-right-width: 0;'], 'right: calc(100% - var(--pendo-caret-size));', 'translate(-20.710678%, -50%)']
    ])('joins the card cleanly for a %s-positioned card', (dir, zeroed, anchor, offset) => {
        const body = ruleBody(`.pendo-guide--tooltip-${dir}::before`);
        expect(body).toContain(anchor);
        expect(body).toContain(`transform: ${offset} rotate(45deg);`);
        for (const decl of zeroed) {
            expect(body).toContain(decl);
        }
        expect(body.match(/border-[a-z]+-width: 0;/g)).toHaveLength(2);
    });
});
