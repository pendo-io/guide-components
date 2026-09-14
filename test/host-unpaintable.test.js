/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

/**
 * Resolved from this file, the way the other CSS-reading tests here do.
 *
 * `fileURLToPath(new URL(...))` — their spelling — throws under this jsdom environment: jsdom swaps
 * the global `URL` for its own, and Node rejects the result. Passing `import.meta.url` as a string
 * avoids that. A `?raw` import is no good either; vitest's CSS handling swallows it and hands back
 * nothing, which reads as a sheet declaring none of this.
 */
const defaults = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/defaults.css'),
    'utf8'
);

/**
 * A legacy theme's host paint, in the shape Novus stores it.
 *
 * Scoped under the theme id and unlayered, which is what `formatThemeCSS` emits and the reason the
 * reset needs `!important` rather than a longer selector: this is (0,1,1) against the component's
 * (0,0,1), and it is adopted *after* the component sheet, so it would win a tie on source order too.
 */
const LEGACY_THEME_CSS = `
pendo-guide[data-pendo-theme-id="t1"] pendo-button {
    background: #0b5;
    border: 2px solid #093;
    padding: 10px 20px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    margin-inline: 4px;
}
`;

/** Mount `html` under a themed guide root with both sheets applied, in the order the live page uses. */
function render(html) {
    document.head.innerHTML = `<style>${defaults}</style><style>${LEGACY_THEME_CSS}</style>`;
    document.body.innerHTML = `<pendo-guide data-pendo-theme-id="t1">${html}</pendo-guide>`;
    return getComputedStyle(document.querySelector('pendo-button'));
}

describe('the pendo-button host is unpaintable', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    it("drops a legacy theme's host paint on a default (primary) button", () => {
        const style = render('<pendo-button>Go</pendo-button>');

        expect(style.padding).toBe('0px');
        // `background: none` computes to a transparent colour, so this is the theme's green gone.
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('drops it on a secondary button too', () => {
        const style = render('<pendo-button variant="secondary">Go</pendo-button>');

        expect(style.padding).toBe('0px');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    /**
     * The reset is the doubled *box* only. A host shadow hugs the control once the host carries no
     * padding, and there is no outline token to translate an author's intent into, so killing either
     * would trade a cosmetic oddity for a silently dead style.
     */
    it('leaves the host its box-shadow, which is not the doubled box', () => {
        // jsdom hands back the authored string, spacing and all.
        expect(render('<pendo-button>Go</pendo-button>').boxShadow).toContain('0 2px 6px');
    });

    /**
     * The carve-out, and the reason the reset is not blanket. Nothing in this sheet paints a link
     * variant — it matches no `.pendo-button--*` rule and its inner node keeps the transparent
     * background `all: unset` gives it — so the host is the only paint surface a link button has, and
     * Novus's properties panel writes a plain `background-color` there on purpose. A blanket reset
     * would leave that control accepting a colour and changing nothing.
     */
    it('leaves a link button its host paint, because nothing else paints it', () => {
        expect(render('<pendo-button variant="link">Go</pendo-button>').backgroundColor).toBe(
            'rgb(0, 187, 85)'
        );
    });

    /**
     * And the same for a variant this sheet has never heard of, which is why the reset lists the
     * painted variants positively instead of excluding `link`. An unrecognised value paints from no
     * `.pendo-button--*` rule either, and a consumer only *warns* about one rather than rejecting it,
     * so it reaches the runtime and its host is the only paint surface it has.
     */
    it('leaves an unrecognised variant its host paint too', () => {
        expect(render('<pendo-button variant="tertiary">Go</pendo-button>').backgroundColor).toBe(
            'rgb(0, 187, 85)'
        );
    });

    it("still zeroes a link button's padding, which the inner control always declares", () => {
        expect(render('<pendo-button variant="link">Go</pendo-button>').padding).toBe('0px');
    });

    /**
     * `getAttribute("variant") || "primary"` is how the element resolves its variant, so an empty
     * attribute is a primary button and its host has to be reset like one.
     */
    it('treats an empty variant as primary, the way the element does', () => {
        const style = render('<pendo-button variant="">Go</pendo-button>');

        expect(style.padding).toBe('0px');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    /**
     * Margin is the host's own job — `pendo-button + pendo-button` in this sheet and the properties
     * panel's Margin control both write it there, so the reset must leave it alone.
     */
    it('leaves the host its margin', () => {
        expect(render('<pendo-button>Go</pendo-button>').marginInline).toBe('4px');
    });

    /**
     * `border` is asserted against the stylesheet rather than a computed value: jsdom resolves the
     * `border` shorthand from the *losing* rule whatever the cascade says, even against an
     * `!important` longhand, so a computed-style assertion here would fail on a correct sheet. The
     * other properties above are all resolved faithfully, so only this one is checked as text.
     */
    it('declares the border reset alongside the rest', () => {
        const rule = defaults
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .match(/pendo-button\[variant="secondary"\]\s*\{([^}]*)\}/);

        expect(rule, 'no host reset rule listing `[variant="secondary"]` in defaults.css').not.toBeNull();
        expect(rule[1]).toContain('border: 0 !important;');
    });
});
