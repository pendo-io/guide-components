import { PendoGuide } from './elements/pendo-guide.js';
import { PendoTitle } from './elements/pendo-title.js';
import { PendoText } from './elements/pendo-text.js';
import { PendoButton } from './elements/pendo-button.js';
import { PendoCloseButton } from './elements/pendo-close-button.js';
import { PendoImage } from './elements/pendo-image.js';
import { PendoDivider } from './elements/pendo-divider.js';
import { PendoVideo } from './elements/pendo-video.js';
import { PendoLink } from './elements/pendo-link.js';
import { PendoList, PendoListItem } from './elements/pendo-list.js';
import { PendoInput } from './elements/pendo-input.js';
import { PendoStarRating } from './polls/pendo-star-rating.js';
import { PendoNps } from './polls/pendo-nps.js';
import { PendoNumberScale } from './polls/pendo-number-scale.js';
import { PendoOpenText } from './polls/pendo-open-text.js';
import { PendoEmojiScale } from './polls/pendo-emoji-scale.js';
import { PendoPickList } from './polls/pendo-pick-list.js';
import { PendoYesNo } from './polls/pendo-yes-no.js';

const components = [
    ['pendo-guide', PendoGuide],
    ['pendo-title', PendoTitle],
    ['pendo-text', PendoText],
    ['pendo-button', PendoButton],
    ['pendo-close-button', PendoCloseButton],
    ['pendo-image', PendoImage],
    ['pendo-divider', PendoDivider],
    ['pendo-video', PendoVideo],
    ['pendo-link', PendoLink],
    ['pendo-list', PendoList],
    ['pendo-list-item', PendoListItem],
    ['pendo-input', PendoInput],
    ['pendo-star-rating', PendoStarRating],
    ['pendo-nps', PendoNps],
    ['pendo-number-scale', PendoNumberScale],
    ['pendo-open-text', PendoOpenText],
    ['pendo-emoji-scale', PendoEmojiScale],
    ['pendo-pick-list', PendoPickList],
    ['pendo-yes-no', PendoYesNo]
];

/**
 * Register all pendo-* custom elements.
 * Safe to call multiple times — skips already-registered elements.
 */
export function registerGuideComponents() {
    components.forEach(function([name, ctor]) {
        if (!customElements.get(name)) {
            customElements.define(name, ctor);
        }
    });
}
