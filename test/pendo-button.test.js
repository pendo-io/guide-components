/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PendoButton } from '../src/elements/pendo-button.js';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

describe('PendoButton', () => {
    describe('parseAction', () => {
        let button;

        beforeEach(() => {
            button = new PendoButton();
        });

        it('should parse simple string action', () => {
            const result = button.parseAction('dismiss');
            expect(result).toEqual([{ action: 'dismiss' }]);
        });

        it('should parse next-step action', () => {
            const result = button.parseAction('next-step');
            expect(result).toEqual([{ action: 'next-step' }]);
        });

        it('should parse link action with URL', () => {
            const result = button.parseAction('link:https://example.com');
            expect(result).toEqual([{
                action: 'link',
                url: 'https://example.com',
                target: '_blank'
            }]);
        });

        it('should parse launch-guide action with guideId', () => {
            const result = button.parseAction('launch-guide:guide123');
            expect(result).toEqual([{
                action: 'launch-guide',
                guideId: 'guide123'
            }]);
        });

        it('should parse go-to-step action with stepId', () => {
            const result = button.parseAction('go-to-step:step456');
            expect(result).toEqual([{
                action: 'go-to-step',
                stepId: 'step456'
            }]);
        });

        it('should parse snooze action with duration', () => {
            const result = button.parseAction('snooze:86400000');
            expect(result).toEqual([{
                action: 'snooze',
                duration: 86400000
            }]);
        });

        it('should parse unknown colon-delimited action as generic', () => {
            const result = button.parseAction('custom-action:param-value');
            expect(result).toEqual([{
                action: 'custom-action',
                param: 'param-value'
            }]);
        });

        it('should parse single JSON object action', () => {
            const result = button.parseAction('{"action":"go-to-step","stepId":"abc123"}');
            expect(result).toEqual([{
                action: 'go-to-step',
                stepId: 'abc123'
            }]);
        });

        it('should parse JSON array of actions', () => {
            const result = button.parseAction('[{"action":"submit-poll"},{"action":"dismiss"}]');
            expect(result).toEqual([
                { action: 'submit-poll' },
                { action: 'dismiss' }
            ]);
        });

        it('should parse complex JSON array with params', () => {
            const result = button.parseAction('[{"action":"submit-poll"},{"action":"go-to-step","stepId":"step789"}]');
            expect(result).toEqual([
                { action: 'submit-poll' },
                { action: 'go-to-step', stepId: 'step789' }
            ]);
        });

        it('should return empty array for empty string', () => {
            const result = button.parseAction('');
            expect(result).toEqual([]);
        });

        it('should return empty array for null', () => {
            const result = button.parseAction(null);
            expect(result).toEqual([]);
        });

        it('should return empty array for invalid JSON array', () => {
            const result = button.parseAction('[invalid json');
            expect(result).toEqual([]);
        });

        it('should return empty array for invalid JSON object', () => {
            const result = button.parseAction('{invalid json');
            expect(result).toEqual([]);
        });

        it('should trim whitespace from input', () => {
            const result = button.parseAction('  dismiss  ');
            expect(result).toEqual([{ action: 'dismiss' }]);
        });
    });
});
