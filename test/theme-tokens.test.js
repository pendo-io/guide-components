import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { themeTokens } from '../src/styles/theme-tokens.js';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));

// Comments are stripped before anything else: the section comments in `defaults.css` name these
// tokens in prose, and the exhaustiveness check below would otherwise accept a token that is only
// ever *described* by the sheet rather than read by it.
const css = readFileSync(fileURLToPath(new URL('../src/styles/defaults.css', import.meta.url)), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
const flat = css.replace(/\s+/g, ' ');

function ruleBody(selector) {
    const start = flat.indexOf(selector + ' {');
    expect(start, `no rule for \`${selector}\``).toBeGreaterThan(-1);
    return flat.slice(start + selector.length + 2, flat.indexOf('}', start)).trim();
}

/** The one declaration of `property` in `body`, split at top-level `;` so `var(a, b)` stays whole. */
function declaration(body, property) {
    let depth = 0;
    let from = 0;
    const parts = [];
    for (let i = 0; i < body.length; i++) {
        if (body[i] === '(') depth++;
        else if (body[i] === ')') depth--;
        else if (body[i] === ';' && depth === 0) {
            parts.push(body.slice(from, i));
            from = i + 1;
        }
    }
    parts.push(body.slice(from));
    const matches = parts.map((p) => p.trim()).filter((p) => p.startsWith(property + ':'));
    expect(matches, `expected exactly one \`${property}\` declaration`).toHaveLength(1);
    return matches[0];
}

/**
 * `theme-tokens.js` is published as `dist/theme-tokens.json` for consumers to check their own
 * variable spellings against, which is only worth anything if the artifact and the stylesheet agree.
 * Nothing else would catch a drift: an unrecognised custom property is never read, so a token the
 * manifest advertises but the sheet does not resolve renders as the component default and reaches a
 * consumer as a control that accepts a value and changes nothing.
 */
describe('theme token contract', () => {
    it.each(themeTokens.filter((t) => t.property === null))(
        '$name is defined on its selector with the documented default',
        ({ name, default: value, selector }) => {
            expect(ruleBody(selector)).toContain(`${name}: ${value};`);
        }
    );

    it.each(themeTokens.filter((t) => t.property !== null))(
        '$name is read by $selector\'s $property with the documented fallback',
        ({ name, default: value, selector, property }) => {
            expect(declaration(ruleBody(selector), property)).toContain(`var(${name}, ${value})`);
        }
    );

    it('describes every --pendo- property the stylesheet uses, and no others', () => {
        const inSheet = new Set(css.match(/--pendo-[a-z0-9-]+/g));
        const inManifest = new Set(themeTokens.map((t) => t.name));
        expect([...inSheet].filter((n) => !inManifest.has(n)), 'used by the sheet, absent from the manifest').toEqual([]);
        expect([...inManifest].filter((n) => !inSheet.has(n)), 'in the manifest, unused by the sheet').toEqual([]);
    });

    it('ships the manifest as a resolvable subpath', () => {
        expect(pkg.exports['./theme-tokens']).toBe('./dist/theme-tokens.json');
        expect(pkg.files).toContain('dist');
    });
});

/**
 * These are the tokens Novus used to inject into every stored theme's CSS because the component
 * exposed no way to set them. They are load-bearing downstream — a properties panel writes them and
 * a theme prompt emits them — so dropping or renaming one is a breaking change to the component's
 * API rather than a stylesheet tidy-up. Restating the surface here is the point: it makes that a
 * failing test instead of a control that silently stops working.
 */
describe('button and link theming API', () => {
    it('exposes exactly the documented surface', () => {
        const surface = themeTokens
            .map((t) => t.name)
            .filter((n) => n.startsWith('--pendo-button-') || n.startsWith('--pendo-link-'))
            .sort();
        expect(surface).toEqual([
            '--pendo-button-bg',
            '--pendo-button-border',
            '--pendo-button-font-size',
            '--pendo-button-font-weight',
            '--pendo-button-padding-x',
            '--pendo-button-padding-y',
            '--pendo-button-radius',
            '--pendo-button-secondary-bg',
            '--pendo-button-secondary-border',
            '--pendo-button-secondary-text',
            '--pendo-button-shadow',
            '--pendo-link-color'
        ]);
    });

    /**
     * A fallback on every read is what keeps an unset theme rendering exactly as it did before the
     * token existed. Read without one, an unset token makes the whole declaration invalid at
     * computed-value time and the property falls back to `unset` — which for `padding` on a button
     * is a visible collapse, not a subtle shift.
     */
    it('never reads a button or link token without a fallback', () => {
        const bare = [...css.matchAll(/var\(\s*(--pendo-(?:button|link)-[a-z0-9-]+)\s*\)/g)].map((m) => m[1]);
        expect(bare).toEqual([]);
    });

    it('leaves the hover fills reading the guide-wide hover token', () => {
        // `--pendo-button-bg` deliberately does not reach `:hover`: a theme that sets a resting fill
        // keeps the vendored hover feedback rather than losing it to its own flat colour.
        expect(declaration(ruleBody('.pendo-button--primary:hover'), 'background')).toBe(
            'background: var(--pendo-primary-hover)'
        );
    });
});
