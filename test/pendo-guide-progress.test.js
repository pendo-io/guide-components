/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

function mount(attrs) {
    document.body.innerHTML = `<pendo-guide ${attrs}><pendo-text>Hi</pendo-text></pendo-guide>`;
    return document.querySelector('pendo-guide');
}

function counter(root) {
    const progress = root.querySelector('.pendo-guide__progress');
    return {
        text: progress.querySelector('.pendo-guide__progress-text').textContent,
        ariaLabel: progress.getAttribute('aria-label')
    };
}

describe('pendo-guide step counter', () => {
    it('reads "Step x of y" without a progress-label', () => {
        expect(counter(mount('step="2" total-steps="3"'))).toEqual({
            text: 'Step 2 of 3',
            ariaLabel: 'Step 2 of 3'
        });
    });

    it('fills a progress-label template for both the text and the accessible name', () => {
        const root = mount('step="2" total-steps="3" progress-label="Stap {current} van {total}"');

        expect(counter(root)).toEqual({ text: 'Stap 2 van 3', ariaLabel: 'Stap 2 van 3' });
    });

    it('fills placeholders in whatever order and as often as the template uses them', () => {
        const root = mount('step="1" total-steps="4" progress-label="{total} 단계 중 {current} 단계 ({current}/{total})"');

        expect(counter(root).text).toBe('4 단계 중 1 단계 (1/4)');
    });

    it.each([
        ['an empty template', ''],
        ['a template without {total}', 'Stap {current}'],
        ['a template without {current}', 'van {total}'],
        ['a template with neither', 'Stap']
    ])('falls back to English for %s', (_, template) => {
        const root = mount(`step="2" total-steps="3" progress-label="${template}"`);

        expect(counter(root)).toEqual({ text: 'Step 2 of 3', ariaLabel: 'Step 2 of 3' });
    });

    it('treats the template as text, never markup', () => {
        const root = mount(
            'step="1" total-steps="2" progress-label="&lt;img src=x onerror=alert(1)&gt; {current}/{total}"'
        );
        const text = root.querySelector('.pendo-guide__progress-text');

        expect(text.querySelector('img')).toBeNull();
        expect(text.textContent).toBe('<img src=x onerror=alert(1)> 1/2');
    });

    it('renders no counter for a single-step guide, label or not', () => {
        const root = mount('step="1" total-steps="1" progress-label="Stap {current} van {total}"');

        expect(root.querySelector('.pendo-guide__progress')).toBeNull();
    });

    it('keeps one dot per step alongside a translated label', () => {
        const root = mount('step="2" total-steps="3" progress-label="Stap {current} van {total}"');

        expect(root.querySelectorAll('.pendo-guide__progress-dot')).toHaveLength(3);
        expect(root.querySelectorAll('.pendo-guide__progress-dot--current')).toHaveLength(1);
    });
});
