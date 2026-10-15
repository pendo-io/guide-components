import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

/** Read from this file's location; see `host-unpaintable.test.js` for why not `new URL(...)`. */
export const defaults = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/defaults.css'),
    'utf8'
);

/** The stylesheet without comments, on one line, so a rule reads the same however it is wrapped. */
export const flatDefaults = defaults.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

/** The declarations of the first rule whose selector is exactly `selector`. */
export function ruleBody(selector) {
    const start = flatDefaults.indexOf(`${selector} {`);
    expect(start, `no rule for \`${selector}\``).toBeGreaterThan(-1);
    return flatDefaults.slice(start + selector.length + 2, flatDefaults.indexOf('}', start));
}
