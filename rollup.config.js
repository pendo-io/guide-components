import { readFileSync } from 'node:fs';

import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';

import { themeTokens } from './src/styles/theme-tokens.js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const production = !process.env.ROLLUP_WATCH;

/**
 * Publishes the theming contract as data alongside the stylesheet that implements it.
 *
 * Consumers restate these variable names (a properties panel writing them, a prompt emitting them),
 * and a one-sided rename is silent — an unrecognised custom property is simply never read. Shipping
 * the list lets them assert their spellings against the component instead of guessing.
 *
 * Emitted as an asset rather than exported from `src/index.js` on purpose: no guide needs the
 * manifest at runtime, and bundling it would put it on every page that renders one.
 */
function themeTokensManifest() {
    return {
        name: 'theme-tokens-manifest',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'theme-tokens.json',
                source: JSON.stringify({ version: pkg.version, tokens: themeTokens }, null, 2) + '\n'
            });
        }
    };
}

export default [
    // ESM build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/pendo-guide-components.esm.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: [
            css({ output: 'pendo-guide-components.css' }),
            themeTokensManifest(),
            production && terser()
        ]
    },
    // IIFE build for CDN/script tag usage
    {
        input: 'src/index.js',
        output: {
            file: 'dist/pendo-guide-components.js',
            format: 'iife',
            name: 'PendoGuideComponents',
            sourcemap: true
        },
        plugins: [
            css({ output: false }), // CSS already output by ESM build
            production && terser()
        ]
    }
];
