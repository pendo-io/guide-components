/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerGuideComponents } from '../src/register.js';

registerGuideComponents();

/** Read from this file's location; see `host-unpaintable.test.js` for why not `new URL(...)`. */
const defaults = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../src/styles/defaults.css'),
    'utf8'
);

/** Mount `html` in a guide and return the first element matching `selector`. */
function mount(html, selector) {
    document.body.innerHTML = `<pendo-guide>${html}</pendo-guide>`;
    return document.querySelector(selector);
}

/** Collect every `pendo-response` detail dispatched while `fn` runs. */
function collectResponses(fn) {
    const responses = [];
    const listener = (e) => responses.push(e.detail);
    document.addEventListener('pendo-response', listener);
    try {
        fn();
    } finally {
        document.removeEventListener('pendo-response', listener);
    }
    return responses;
}

/** What an arrow key does to a radio group: move the check, then report the change. */
function arrowTo(input) {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

function npsScore(nps, score) {
    return nps.querySelector(`.pendo-nps__score[data-value="${score}"]`);
}

describe('pendo-nps', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    describe('rendering', () => {
        it('draws the 0-10 scale as one radio group, categorised the way NPS scores are', () => {
            const nps = mount('<pendo-nps poll-id="p1" question="How likely?"></pendo-nps>', 'pendo-nps');
            const radios = [...nps.querySelectorAll('input[type="radio"]')];

            expect(radios.map((r) => r.value)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
            expect(new Set(radios.map((r) => r.name)).size).toBe(1);
            expect(npsScore(nps, 6).classList).toContain('pendo-nps__score--detractor');
            expect(npsScore(nps, 8).classList).toContain('pendo-nps__score--passive');
            expect(npsScore(nps, 9).classList).toContain('pendo-nps__score--promoter');
        });

        it('pre-selects a valid value attribute', () => {
            const nps = mount('<pendo-nps poll-id="p1" value="7"></pendo-nps>', 'pendo-nps');

            expect(nps.getValue()).toBe(7);
            expect(npsScore(nps, 7).querySelector('input').checked).toBe(true);
            expect(npsScore(nps, 7).classList).toContain('pendo-nps__score--selected');
        });

        it.each(['11', '-1', '3.5', 'abc', ''])('ignores a value attribute of %j', (value) => {
            const nps = mount(`<pendo-nps poll-id="p1" value="${value}"></pendo-nps>`, 'pendo-nps');

            expect(nps.getValue()).toBeNull();
            expect(nps.querySelector('input:checked')).toBeNull();
        });

        it('renders attribute values as text, never as markup', () => {
            const nps = mount('<pendo-nps></pendo-nps>', 'pendo-nps');
            const hostile = '"><img src=x onerror="alert(1)">';
            nps.setAttribute('poll-id', hostile);
            nps.setAttribute('question', hostile);
            nps.setAttribute('low-label', hostile);
            nps.setAttribute('high-label', hostile);
            nps.connectedCallback();

            expect(nps.querySelector('img')).toBeNull();
            expect(nps.querySelector('[onerror]')).toBeNull();
            expect(nps.querySelector('legend').textContent).toBe(hostile);
            expect(nps.querySelector('.pendo-nps__label--low').textContent).toBe(hostile);
        });
    });

    describe('accessibility', () => {
        it('names the group by its question', () => {
            const nps = mount('<pendo-nps poll-id="p1" question="How likely?"></pendo-nps>', 'pendo-nps');
            const group = nps.querySelector('[role="radiogroup"]');

            expect(document.getElementById(group.getAttribute('aria-labelledby')).textContent).toBe('How likely?');
        });

        it('does not point the group at a label that does not exist', () => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');

            expect(nps.querySelector('[role="radiogroup"]').hasAttribute('aria-labelledby')).toBe(false);
        });

        it('describes the ends of the scale with their labels', () => {
            const nps = mount('<pendo-nps poll-id="p1" low-label="Never" high-label="Always"></pendo-nps>', 'pendo-nps');
            const describedBy = (score) => {
                const id = npsScore(nps, score).querySelector('input').getAttribute('aria-describedby');
                return id && document.getElementById(id).textContent;
            };

            expect(describedBy(0)).toBe('Never');
            expect(describedBy(10)).toBe('Always');
            expect(describedBy(5)).toBeNull();
        });
    });

    describe('responses', () => {
        it('reports one NPSRating response per click on a score', () => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');

            const responses = collectResponses(() => npsScore(nps, 9).click());

            expect(responses).toEqual([{ pollId: 'p1', value: 9, type: 'NPSRating' }]);
            expect(nps.getValue()).toBe(9);
        });

        it('reports one response per click on the radio itself', () => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');

            const responses = collectResponses(() => npsScore(nps, 3).querySelector('input').click());

            expect(responses).toEqual([{ pollId: 'p1', value: 3, type: 'NPSRating' }]);
        });

        it('reports one response per keyboard move', () => {
            const nps = mount('<pendo-nps poll-id="p1" value="4"></pendo-nps>', 'pendo-nps');

            const responses = collectResponses(() => arrowTo(npsScore(nps, 5).querySelector('input')));

            expect(responses).toEqual([{ pollId: 'p1', value: 5, type: 'NPSRating' }]);
            expect(npsScore(nps, 4).classList).not.toContain('pendo-nps__score--selected');
            expect(npsScore(nps, 5).classList).toContain('pendo-nps__score--selected');
        });

        it('does not report re-clicking the selected score', () => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');
            npsScore(nps, 9).click();

            expect(collectResponses(() => npsScore(nps, 9).click())).toEqual([]);
        });

        it('has no value until a score is picked', () => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');

            expect(nps.getValue()).toBeNull();
        });

        it('selects and reports a score set programmatically', () => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');

            const responses = collectResponses(() => nps.setValue(10));

            expect(responses).toEqual([{ pollId: 'p1', value: 10, type: 'NPSRating' }]);
            expect(npsScore(nps, 10).querySelector('input').checked).toBe(true);
        });

        it.each([11, -1, 2.5, '7', null])('ignores setValue(%j)', (value) => {
            const nps = mount('<pendo-nps poll-id="p1"></pendo-nps>', 'pendo-nps');

            expect(collectResponses(() => nps.setValue(value))).toEqual([]);
            expect(nps.getValue()).toBeNull();
        });
    });
});

describe('scale polls', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it.each([
        ['pendo-number-scale', '.pendo-number-scale__item'],
        ['pendo-emoji-scale', '.pendo-emoji-scale__option'],
        ['pendo-star-rating', '.pendo-star-rating__star']
    ])('%s reports one response per click on an option', (tag, option) => {
        const poll = mount(`<${tag} poll-id="p1"></${tag}>`, tag);

        const responses = collectResponses(() => poll.querySelectorAll(option)[2].click());

        expect(responses).toEqual([{ pollId: 'p1', value: 3, type: 'NumberScale' }]);
    });
});

describe('pendo-open-text', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    function submitText(openText, text) {
        const textarea = openText.querySelector('textarea');
        textarea.value = text;
        textarea.dispatchEvent(new Event('input'));
        return collectResponses(() => {
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
        });
    }

    it('reports a FreeForm response by default', () => {
        const openText = mount('<pendo-open-text poll-id="p2"></pendo-open-text>', 'pendo-open-text');

        expect(submitText(openText, 'great')).toEqual([{ pollId: 'p2', value: 'great', type: 'FreeForm' }]);
    });

    it('reports an NPSReason response when it is the reason for a score', () => {
        const openText = mount('<pendo-open-text poll-id="p2" nps-reason></pendo-open-text>', 'pendo-open-text');

        expect(submitText(openText, 'great')).toEqual([{ pollId: 'p2', value: 'great', type: 'NPSReason' }]);
    });
});

describe('NPS focus ring', () => {
    const css = defaults.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    const body = (selector) => {
        const start = css.indexOf(selector + ' {');
        expect(start, `no rule for \`${selector}\``).toBeGreaterThan(-1);
        return css.slice(start + selector.length + 2, css.indexOf('}', start));
    };
    const px = (decls, property) => parseFloat(new RegExp(`${property}: (?:solid )?([\\d.]+)px`).exec(decls)?.[1] ?? '0');

    it('fits between scores instead of running into the neighbours', () => {
        const ring = body('.pendo-nps__score:focus-within');
        const extent = px(ring, 'outline') + px(ring, 'outline-offset');

        expect(extent).toBeGreaterThan(0);
        expect(extent).toBeLessThanOrEqual(px(body('.pendo-nps__scale'), 'gap'));
    });

    it('is dropped for a pointer pick, which focuses the hidden radio', () => {
        expect(body('.pendo-nps__score:focus-within:not(:has(input:focus-visible))')).toContain('outline: none');
    });
});

/**
 * jsdom applies no stylesheet, so this asserts the rule's selector against the live DOM instead:
 * what it matches is exactly what the rule hides.
 */
describe('reveal on answer', () => {
    const rule = defaults
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .match(/([^{}]*data-pendo-reveal="answered"[^{}]*)\{\s*display:\s*none;\s*\}/);
    const hidden = () => [...document.querySelectorAll(rule[1].trim())].map((el) => el.localName);

    const SURVEY = `
        <pendo-nps poll-id="p1"></pendo-nps>
        <pendo-open-text poll-id="p2" nps-reason data-pendo-reveal="answered"></pendo-open-text>
        <pendo-button action="submit-poll" data-pendo-reveal="answered">Submit</pendo-button>
        <pendo-button action="dismiss">Not now</pendo-button>
    `;

    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('is a single display: none rule', () => {
        expect(rule).not.toBeNull();
    });

    it('hides the marked elements until a score is picked', () => {
        const nps = mount(SURVEY, 'pendo-nps');

        expect(hidden()).toEqual(['pendo-open-text', 'pendo-button']);

        npsScore(nps, 8).click();

        expect(hidden()).toEqual([]);
    });

    it('shows them straight away when the score is pre-selected', () => {
        mount(SURVEY.replace('poll-id="p1"', 'poll-id="p1" value="9"'), 'pendo-nps');

        expect(hidden()).toEqual([]);
    });

    it('waits on any poll, not only an NPS score', () => {
        const rating = mount(`
            <pendo-star-rating poll-id="p1"></pendo-star-rating>
            <pendo-open-text poll-id="p2" data-pendo-reveal="answered"></pendo-open-text>
        `, 'pendo-star-rating');

        expect(hidden()).toEqual(['pendo-open-text']);

        rating.querySelectorAll('.pendo-star-rating__star')[3].click();

        expect(hidden()).toEqual([]);
    });

    it('counts text in an open-text poll as an answer, and clearing it as none', () => {
        const openText = mount(`
            <pendo-open-text poll-id="p1"></pendo-open-text>
            <pendo-button action="submit-poll" data-pendo-reveal="answered">Submit</pendo-button>
        `, 'pendo-open-text');
        const type = (text) => {
            const textarea = openText.querySelector('textarea');
            textarea.value = text;
            textarea.dispatchEvent(new Event('input'));
        };

        expect(hidden()).toEqual(['pendo-button']);
        type('great');
        expect(hidden()).toEqual([]);
        type('   ');
        expect(hidden()).toEqual(['pendo-button']);
    });

    it('does not count a revealed poll as the answer it waits for', () => {
        mount(`
            <pendo-nps poll-id="p1"></pendo-nps>
            <pendo-number-scale poll-id="p2" value="3" data-pendo-reveal="answered"></pendo-number-scale>
        `, 'pendo-nps');

        expect(hidden()).toEqual(['pendo-number-scale']);
    });

    it('never hides anything when there is no other poll to wait for', () => {
        mount(`
            <pendo-open-text poll-id="p2" data-pendo-reveal="answered"></pendo-open-text>
            <pendo-button action="submit-poll" data-pendo-reveal="answered">Submit</pendo-button>
        `, 'pendo-open-text');

        expect(hidden()).toEqual([]);
    });

    it('leaves an nps-reason without the attribute visible: the marker is data only', () => {
        mount(SURVEY.replaceAll(' data-pendo-reveal="answered"', ''), 'pendo-nps');

        expect(hidden()).toEqual([]);
    });
});
