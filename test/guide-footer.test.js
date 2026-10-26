import { describe, it, expect } from 'vitest';
import { ruleBody } from './css-source.js';

describe('pendo-guide-footer', () => {
    it('centres its buttons so a theme host paint hugs each one rather than the tallest in the row', () => {
        expect(ruleBody('pendo-guide-footer')).toContain('align-items: center;');
    });

    it('lets its buttons shrink and wrap their label instead of overflowing the card', () => {
        expect(ruleBody('pendo-guide-footer > pendo-button')).toContain('min-width: 0;');
        const inner = ruleBody('pendo-guide-footer button[type="button"]');
        expect(inner).toContain('max-width: 100%;');
        expect(inner).toContain('white-space: normal;');
    });
});
