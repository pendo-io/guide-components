/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerGuideComponents } from '../src/register.js';
import { CELEBRATIONS } from '../src/index.js';
import { ruleBody } from './css-source.js';

registerGuideComponents();

const BODY = `
    <pendo-guide-content>
        <pendo-title>You finished the tour</pendo-title>
        <pendo-text>Your reports are ready.</pendo-text>
    </pendo-guide-content>
    <pendo-guide-footer>
        <pendo-button action="dismiss">Done</pendo-button>
    </pendo-guide-footer>
`;

const FAKED = ['setTimeout', 'clearTimeout', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'];

/** One animation frame. */
const nextFrame = () => vi.advanceTimersByTime(16);

/** The colors a fake context parses, as a browser's would: hex only, reported lower-case. */
const HEX = /^#[0-9a-f]{6}$/i;

/** Every 2D context jsdom hands out in a test, so a test can read what was drawn. */
let contexts;

/** A 2D context that records what is drawn. jsdom has no canvas of its own. */
function fakeContext() {
    let fillStyle = '#000000';
    const context = {
        filled: [],
        globalAlpha: 1,
        get fillStyle() {
            return fillStyle;
        },
        set fillStyle(value) {
            if (typeof value === 'string' && HEX.test(value.trim())) fillStyle = value.trim().toLowerCase();
        },
        fillRect() {
            context.filled.push(fillStyle);
        },
        setTransform() {},
        clearRect() {},
        save() {},
        restore() {},
        translate() {},
        rotate() {},
        scale() {}
    };
    contexts.push(context);
    return context;
}

let reducedMotion;

beforeEach(() => {
    vi.useFakeTimers({ toFake: FAKED });
    contexts = [];
    reducedMotion = false;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(fakeContext);
    window.matchMedia = vi.fn((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
        media: query
    }));
});

afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete window.matchMedia;
});

let nextStep = 0;

/** A step id no other test has used: a step celebrates once per page load. */
const freshStepId = () => `step-${++nextStep}`;

/** Mount a guide the way the Pendo agent does, in a container that carries the step's id. */
function mount(attrs = 'celebrate="confetti"', stepId = freshStepId()) {
    const container = document.createElement('div');
    container.setAttribute('data-step-id', stepId);
    container.innerHTML = `<pendo-guide ${attrs}>${BODY}</pendo-guide>`;
    document.body.appendChild(container);
    return container.querySelector('pendo-guide');
}

const confettiCanvas = () => document.querySelector('canvas.pendo-confetti');

describe('pendo-guide celebrate', () => {
    it('exports confetti as the only celebration', () => {
        expect(CELEBRATIONS).toEqual(['confetti']);
        expect(Object.isFrozen(CELEBRATIONS)).toBe(true);
    });

    it('plays confetti over the page when the step shows', () => {
        mount();

        const canvas = confettiCanvas();
        expect(canvas).not.toBeNull();
        expect(canvas.parentNode).toBe(document.body);
        expect(canvas.getAttribute('aria-hidden')).toBe('true');

        nextFrame();
        expect(contexts[0].filled.length).toBeGreaterThan(0);
    });

    it('removes the canvas by itself when it ends', () => {
        mount();
        vi.advanceTimersByTime(2400);
        expect(confettiCanvas()).not.toBeNull();

        vi.advanceTimersByTime(200);
        expect(confettiCanvas()).toBeNull();
    });

    it('fades the pieces out over the last half second', () => {
        mount();
        vi.advanceTimersByTime(1000);
        expect(contexts[0].globalAlpha).toBe(1);

        vi.advanceTimersByTime(1250);
        expect(contexts[0].globalAlpha).toBeGreaterThan(0);
        expect(contexts[0].globalAlpha).toBeLessThan(1);
    });

    it('stops and removes the canvas when the guide goes away first', () => {
        const guide = mount();
        nextFrame();

        guide.parentNode.remove();
        expect(confettiCanvas()).toBeNull();

        const drawn = contexts[0].filled.length;
        vi.advanceTimersByTime(1000);
        expect(contexts[0].filled.length).toBe(drawn);
    });

    it('plays nothing when the visitor asks for reduced motion', () => {
        reducedMotion = true;
        mount();
        expect(confettiCanvas()).toBeNull();
        expect(contexts).toHaveLength(0);
    });

    it.each([
        ['no celebrate', ''],
        ['an unknown value', 'celebrate="fireworks"'],
        ['another case', 'celebrate="Confetti"'],
        ['an empty value', 'celebrate=""']
    ])('plays nothing for %s', (_, attrs) => {
        mount(attrs);
        expect(confettiCanvas()).toBeNull();
    });

    it('reads a value with spaces around it', () => {
        mount('celebrate=" confetti "');
        expect(confettiCanvas()).not.toBeNull();
    });

    it('plays nothing, and throws nothing, where the browser gives no 2D canvas', () => {
        HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
        expect(() => mount()).not.toThrow();
        expect(confettiCanvas()).toBeNull();
    });

    describe('once per step per page load', () => {
        it('does not play again when the renderer draws the same step again', () => {
            const stepId = freshStepId();
            mount('celebrate="confetti"', stepId).parentNode.remove();

            mount('celebrate="confetti"', stepId);
            expect(confettiCanvas()).toBeNull();
        });

        it('plays for another step', () => {
            mount().parentNode.remove();
            mount();
            expect(confettiCanvas()).not.toBeNull();
        });

        it('does not count a step that celebrated nothing', () => {
            const stepId = freshStepId();
            mount('', stepId).parentNode.remove();

            mount('celebrate="confetti"', stepId);
            expect(confettiCanvas()).not.toBeNull();
        });

        it('plays once per guide element where the step has no id', () => {
            document.body.innerHTML = `<div id="a"><pendo-guide celebrate="confetti">${BODY}</pendo-guide></div><div id="b"></div>`;
            const guide = document.querySelector('pendo-guide');
            expect(confettiCanvas()).not.toBeNull();
            vi.advanceTimersByTime(3000);

            // Moving the same element is not a new show.
            document.getElementById('b').appendChild(guide);
            expect(confettiCanvas()).toBeNull();

            // A new element for the step is.
            document.getElementById('b').innerHTML = `<pendo-guide celebrate="confetti">${BODY}</pendo-guide>`;
            expect(confettiCanvas()).not.toBeNull();
        });
    });

    describe('changing the setting on a live guide', () => {
        it('plays it when turned on, even after the step played it', () => {
            const guide = mount();
            vi.advanceTimersByTime(3000);
            guide.removeAttribute('celebrate');

            guide.setAttribute('celebrate', 'confetti');
            expect(confettiCanvas()).not.toBeNull();
        });

        it('stops it when turned off', () => {
            const guide = mount();
            guide.removeAttribute('celebrate');
            expect(confettiCanvas()).toBeNull();
        });

        it('keeps one canvas when set again to another value it can play', () => {
            const guide = mount();
            guide.setAttribute('celebrate', ' confetti');
            expect(document.querySelectorAll('canvas.pendo-confetti')).toHaveLength(1);
        });

        it('does not restart the step timer', () => {
            const actions = [];
            const record = (e) => actions.push(e.detail);
            document.addEventListener('pendo-action', record);
            const guide = mount('class="pendo-guide--embedded" auto-action="dismiss" auto-action-ms="1000"');

            vi.advanceTimersByTime(600);
            guide.setAttribute('celebrate', 'confetti');
            vi.advanceTimersByTime(500);

            document.removeEventListener('pendo-action', record);
            expect(actions).toEqual([{ actions: [{ action: 'dismiss' }], trigger: 'timer' }]);
        });
    });

    describe('colors', () => {
        const drawnColors = () => new Set(contexts[0].filled);

        it("mixes the guide's primary color with a fixed bright set", () => {
            vi.spyOn(Math, 'random').mockImplementation(() => 0.1);
            mount('celebrate="confetti" style="--pendo-primary: #123456"');
            nextFrame();
            // 0.1 of eight colors picks the first: the primary, weighted three times over five.
            expect(drawnColors()).toEqual(new Set(['#123456']));
        });

        it('uses only the bright set when the primary color cannot be painted', () => {
            mount('celebrate="confetti" style="--pendo-primary: not-a-color"');
            nextFrame();
            for (const color of drawnColors()) {
                expect(['#ffc700', '#ff5e7e', '#26ccff', '#88ff5a', '#a25afd']).toContain(color);
            }
        });
    });

    it('puts the canvas in the shadow root a guide is drawn in, where its styles reach', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `<pendo-guide celebrate="confetti">${BODY}</pendo-guide>`;

        expect(shadow.querySelector('canvas.pendo-confetti')).not.toBeNull();
        expect(confettiCanvas()).toBeNull();
    });

    it('takes no pointer events and sits over the page', () => {
        const rule = ruleBody('.pendo-confetti');
        expect(rule).toMatch(/pointer-events: none/);
        expect(rule).toMatch(/position: fixed/);
        expect(rule).toMatch(/inset: 0/);
    });
});
