/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

describe('PendoCloseButton', () => {
    let host;

    beforeEach(() => {
        document.body.innerHTML = '';
        host = document.createElement('pendo-close-button');
        document.body.appendChild(host);
    });

    it('labels the button for assistive tech and hides the icon from it', () => {
        const button = host.querySelector('button.pendo-close-button');
        expect(button.getAttribute('aria-label')).toBe('Close');
        expect(button.type).toBe('button');

        const icon = button.querySelector('svg.pendo-close-button__icon');
        expect(icon.getAttribute('aria-hidden')).toBe('true');
        // Focusable defaults to true for SVG in IE/legacy Edge and some AT; the button is the stop.
        expect(icon.getAttribute('focusable')).toBe('false');
    });

    /**
     * Regression (INT-421): this was the "×" character, whose ink box sits below the centre of its
     * em box — so it rendered visibly low inside the round hover target. An icon centres on its own.
     */
    it('draws an icon rather than a multiplication-sign character', () => {
        expect(host.textContent.trim()).toBe('');
        expect(host.innerHTML).not.toContain('×');
        expect(host.querySelectorAll('svg path')).toHaveLength(1);
    });

    it('emits dismiss when clicked', () => {
        const onAction = vi.fn();
        host.addEventListener('pendo-action', onAction);

        host.querySelector('button').click();

        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction.mock.calls[0][0].detail.action).toBe('dismiss');
        // Composed and bubbling, so a guide inside a shadow root still hears it.
        expect(onAction.mock.calls[0][0].bubbles).toBe(true);
        expect(onAction.mock.calls[0][0].composed).toBe(true);
    });
});
