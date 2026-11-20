/**
 * Confetti when a guide step shows [GUIDE-367].
 *
 *   <pendo-guide celebrate="confetti">…</pendo-guide>
 *
 * Customers celebrate a finished tour, a new feature or a goal reached. The effect runs inside the
 * customer's own app, so it is small on purpose: about 120 pieces fall for 2.5 seconds on one
 * canvas, which is then removed. It plays:
 *   - once per step per page load. A renderer that draws the same step again (the Pendo agent does
 *     when a tooltip's target goes away and comes back) marks the step with `data-step-id` on an
 *     ancestor of the guide, and a step with that id does not play again until the page reloads.
 *     Without one, the guide element itself plays once;
 *   - never when the visitor's system asks for reduced motion;
 *   - never in the way: the canvas takes no pointer events and is hidden from assistive technology.
 */

/** What `celebrate` may be. Only confetti for now. */
export const CELEBRATIONS = Object.freeze(['confetti']);

const PIECE_COUNT = 120;
const DURATION_MS = 2500;

/** The last stretch of the effect, over which the pieces fade out rather than vanish. */
const FADE_MS = 500;

/** A fixed bright set. The guide's primary color joins it, weighted so the theme shows. */
const BRIGHT_COLORS = ['#ffc700', '#ff5e7e', '#26ccff', '#88ff5a', '#a25afd'];
const PRIMARY_WEIGHT = 3;

/** A sharper canvas than this costs fill rate on a large screen and is not seen in moving pieces. */
const MAX_PIXEL_RATIO = 2;

/** Steps that celebrated since the page loaded, by the id their renderer gave them. */
const celebratedSteps = new Set();

/** Guides that celebrated, for a guide whose renderer gave its step no id. */
const celebratedGuides = new WeakSet();

/**
 * The guide's celebration, or null when it has none this build can play. An unknown value plays
 * nothing: an authoring tool warns about it, and a guide must still show.
 *
 * @param {Element} guide - The `<pendo-guide>` element
 * @returns {string | null}
 */
export function readCelebration(guide) {
    const value = (guide.getAttribute('celebrate') || '').trim();
    return CELEBRATIONS.includes(value) ? value : null;
}

/** The id a renderer gave the guide's step, or null. */
function stepIdOf(guide) {
    const marked = guide.closest('[data-step-id]');
    return (marked && marked.getAttribute('data-step-id')) || null;
}

function alreadyCelebrated(guide) {
    const stepId = stepIdOf(guide);
    return stepId ? celebratedSteps.has(stepId) : celebratedGuides.has(guide);
}

function markCelebrated(guide) {
    const stepId = stepIdOf(guide);
    if (stepId) {
        celebratedSteps.add(stepId);
    } else {
        celebratedGuides.add(guide);
    }
}

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

/**
 * Plays the guide's celebration for a step that has just shown, unless the step already played it
 * since the page loaded.
 *
 * @param {HTMLElement} guide - The `<pendo-guide>` element, connected
 * @returns {Confetti | null} The running effect, for the guide to stop when it goes away
 */
export function celebrateOnShow(guide) {
    if (!readCelebration(guide) || alreadyCelebrated(guide)) return null;
    return celebrateNow(guide);
}

/**
 * Plays the guide's celebration now, whether or not the step played it before: for a celebration
 * turned on in a live guide, as an editor does to show the setting.
 *
 * @param {HTMLElement} guide - The `<pendo-guide>` element, connected
 * @returns {Confetti | null} The running effect, for the guide to stop when it goes away
 */
export function celebrateNow(guide) {
    if (!readCelebration(guide)) return null;
    markCelebrated(guide);
    if (prefersReducedMotion()) return null;
    const confetti = new Confetti(guide);
    return confetti.start() ? confetti : null;
}

/** A random number in [min, max). */
function between(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Whether the canvas can paint `value`. An invalid color would leave the last piece's color in
 * place, so it is left out instead.
 */
function paintable(context, value) {
    if (!value) return false;
    // A context ignores a color it cannot parse. Two starting colors, in case `value` is one of them.
    for (const start of ['#000000', '#ffffff']) {
        context.fillStyle = start;
        context.fillStyle = value;
        if (context.fillStyle !== start) return true;
    }
    return false;
}

/**
 * One run of confetti: a canvas over the page, drawn each frame until the time is up and then
 * removed.
 */
export class Confetti {
    /**
     * @param {HTMLElement} guide - The `<pendo-guide>` element it celebrates
     */
    constructor(guide) {
        this.guide = guide;
        this.canvas = null;
        this.context = null;
        this.pieces = [];
        this.frame = 0;
        this.startedAt = 0;
        this.lastAt = 0;
        this.draw = this.draw.bind(this);
    }

    /**
     * Puts the canvas on the page and starts drawing.
     *
     * @returns {boolean} False when the browser gives no 2D canvas, so nothing plays
     */
    start() {
        const canvas = document.createElement('canvas');
        const context = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
        if (!context) return false;

        canvas.className = 'pendo-confetti';
        canvas.setAttribute('aria-hidden', 'true');

        // Over the whole page, outside any box the renderer moved the guide into. Where the guide is
        // drawn in a shadow root, as an editor's preview is, the canvas goes there instead, where the
        // components' stylesheet reaches it.
        const root = this.guide.getRootNode();
        const parent = root && root.host ? root : document.body;
        if (!parent) return false;
        parent.appendChild(canvas);

        this.canvas = canvas;
        this.context = context;
        this.size();
        this.pieces = this.makePieces();
        this.startedAt = this.lastAt = performance.now();
        this.frame = requestAnimationFrame(this.draw);
        return true;
    }

    /** Stops drawing and removes the canvas. Safe to call more than once. */
    stop() {
        if (this.frame) {
            cancelAnimationFrame(this.frame);
            this.frame = 0;
        }
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
    }

    get running() {
        return this.canvas !== null;
    }

    size() {
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
        this.width = this.canvas.clientWidth || window.innerWidth;
        this.height = this.canvas.clientHeight || window.innerHeight;
        this.canvas.width = Math.round(this.width * ratio);
        this.canvas.height = Math.round(this.height * ratio);
        this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    colors() {
        const primary = getComputedStyle(this.guide).getPropertyValue('--pendo-primary').trim();
        if (!paintable(this.context, primary)) return BRIGHT_COLORS;
        return [...Array(PRIMARY_WEIGHT).fill(primary), ...BRIGHT_COLORS];
    }

    /**
     * Pieces start above the top edge, spread across the page and up to half a page high, so they
     * arrive in a shower rather than a line. Speeds scale with the page, so a piece crosses a small
     * page and a large one in about the same time.
     */
    makePieces() {
        const colors = this.colors();
        const { width, height } = this;
        return Array.from({ length: PIECE_COUNT }, () => {
            const size = between(6, 11);
            return {
                x: between(0, width),
                y: between(-height * 0.5, 0) - size,
                width: size,
                height: size * between(0.4, 0.7),
                speedX: between(-0.06, 0.06) * width,
                speedY: between(0.15, 0.3) * height,
                fall: 0.35 * height,
                sway: between(10, 30),
                swaySpeed: between(2, 5),
                phase: between(0, Math.PI * 2),
                rotation: between(0, Math.PI * 2),
                spin: between(-6, 6),
                flipSpeed: between(4, 10),
                color: colors[Math.floor(Math.random() * colors.length)]
            };
        });
    }

    /** One frame. Moves by elapsed time, so a slow or paused page ends on time all the same. */
    draw(now) {
        const elapsed = now - this.startedAt;
        if (elapsed >= DURATION_MS) {
            this.stop();
            return;
        }
        const dt = Math.max(0, now - this.lastAt) / 1000;
        this.lastAt = now;
        const t = elapsed / 1000;

        const { context } = this;
        context.clearRect(0, 0, this.width, this.height);
        context.globalAlpha = Math.min(1, (DURATION_MS - elapsed) / FADE_MS);

        for (const piece of this.pieces) {
            piece.speedY += piece.fall * dt;
            piece.y += piece.speedY * dt;
            piece.x += piece.speedX * dt;
            piece.rotation += piece.spin * dt;
            if (piece.y - piece.width > this.height) continue;

            const x = piece.x + Math.sin(t * piece.swaySpeed + piece.phase) * piece.sway;
            context.save();
            context.translate(x, piece.y);
            context.rotate(piece.rotation);
            // Turning over: the piece narrows to an edge and widens again.
            context.scale(1, Math.cos(t * piece.flipSpeed + piece.phase));
            context.fillStyle = piece.color;
            context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
            context.restore();
        }

        this.frame = requestAnimationFrame(this.draw);
    }
}
