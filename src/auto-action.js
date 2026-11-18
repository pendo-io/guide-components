/**
 * A guide step that moves on or closes by itself after a set time [GUIDE-368].
 *
 *   <pendo-guide auto-action="next-step" auto-action-ms="8000">…</pendo-guide>
 *
 * When the time is up the guide sends the `pendo-action` event a button with that action sends,
 * with `trigger: 'timer'` added, so a renderer can tell a timer from a visitor's click and leave it
 * out of its click analytics.
 *
 * The timer waits while the visitor is reading, and runs on with the time it had left once they
 * stop (WCAG 2.2.1, Timing Adjustable). It pauses:
 *   - while the pointer is on the guide;
 *   - while the visitor has moved focus into the guide. The focus a dialog moves to its first
 *     control when it opens does not count: it is in every dialog from the start, and it comes
 *     back each time the visitor returns to the window;
 *   - for good once the visitor touches the guide on a touch screen or with a pen, where no
 *     pointer rests on the guide and a tapped button may not take focus;
 *   - while the page is hidden, as in a background tab, where nobody can read it.
 */

/**
 * What a timer may do. Only these two: a timer must not open a URL or start another guide, which
 * would take the visitor somewhere they did not ask to go.
 */
export const AUTO_ACTIONS = Object.freeze(['next-step', 'dismiss']);

/** `detail.trigger` on the `pendo-action` event a timer sends. */
export const AUTO_ACTION_TRIGGER = 'timer';

/**
 * The longest delay `setTimeout` keeps: it stores the delay as a 32-bit signed integer, and a
 * longer one runs at once (MDN, "Maximum delay value").
 */
const MAX_TIMEOUT_MS = 2147483647;

/**
 * The guide's timer settings, or null when it has none it can run.
 *
 * An unknown action, or a time that is not a whole number of milliseconds above zero and within
 * what a browser timer holds, gives no timer at all: a guide that closed the moment it showed, or
 * did something else than its author wrote, would be worse than one that waits for a button. The
 * limits an author may choose are the authoring tool's to set.
 *
 * @param {Element} guide - The `<pendo-guide>` element
 * @returns {{ action: string, ms: number } | null}
 */
export function readAutoAction(guide) {
    const action = (guide.getAttribute('auto-action') || '').trim();
    if (!AUTO_ACTIONS.includes(action)) return null;

    const raw = (guide.getAttribute('auto-action-ms') || '').trim();
    if (!/^[0-9]+$/.test(raw)) return null;
    const ms = Number(raw);
    if (ms <= 0 || ms > MAX_TIMEOUT_MS) return null;

    return { action, ms };
}

/**
 * Runs one guide's timer: started on connect, stopped on disconnect, and sent at most once.
 */
export class AutoActionTimer {
    /**
     * @param {HTMLElement} guide - The `<pendo-guide>` element the timer belongs to
     * @param {{ action: string, ms: number }} settings - From `readAutoAction`
     * @param {AutoActionTimer | null} [previous] - The timer this one replaces on the same guide,
     *   whose idea of what the visitor is doing still holds
     */
    constructor(guide, { action, ms }, previous = null) {
        this.guide = guide;
        this.action = action;
        this.remaining = ms;
        this.handle = null;
        this.startedAt = 0;
        this.finished = false;
        this.ignoringFocus = false;

        // A pointer that has not moved since the guide appeared under it sends no `pointerenter`.
        this.hovered = previous ? previous.hovered : guide.matches(':hover');
        this.focused = previous ? previous.focused : false;
        this.touched = previous ? previous.touched : false;
        this.openingFocus = previous ? previous.openingFocus : null;

        this.onPointerEnter = () => this.setHovered(true);
        this.onPointerLeave = () => this.setHovered(false);
        this.onPointerDown = (e) => {
            if (e.pointerType && e.pointerType !== 'mouse') {
                this.touched = true;
                this.update();
            }
        };
        this.onFocusIn = (e) => {
            if (this.ignoringFocus) return;
            // The control a dialog focused when it opened gets focus back whenever the visitor
            // returns to the window. Only once they have focused something else does it count.
            const target = e.composedPath()[0];
            if (target === this.openingFocus) return;
            this.openingFocus = null;
            this.setFocused(true);
        };
        // Focus moving on to another control in the guide sends `focusin` right after, which
        // pauses the timer again before it can run out.
        this.onFocusOut = () => this.setFocused(false);
        this.onVisibilityChange = () => this.update();
    }

    start() {
        this.guide.addEventListener('pointerenter', this.onPointerEnter);
        this.guide.addEventListener('pointerleave', this.onPointerLeave);
        this.guide.addEventListener('pointerdown', this.onPointerDown);
        this.guide.addEventListener('focusin', this.onFocusIn);
        this.guide.addEventListener('focusout', this.onFocusOut);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.update();
    }

    stop() {
        this.pause();
        this.guide.removeEventListener('pointerenter', this.onPointerEnter);
        this.guide.removeEventListener('pointerleave', this.onPointerLeave);
        this.guide.removeEventListener('pointerdown', this.onPointerDown);
        this.guide.removeEventListener('focusin', this.onFocusIn);
        this.guide.removeEventListener('focusout', this.onFocusOut);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    /**
     * Moves focus to `target` without pausing the timer: for the focus a dialog moves to its first
     * control when it opens, which no visitor asked for.
     *
     * @param {HTMLElement} target
     */
    focusWithoutPausing(target) {
        this.openingFocus = target;
        this.ignoringFocus = true;
        try {
            target.focus();
        } finally {
            this.ignoringFocus = false;
        }
    }

    get paused() {
        return this.hovered || this.focused || this.touched || document.visibilityState === 'hidden';
    }

    setHovered(hovered) {
        this.hovered = hovered;
        this.update();
    }

    setFocused(focused) {
        this.focused = focused;
        this.update();
    }

    update() {
        if (this.paused) {
            this.pause();
        } else {
            this.resume();
        }
    }

    resume() {
        if (this.finished || this.handle !== null) return;
        this.startedAt = performance.now();
        this.handle = setTimeout(() => this.fire(), this.remaining);
    }

    pause() {
        if (this.handle === null) return;
        clearTimeout(this.handle);
        this.handle = null;
        this.remaining = Math.max(0, this.remaining - (performance.now() - this.startedAt));
    }

    fire() {
        this.handle = null;
        this.finished = true;
        this.stop();
        this.guide.dispatchEvent(new CustomEvent('pendo-action', {
            detail: { actions: [{ action: this.action }], trigger: AUTO_ACTION_TRIGGER },
            bubbles: true,
            composed: true
        }));
    }
}
