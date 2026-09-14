/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

/** Build a `<pendo-open-text>` from an attribute map and attach it to the document. */
function mount(attrs = {}) {
    const el = document.createElement('pendo-open-text');
    for (const [name, value] of Object.entries(attrs)) {
        if (value === true) {
            el.setAttribute(name, '');
        } else if (value !== false && value != null) {
            el.setAttribute(name, String(value));
        }
    }
    document.body.appendChild(el);
    return el;
}

describe('PendoOpenText', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('renders a labeled textarea with placeholder, rows, and required wired up', () => {
        const host = mount({ question: 'Feedback?', placeholder: 'Type here', rows: 5, required: true });

        const label = host.querySelector('label.pendo-poll__question');
        const textarea = host.querySelector('textarea.pendo-open-text__input');

        expect(label.textContent).toBe('Feedback?');
        expect(textarea.placeholder).toBe('Type here');
        expect(textarea.rows).toBe(5);
        expect(textarea.required).toBe(true);
        expect(textarea.getAttribute('aria-labelledby')).toBe(label.id);
        expect(label.getAttribute('for')).toBe(textarea.id);
    });

    it('omits the question label and aria-labelledby when no question is given', () => {
        const host = mount({ placeholder: 'Type here' });

        expect(host.querySelector('label')).toBeNull();
        expect(host.querySelector('textarea').hasAttribute('aria-labelledby')).toBe(false);
    });

    it('renders the character counter only when maxlength is set', () => {
        const withMax = mount({ maxlength: 500 });
        const counter = withMax.querySelector('.pendo-open-text__counter');
        expect(counter.textContent).toBe('0/500');
        expect(withMax.querySelector('textarea').getAttribute('maxlength')).toBe('500');

        document.body.innerHTML = '';
        const withoutMax = mount({});
        expect(withoutMax.querySelector('.pendo-open-text__counter')).toBeNull();
    });

    /**
     * Regression (NOVUS-2153 / APP-167372): a placeholder (or question) containing a literal `"`
     * must not be able to break out of the textarea's attribute position and inject new
     * attributes. Property/attribute assignment is used instead of `innerHTML` templating
     * specifically so this can't happen — verify no injected attribute survives.
     */
    it('cannot inject attributes via a quote-bearing placeholder', () => {
        const host = mount({
            question: 'Q',
            placeholder: '" autofocus onfocus="window.__pwned = true"',
        });

        const textarea = host.querySelector('textarea');
        expect(textarea.placeholder).toBe('" autofocus onfocus="window.__pwned = true"');
        expect(textarea.hasAttribute('autofocus')).toBe(false);
        expect(textarea.hasAttribute('onfocus')).toBe(false);
        expect(textarea.getAttributeNames().sort()).toEqual(
            ['aria-labelledby', 'class', 'id', 'placeholder', 'rows'].sort()
        );
    });

    it('cannot inject attributes via a quote-bearing question', () => {
        const host = mount({ question: '"><img src=x onerror="window.__pwned = true">' });

        const label = host.querySelector('label');
        expect(label.textContent).toBe('"><img src=x onerror="window.__pwned = true">');
        expect(host.querySelector('img')).toBeNull();
    });

    it('tracks input and updates the counter', () => {
        const host = mount({ maxlength: 10 });
        const textarea = host.querySelector('textarea');
        const count = host.querySelector('.pendo-open-text__count');

        textarea.value = 'hello';
        textarea.dispatchEvent(new Event('input'));

        expect(host.getValue()).toBe('hello');
        expect(count.textContent).toBe('5');
    });

    it('emits pendo-response on submit with the current value', () => {
        const host = mount({ 'poll-id': 'p1' });
        const onResponse = vi.fn();
        host.addEventListener('pendo-response', onResponse);

        host.setValue('my feedback');
        const result = host.submit();

        expect(result).toBe(true);
        expect(host.isSubmitted()).toBe(true);
        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0].detail).toEqual({
            pollId: 'p1',
            value: 'my feedback',
            type: 'FreeForm',
        });
    });

    it('refuses to submit an empty value when required', () => {
        const host = mount({ required: true });
        const onResponse = vi.fn();
        host.addEventListener('pendo-response', onResponse);

        expect(host.submit()).toBe(false);
        expect(host.isSubmitted()).toBe(false);
        expect(onResponse).not.toHaveBeenCalled();
    });

    it('submits on blur when submit-on-blur is set', () => {
        const host = mount({ 'submit-on-blur': true });
        const textarea = host.querySelector('textarea');

        textarea.value = 'typed';
        textarea.dispatchEvent(new Event('input'));
        textarea.dispatchEvent(new Event('blur'));

        expect(host.isSubmitted()).toBe(true);
    });

    it('submits on ctrl/cmd+Enter', () => {
        const host = mount({});
        const textarea = host.querySelector('textarea');

        textarea.value = 'typed';
        textarea.dispatchEvent(new Event('input'));
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));

        expect(host.isSubmitted()).toBe(true);
    });
});
