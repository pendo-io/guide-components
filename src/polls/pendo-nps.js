import { PendoBaseElement } from '../base-element.js';

const MIN_SCORE = 0;
const MAX_SCORE = 10;

function isScore(value) {
    return Number.isInteger(value) && value >= MIN_SCORE && value <= MAX_SCORE;
}

/** A `value` attribute is a pre-selection only when it names one of the scale's scores. */
function parseScore(raw) {
    if (raw === null || raw.trim() === '') return null;
    const score = Number(raw);
    return isScore(score) ? score : null;
}

/**
 * <pendo-nps> - Net Promoter Score poll component
 *
 * Displays a 0-10 scale for NPS surveys with "Not likely" and "Very likely" labels.
 *
 * Attributes:
 * - question: The question text to display
 * - poll-id: The poll identifier (injected by backend)
 * - value: Pre-selected value
 * - low-label: Label for low end (default: "Not likely")
 * - high-label: Label for high end (default: "Very likely")
 *
 * Events:
 * - pendo-response: Fired once per selection { pollId, value, type: 'NPSRating' }
 *
 * Pair it with a `<pendo-open-text nps-reason>` for the reason. Add `data-pendo-reveal="answered"` to
 * the reason and the guide's `submit-poll` button to show them only once a score is picked; see
 * `defaults.css`.
 *
 * Example:
 *   <pendo-nps question="How likely are you to recommend us to a friend?"></pendo-nps>
 */
export class PendoNps extends PendoBaseElement {
    connectedCallback() {
        this.pollId = this.getAttribute('poll-id') || this.generateId();
        this.question = this.getAttribute('question') || '';
        this.value = parseScore(this.getAttribute('value'));
        this.lowLabel = this.getAttribute('low-label') || 'Not likely';
        this.highLabel = this.getAttribute('high-label') || 'Very likely';

        this.classList.add('pendo-poll', 'pendo-nps');
        this.render();
    }

    /**
     * Built with DOM APIs rather than an HTML string: every attribute here is author or backend
     * input, and `escapeHtml` leaves quotes alone, so one interpolated into markup can break out of
     * the attribute it lands in.
     */
    render() {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'pendo-poll__fieldset';
        fieldset.setAttribute('role', 'radiogroup');

        if (this.question) {
            const legend = document.createElement('legend');
            legend.id = this.generateId();
            legend.className = 'pendo-poll__question';
            legend.textContent = this.question;
            fieldset.setAttribute('aria-labelledby', legend.id);
            fieldset.append(legend);
        }

        const lowLabel = this.renderEndLabel('low', this.lowLabel);
        const highLabel = this.renderEndLabel('high', this.highLabel);

        // A generated group name rather than the poll id keeps backend input out of the controls.
        const name = this.generateId();
        const scale = document.createElement('div');
        scale.className = 'pendo-nps__scale';
        for (let score = MIN_SCORE; score <= MAX_SCORE; score++) {
            const describedBy = score === MIN_SCORE ? lowLabel.id : score === MAX_SCORE ? highLabel.id : null;
            scale.append(this.renderScore(score, name, describedBy));
        }

        const labels = document.createElement('div');
        labels.className = 'pendo-nps__labels';
        labels.append(lowLabel, highLabel);

        fieldset.append(scale, labels);
        this.replaceChildren(fieldset);

        // `change` fires once per selection whether it came from the label, the radio, or an arrow
        // key. Listening to the label's `click` too reported a single pointer selection up to three
        // times, and the client submits every report as its own poll response.
        fieldset.addEventListener('change', (e) => this.selectScore(parseInt(e.target.value, 10)));
    }

    renderScore(score, name, describedBy) {
        const label = document.createElement('label');
        label.className = `pendo-nps__score pendo-nps__score--${this.getCategory(score)}`;
        label.classList.toggle('pendo-nps__score--selected', this.value === score);
        label.dataset.value = String(score);

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = String(score);
        input.className = 'pendo-sr-only';
        input.checked = this.value === score;
        // The ends of the scale carry its meaning, so "0" is announced as "0, Not likely".
        if (describedBy) input.setAttribute('aria-describedby', describedBy);

        const text = document.createElement('span');
        text.className = 'pendo-nps__score-value';
        text.textContent = String(score);

        label.append(input, text);
        return label;
    }

    renderEndLabel(end, text) {
        const span = document.createElement('span');
        span.id = this.generateId();
        span.className = `pendo-nps__label pendo-nps__label--${end}`;
        span.textContent = text;
        return span;
    }

    getCategory(score) {
        if (score <= 6) return 'detractor';
        if (score <= 8) return 'passive';
        return 'promoter';
    }

    selectScore(value) {
        this.value = value;

        this.querySelectorAll('.pendo-nps__score').forEach((score) => {
            const isSelected = parseInt(score.dataset.value, 10) === value;
            score.classList.toggle('pendo-nps__score--selected', isSelected);
            score.querySelector('input').checked = isSelected;
        });

        this.emitResponse(this.pollId, value, 'NPSRating');
    }

    /**
     * Get the current selected value
     */
    getValue() {
        return this.value;
    }

    /**
     * Set the value programmatically
     */
    setValue(value) {
        if (isScore(value)) {
            this.selectScore(value);
        }
    }
}
