/**
 * @pendo/guide-components
 *
 * Custom elements for rendering Pendo HTML guides.
 * Call registerGuideComponents() to register all pendo-* custom elements.
 */

// Base class (exported for extension)
export { PendoBaseElement } from './base-element.js';

// Core elements
export { PendoGuide } from './elements/pendo-guide.js';
export { PendoTitle } from './elements/pendo-title.js';
export { PendoText } from './elements/pendo-text.js';
export { PendoButton } from './elements/pendo-button.js';
export { PendoCloseButton } from './elements/pendo-close-button.js';

// Media elements
export { PendoImage } from './elements/pendo-image.js';
export { PendoDivider } from './elements/pendo-divider.js';
export { PendoVideo } from './elements/pendo-video.js';

// Interactive elements
export { PendoLink } from './elements/pendo-link.js';
export { PendoList, PendoListItem } from './elements/pendo-list.js';
export { PendoInput } from './elements/pendo-input.js';

// Poll elements
export { PendoStarRating } from './polls/pendo-star-rating.js';
export { PendoNps } from './polls/pendo-nps.js';
export { PendoNumberScale } from './polls/pendo-number-scale.js';
export { PendoOpenText } from './polls/pendo-open-text.js';
export { PendoEmojiScale } from './polls/pendo-emoji-scale.js';
export { PendoPickList } from './polls/pendo-pick-list.js';
export { PendoYesNo } from './polls/pendo-yes-no.js';

// Configuration API
export { configurePendoComponents } from './configure.js';

// Registration (deferred — consumers call this when ready)
export { registerGuideComponents } from './register.js';

// Import styles (will be extracted by build)
import './styles/defaults.css';
