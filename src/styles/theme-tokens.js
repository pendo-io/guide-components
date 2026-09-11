/**
 * The custom properties a theme may set, published as data.
 *
 * This is the machine-readable half of the theming contract in `defaults.css`. Consumers — the
 * Novus theme formatter and prompt, the properties panel that writes these variables, the preview
 * emitter — all name these variables, and a one-sided rename produces no error anywhere: an
 * unrecognised custom property is simply never read, so the control keeps accepting values and the
 * button keeps rendering the component default. The failure is invisible by construction.
 *
 * So the list ships: `dist/theme-tokens.json` (see `rollup.config.js`), reachable as
 * `@pendo/guide-components/theme-tokens`, for consumers to assert their own spellings against.
 * `test/theme-tokens.test.js` holds this file and `defaults.css` together, so the artifact cannot
 * describe a contract the stylesheet does not implement.
 *
 * Each entry says where the sheet resolves the token:
 *
 * - `property: null` — the token is *defined* in `selector`'s body (`--name: default`). These are
 *   the guide-wide tokens; components read them without a fallback of their own.
 * - otherwise — the token is *read* inside `selector`'s `property` declaration, with `default` as
 *   its `var()` fallback. `default` is what the sheet hard-coded before the token existed, so an
 *   unset theme renders unchanged.
 *
 * `--brand-*` is deliberately absent. Those are host inputs that the defaults below consult; they
 * are not properties the component itself declares or reads directly.
 */
export const themeTokens = [
    // ---- Guide-wide tokens -------------------------------------------------
    { name: '--pendo-primary', default: 'var(--brand-primary, #E84855)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-primary-hover', default: 'var(--brand-primary-hover, #d43d4a)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-font', default: "var(--brand-font, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)", selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-radius', default: 'var(--brand-radius, 8px)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-bg', default: 'var(--brand-surface, #ffffff)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-text', default: 'var(--brand-text, #1a1a1a)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-text-muted', default: 'var(--brand-text-muted, #666666)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-border', default: 'var(--brand-border, #e0e0e0)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-focus', default: 'var(--brand-focus, #005fcc)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-shadow', default: '0 4px 24px rgba(0, 0, 0, 0.15)', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-spacing', default: '24px', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-spacing-sm', default: '12px', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-spacing-xs', default: '8px', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-progress-dot-inactive', default: 'var(--pendo-text-muted, var(--pendo-border))', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-close-button-size', default: '28px', selector: 'pendo-guide, .pendo-guide', property: null },
    { name: '--pendo-close-button-icon-size', default: 'calc(var(--pendo-close-button-size) * 0.57)', selector: 'pendo-guide, .pendo-guide', property: null },
    // Defined on the tooltip variant rather than the root: it is the tooltip's own geometry, and
    // `.pendo-guide--tooltip::before` reads it relative to that card.
    { name: '--pendo-caret-size', default: '8px', selector: '.pendo-guide--tooltip', property: null },

    // ---- Buttons -----------------------------------------------------------
    // The inner `.pendo-button` declares these properties for itself, so a theme rule on the
    // authored `pendo-button` host can only offer an inherited value and never wins. Setting the
    // token is the supported route; see the section comment in `defaults.css`.
    { name: '--pendo-button-padding-y', default: 'var(--pendo-spacing-sm)', selector: '.pendo-button', property: 'padding' },
    { name: '--pendo-button-padding-x', default: 'var(--pendo-spacing)', selector: '.pendo-button', property: 'padding' },
    { name: '--pendo-button-radius', default: 'var(--pendo-radius)', selector: '.pendo-button', property: 'border-radius' },
    { name: '--pendo-button-shadow', default: 'none', selector: '.pendo-button', property: 'box-shadow' },
    { name: '--pendo-button-font-size', default: '0.9375rem', selector: '.pendo-button', property: 'font-size' },
    { name: '--pendo-button-font-weight', default: '500', selector: '.pendo-button', property: 'font-weight' },

    { name: '--pendo-button-bg', default: 'var(--pendo-primary)', selector: '.pendo-button--primary', property: 'background' },
    { name: '--pendo-button-border', default: 'none', selector: '.pendo-button--primary', property: 'border' },
    { name: '--pendo-primary-text', default: '#ffffff', selector: '.pendo-button--primary', property: 'color' },

    { name: '--pendo-button-secondary-bg', default: 'transparent', selector: '.pendo-button--secondary', property: 'background' },
    { name: '--pendo-button-secondary-border', default: 'var(--pendo-border)', selector: '.pendo-button--secondary', property: 'border' },
    { name: '--pendo-button-secondary-text', default: 'var(--pendo-text)', selector: '.pendo-button--secondary', property: 'color' },

    // ---- Links -------------------------------------------------------------
    { name: '--pendo-link-color', default: 'var(--pendo-primary)', selector: '.pendo-link', property: 'color' }
];
