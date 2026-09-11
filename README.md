# @pendo/guide-components

Custom elements for rendering Pendo HTML guides. This library provides a set of web components that can be used to build and display Pendo in-app guides with consistent behavior and styling.

## Features

- **Native Web Components** - Works with any framework or vanilla JavaScript
- **Design System Integration** - Map your own components for consistent branding
- **Accessible** - Built with a11y best practices
- **Lightweight** - No runtime dependencies

## Installation

```bash
npm install @pendo/guide-components
```

## Usage

### ESM (Recommended)

```javascript
import '@pendo/guide-components';
import '@pendo/guide-components/styles';
```

### Script Tag (CDN)

```html
<script src="path/to/pendo-guide-components.js"></script>
<link rel="stylesheet" href="path/to/pendo-guide-components.css">
```

### Basic Example

```html
<pendo-guide>
  <pendo-title>Welcome to Our App</pendo-title>
  <pendo-text>Here's a quick tour of the new features.</pendo-text>
  <pendo-button action="next-step" variant="primary">Next</pendo-button>
  <pendo-button action="dismiss" variant="secondary">Skip Tour</pendo-button>
</pendo-guide>
```

## Components

### Core Elements

| Component | Description |
|-----------|-------------|
| `<pendo-guide>` | Container element for guide content |
| `<pendo-title>` | Heading/title text |
| `<pendo-text>` | Body text content |
| `<pendo-button>` | Action button with configurable behavior |

### Media Elements

| Component | Description |
|-----------|-------------|
| `<pendo-image>` | Image display |
| `<pendo-video>` | Video player |
| `<pendo-divider>` | Visual separator |

### Interactive Elements

| Component | Description |
|-----------|-------------|
| `<pendo-link>` | Hyperlink |
| `<pendo-list>` | List container |
| `<pendo-list-item>` | List item |
| `<pendo-input>` | Text input field |

### Poll Elements

| Component | Description |
|-----------|-------------|
| `<pendo-star-rating>` | Star rating input (1-5) |
| `<pendo-nps>` | Net Promoter Score (0-10) |
| `<pendo-number-scale>` | Configurable numeric scale |
| `<pendo-emoji-scale>` | Emoji-based rating |
| `<pendo-open-text>` | Free-form text response |

## Button Actions

The `<pendo-button>` component supports the following actions:

```html
<!-- Navigation -->
<pendo-button action="next-step">Next</pendo-button>
<pendo-button action="previous-step">Back</pendo-button>
<pendo-button action="dismiss">Close</pendo-button>

<!-- Links -->
<pendo-button action="link:https://example.com" target="_blank">Learn More</pendo-button>

<!-- Guide Launching -->
<pendo-button action="launch-guide:guide-id-123">Start Tutorial</pendo-button>
```

## Events

All components emit events that bubble up for centralized handling:

### pendo-action

Emitted when a user interacts with navigation or action elements.

```javascript
document.addEventListener('pendo-action', (e) => {
  const { action, params } = e.detail;
  // action: 'next-step', 'dismiss', 'link', 'launch-guide', etc.
  // params: { url, target, guideId, ... }
});
```

### pendo-response

Emitted when a user submits a poll response.

```javascript
document.addEventListener('pendo-response', (e) => {
  const { pollId, value, type } = e.detail;
  // type: 'starRating', 'nps', 'freeForm', etc.
});
```

## Custom Component Mapping

Integrate your design system by mapping custom components:

```javascript
import { configurePendoComponents } from '@pendo/guide-components';
import { Button, Heading, Text } from '@acme/design-system';

configurePendoComponents({
  button: Button,
  title: Heading,
  text: Text
});
```

Custom components receive props and can be built with React, Vue, or any framework.

## Theming

Default component styles are shipped **unlayered** — they do not use CSS cascade
layers. Cascade layers always lose to unlayered styles for normal declarations,
so a layered library got overridden by a host app's unlayered reset (e.g.
`* { padding: 0 }`) regardless of selector specificity. Shipping unlayered lets
the library defaults win over a zero-specificity host reset on their own.

Override the defaults with **unlayered** rules, loaded *after* the library
stylesheet. Resolution is by ordinary specificity, with source order breaking
ties — so an equal-specificity theme rule wins as long as it loads last.

> **Migrating from `@layer pendo.theme`:** earlier versions shipped defaults in
> `@layer pendo.components` and recommended themes in `@layer pendo.theme`. The
> library no longer declares any layers. Move theme rules **out** of
> `@layer pendo.theme` — a layered theme now loses to the unlayered library
> defaults.

### Theme via custom properties

```css
/* Loaded after pendo-guide-components.css */
pendo-guide,
.pendo-guide {
  --pendo-primary: #2563eb;
  --pendo-primary-hover: #1d4ed8;
  --pendo-font: "Inter", system-ui, sans-serif;
  --pendo-radius: 12px;
}
```

### Theme buttons and links

`pendo-button` and `pendo-link` are wrappers: the element that actually paints is
a `button.pendo-button` / `a.pendo-link` inside, and it declares its own padding,
radius, typography and colour. A rule on the authored tag therefore offers an
inherited value that can never beat the inner element's own declaration — so
these are set through custom properties rather than rules:

| Property | Applies to | Default |
|----------|------------|---------|
| `--pendo-button-padding-y` / `--pendo-button-padding-x` | all buttons | `--pendo-spacing-sm` / `--pendo-spacing` |
| `--pendo-button-radius` | all buttons | `--pendo-radius` |
| `--pendo-button-shadow` | all buttons | `none` |
| `--pendo-button-font-size` / `--pendo-button-font-weight` | all buttons | `0.9375rem` / `500` |
| `--pendo-button-bg` / `--pendo-button-border` | `variant="primary"` | `--pendo-primary` / `none` |
| `--pendo-button-secondary-bg` / `--pendo-button-secondary-border` / `--pendo-button-secondary-text` | `variant="secondary"` | `transparent` / `--pendo-border` / `--pendo-text` |
| `--pendo-link-color` | links | `--pendo-primary` |

Every default is the value the stylesheet hard-coded before the property
existed, so setting none of them renders exactly as an unthemed guide does.
Hover fills are not tokenised: a primary button that sets `--pendo-button-bg`
still hovers to `--pendo-primary-hover`.

### The contract as data

The full list — names, defaults, and the rule each one lands in — ships with the
package so a consumer that writes these properties can assert its own spellings
against the component instead of restating them:

```javascript
import contract from '@pendo/guide-components/theme-tokens' with { type: 'json' };

// contract.tokens: [{ name, default, selector, property }, ...]
// `property: null` means the token is defined on `selector`; otherwise it is read
// as the `var()` fallback of `selector`'s `property` declaration.
```

An unrecognised custom property is never read, so a one-sided rename is silent:
the control keeps accepting values and the guide keeps rendering the default.
Checking against this artifact turns that into a failing test.

### Scoped override (higher specificity)

```css
pendo-guide[data-guide-id="onboarding"] {
  --pendo-primary: #7c3aed;
}
```

Brand tokens (`--brand-primary`, etc.) are referenced by the defaults and can be
set on `:root` or a host element.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build production bundles |
| `npm run dev` | Build with watch mode |
| `npm run serve` | Start local dev server on port 3001 |
| `npm run harness` | Build and serve test harness |
| `npm test` | Run tests |
| `npm run test:a11y` | Run accessibility tests |

### Project Structure

```
src/
├── index.js              # Main entry point
├── base-element.js       # Base class for all components
├── configure.js          # Configuration API
├── elements/             # Core component definitions
│   ├── pendo-guide.js
│   ├── pendo-title.js
│   ├── pendo-text.js
│   ├── pendo-button.js
│   ├── pendo-image.js
│   ├── pendo-divider.js
│   ├── pendo-video.js
│   ├── pendo-link.js
│   ├── pendo-list.js
│   └── pendo-input.js
├── polls/                # Poll component definitions
│   ├── pendo-star-rating.js
│   ├── pendo-nps.js
│   ├── pendo-number-scale.js
│   ├── pendo-open-text.js
│   └── pendo-emoji-scale.js
└── styles/
    ├── defaults.css      # Default component styles
    └── theme-tokens.js   # The themeable custom properties, as data
```

### Build Outputs

The build produces:

- `dist/pendo-guide-components.esm.js` - ES module for bundlers
- `dist/pendo-guide-components.js` - IIFE for script tags
- `dist/pendo-guide-components.css` - Component styles
- `dist/theme-tokens.json` - The themeable custom properties and their defaults

## License

MIT
