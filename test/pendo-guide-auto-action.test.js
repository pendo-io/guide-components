/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerGuideComponents } from '../src/register.js';
import { AUTO_ACTIONS, AUTO_ACTION_TRIGGER } from '../src/index.js';

registerGuideComponents();

const EMBEDDED = 'class="pendo-guide--embedded"';

const BODY = `
    <pendo-guide-content>
        <pendo-title>New reports</pendo-title>
        <pendo-text>Your reports now refresh every hour.</pendo-text>
        <pendo-accordion>
            <pendo-accordion-item label="What changed?">
                <pendo-text>Reports refresh on their own.</pendo-text>
            </pendo-accordion-item>
        </pendo-accordion>
    </pendo-guide-content>
    <pendo-guide-footer>
        <pendo-button action="next-step">Next</pendo-button>
    </pendo-guide-footer>
`;

let actions;
const record = (e) => actions.push(e);

/** An element outside the guide, for focus to leave to. */
let outside;

/** The dialog's first focus waits a frame, so frames are faked along with the timers. */
const FAKED = ['setTimeout', 'clearTimeout', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'];

/** Runs the frame in which a dialog moves focus to its first control. */
const nextFrame = () => vi.advanceTimersByTime(16);

beforeEach(() => {
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
    vi.useFakeTimers({ toFake: FAKED });
    actions = [];
    document.addEventListener('pendo-action', record);
});

afterEach(() => {
    document.removeEventListener('pendo-action', record);
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete document.visibilityState;
});

/** Mount a guide root with `attrs` and hand it back. */
function mount(attrs = '', inner = BODY) {
    document.body.innerHTML = `<button id="outside">Page</button><pendo-guide ${attrs}>${inner}</pendo-guide>`;
    outside = document.getElementById('outside');
    return document.querySelector('pendo-guide');
}

const timer = (action, ms) => `auto-action="${action}" auto-action-ms="${ms}"`;

/** Timer-sent events only: a click on a button inside the guide sends one too. */
const timerActions = () => actions.filter((e) => e.detail.trigger === AUTO_ACTION_TRIGGER);

const hover = (el) => el.dispatchEvent(new Event('pointerenter'));
const unhover = (el) => el.dispatchEvent(new Event('pointerleave'));

/** A `pointerdown` from a mouse, a finger or a pen. */
function press(el, pointerType) {
    const event = new Event('pointerdown', { bubbles: true, composed: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    el.dispatchEvent(event);
}

/** What a browser sends when focus leaves the window and comes back to the same control. */
function leaveWindowAndReturn(el) {
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
}

/** The focused element, looking into shadow roots as the dialog's focus trap does. */
function deepActive() {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
        active = active.shadowRoot.activeElement;
    }
    return active;
}

let visibility = 'visible';
function setVisibility(state) {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
}

describe('pendo-guide auto-action', () => {
    it.each(AUTO_ACTIONS)('sends %s as a button would, marked as from the timer', (action) => {
        const guide = mount(`${EMBEDDED} ${timer(action, 8000)}`);

        vi.advanceTimersByTime(7999);
        expect(actions).toHaveLength(0);

        vi.advanceTimersByTime(1);
        expect(actions).toHaveLength(1);
        const [event] = actions;
        expect(event.target).toBe(guide);
        expect(event.detail).toEqual({ actions: [{ action }], trigger: 'timer' });
        expect(event.bubbles).toBe(true);
        expect(event.composed).toBe(true);
    });

    it('sends once', () => {
        mount(`${EMBEDDED} ${timer('next-step', 1000)}`);

        vi.advanceTimersByTime(10000);

        expect(actions).toHaveLength(1);
    });

    it('runs in a dialog guide, whose own opening focus does not pause it', () => {
        const guide = mount(timer('dismiss', 3000));

        nextFrame();
        expect(guide.contains(document.activeElement)).toBe(true);

        vi.advanceTimersByTime(3000 - 16);
        expect(timerActions()).toHaveLength(1);
    });

    it.each([
        ['an action a timer may not do', timer('link:https://example.com', 1000)],
        ['another guide', timer('launch-guide:abc', 1000)],
        ['a step it may not go back to', timer('previous-step', 1000)],
        ['no action', 'auto-action-ms="1000"'],
        ['no time', 'auto-action="dismiss"'],
        ['a time of zero', timer('dismiss', 0)],
        ['a negative time', timer('dismiss', -5)],
        ['a fraction', timer('dismiss', 1.5)],
        ['a time in words', timer('dismiss', 'ten seconds')],
        ['a time with a unit', timer('dismiss', '10s')],
        // setTimeout runs a longer delay at once, which would close the step the moment it showed.
        ['a time longer than a browser timer holds', timer('dismiss', 2147483648)]
    ])('has no timer for %s', (_, attrs) => {
        mount(`${EMBEDDED} ${attrs}`);

        vi.advanceTimersByTime(120000);

        expect(actions).toHaveLength(0);
    });

    it('reads a time with spaces around it', () => {
        mount(`${EMBEDDED} ${timer('dismiss', ' 1000 ')}`);

        vi.advanceTimersByTime(1000);

        expect(actions).toHaveLength(1);
    });

    describe('pausing', () => {
        it('pauses while the pointer is on the guide and runs on with the time left', () => {
            const guide = mount(`${EMBEDDED} ${timer('next-step', 5000)}`);

            vi.advanceTimersByTime(2000);
            hover(guide);
            vi.advanceTimersByTime(60000);
            expect(actions).toHaveLength(0);

            unhover(guide);
            vi.advanceTimersByTime(2999);
            expect(actions).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(actions).toHaveLength(1);
        });

        it('pauses while the visitor has moved focus into the guide', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 5000)}`);
            const next = guide.querySelector('pendo-button button');

            vi.advanceTimersByTime(1000);
            next.focus();
            vi.advanceTimersByTime(60000);
            expect(timerActions()).toHaveLength(0);

            outside.focus();
            vi.advanceTimersByTime(4000);
            expect(timerActions()).toHaveLength(1);
        });

        it('stays paused while focus moves from one control in the guide to another', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 5000)}`);
            const label = guide.querySelector('pendo-accordion-item').shadowRoot.querySelector('button');

            guide.querySelector('pendo-button button').focus();
            // A label row is in its item's shadow root: the move still stays in the guide.
            label.focus();
            vi.advanceTimersByTime(60000);

            expect(timerActions()).toHaveLength(0);
        });

        it('pauses a dialog once the visitor moves focus on from where it opened', () => {
            const guide = mount(timer('dismiss', 5000));
            nextFrame();

            guide.querySelector('pendo-button button').focus();
            vi.advanceTimersByTime(60000);

            expect(timerActions()).toHaveLength(0);
        });

        it('starts paused when the guide appears under a resting pointer', () => {
            const matches = HTMLElement.prototype.matches;
            vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function(selector) {
                return selector === ':hover' ? this.localName === 'pendo-guide' : matches.call(this, selector);
            });
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

            vi.advanceTimersByTime(60000);
            expect(actions).toHaveLength(0);

            unhover(guide);
            vi.advanceTimersByTime(3000);
            expect(actions).toHaveLength(1);
        });

        it('pauses for good once the guide is touched with a finger or a pen', () => {
            for (const pointerType of ['touch', 'pen']) {
                actions = [];
                const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

                // A tap sends enter, down and leave, so the pointer is gone again right away.
                hover(guide);
                press(guide.querySelector('pendo-text'), pointerType);
                unhover(guide);
                vi.advanceTimersByTime(600000);

                expect(actions).toHaveLength(0);
            }
        });

        it('does not stop for good on a mouse press', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

            hover(guide);
            press(guide.querySelector('pendo-text'), 'mouse');
            unhover(guide);
            vi.advanceTimersByTime(3000);

            expect(actions).toHaveLength(1);
        });

        it('pauses while the page is hidden', () => {
            mount(`${EMBEDDED} ${timer('dismiss', 5000)}`);

            vi.advanceTimersByTime(1000);
            setVisibility('hidden');
            vi.advanceTimersByTime(60000);
            expect(actions).toHaveLength(0);

            setVisibility('visible');
            vi.advanceTimersByTime(4000);
            expect(actions).toHaveLength(1);
        });

        it('does not start while the page is hidden', () => {
            setVisibility('hidden');
            mount(`${EMBEDDED} ${timer('dismiss', 5000)}`);

            vi.advanceTimersByTime(60000);
            expect(actions).toHaveLength(0);

            setVisibility('visible');
            vi.advanceTimersByTime(5000);
            expect(actions).toHaveLength(1);
        });

        it("keeps a dialog's opening focus from pausing it when the visitor comes back to the window", () => {
            mount(timer('dismiss', 5000));
            nextFrame();
            const opening = deepActive();

            leaveWindowAndReturn(opening);
            vi.advanceTimersByTime(5000 - 16);

            expect(timerActions()).toHaveLength(1);
        });

        it('counts focus on the opening control once the visitor has moved on and back', () => {
            const guide = mount(timer('dismiss', 5000));
            nextFrame();
            const opening = deepActive();

            guide.querySelector('pendo-button button').focus();
            opening.focus();
            vi.advanceTimersByTime(60000);

            expect(timerActions()).toHaveLength(0);
        });

        it('stays paused until both the pointer and focus have left', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 5000)}`);

            hover(guide);
            guide.querySelector('pendo-button button').focus();
            unhover(guide);
            vi.advanceTimersByTime(60000);
            expect(timerActions()).toHaveLength(0);

            outside.focus();
            vi.advanceTimersByTime(5000);
            expect(timerActions()).toHaveLength(1);
        });
    });

    describe('when the step goes away or changes', () => {
        /** Listens on the guide itself: an event from a removed guide never reaches the document. */
        function removed(attrs) {
            const guide = mount(`${EMBEDDED} ${attrs}`);
            const sent = [];
            guide.addEventListener('pendo-action', (e) => sent.push(e));
            return { guide, sent };
        }

        it('does nothing once the guide is removed', () => {
            const { guide, sent } = removed(timer('dismiss', 3000));

            vi.advanceTimersByTime(2000);
            guide.remove();
            expect(vi.getTimerCount()).toBe(0);
            vi.advanceTimersByTime(60000);

            expect(sent).toHaveLength(0);
        });

        it('stops listening once the guide is removed', () => {
            const { guide, sent } = removed(timer('dismiss', 3000));
            guide.remove();

            hover(guide);
            unhover(guide);
            vi.advanceTimersByTime(60000);

            expect(vi.getTimerCount()).toBe(0);
            expect(sent).toHaveLength(0);
        });

        it('starts no timer for a setting changed after the guide is removed', () => {
            const { guide, sent } = removed(timer('dismiss', 3000));
            guide.remove();

            guide.setAttribute('auto-action-ms', '1000');
            vi.advanceTimersByTime(60000);

            expect(vi.getTimerCount()).toBe(0);
            expect(sent).toHaveLength(0);
        });

        it('keeps a reading visitor\'s pause when the time changes', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

            guide.querySelector('pendo-button button').focus();
            guide.setAttribute('auto-action-ms', '1000');
            vi.advanceTimersByTime(60000);
            expect(timerActions()).toHaveLength(0);

            hover(guide);
            outside.focus();
            guide.setAttribute('auto-action-ms', '2000');
            vi.advanceTimersByTime(60000);
            expect(timerActions()).toHaveLength(0);

            unhover(guide);
            vi.advanceTimersByTime(2000);
            expect(timerActions()).toHaveLength(1);
        });

        it('runs again for a new setting after it has sent', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 1000)}`);
            vi.advanceTimersByTime(1000);

            guide.setAttribute('auto-action-ms', '2000');
            vi.advanceTimersByTime(2000);

            expect(actions).toHaveLength(2);
        });

        it('starts again with a new time set on a live guide', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

            vi.advanceTimersByTime(2000);
            guide.setAttribute('auto-action-ms', '10000');
            vi.advanceTimersByTime(9999);
            expect(actions).toHaveLength(0);

            vi.advanceTimersByTime(1);
            expect(actions).toHaveLength(1);
        });

        it('sends the new action set on a live guide', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

            guide.setAttribute('auto-action', 'next-step');
            vi.advanceTimersByTime(3000);

            expect(actions.map((e) => e.detail.actions)).toEqual([[{ action: 'next-step' }]]);
        });

        it('stops when the action is removed from a live guide', () => {
            const guide = mount(`${EMBEDDED} ${timer('dismiss', 3000)}`);

            guide.removeAttribute('auto-action');
            vi.advanceTimersByTime(60000);

            expect(actions).toHaveLength(0);
        });

        it('starts when a timer is set on a live guide that had none', () => {
            const guide = mount(EMBEDDED);

            guide.setAttribute('auto-action', 'dismiss');
            guide.setAttribute('auto-action-ms', '2000');
            vi.advanceTimersByTime(2000);

            expect(actions).toHaveLength(1);
        });
    });
});
