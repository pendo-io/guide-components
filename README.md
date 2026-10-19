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
| `<pendo-action-row>` | Compact menu entry that performs an action |

### Poll Elements

| Component | Description |
|-----------|-------------|
| `<pendo-star-rating>` | Star rating input (1-5) |
| `<pendo-nps>` | Net Promoter Score (0-10) |
| `<pendo-number-scale>` | Configurable numeric scale |
| `<pendo-emoji-scale>` | Emoji-based rating |
| `<pendo-open-text>` | Free-form text response |

### Reveal on answer

Add `data-pendo-reveal="answered"` to any element to keep it hidden until another poll in the guide
has an answer: a picked score or rating, or text in an open-text poll. Use it for a follow-up
question, or a Submit button that has nothing to send yet. A revealed poll never counts as the
answer it waits for, and a guide with no other poll keeps everything visible.

### NPS survey

To collect NPS the way a classic Pendo NPS guide does, put the score, its follow-up reason and a
`submit-poll` button in one step:

```html
<pendo-guide>
  <pendo-nps question="How likely are you to recommend us to a friend?"></pendo-nps>
  <pendo-open-text nps-reason data-pendo-reveal="answered" question="What is the main reason for your score?"></pendo-open-text>
  <pendo-button action="submit-poll" data-pendo-reveal="answered">Submit</pendo-button>
</pendo-guide>
```

- `nps-reason` marks the text as the score's reason. Pendo records it as the score's `NPSReason`
  follow-up, as it does for a classic NPS survey. A step needs exactly one `pendo-nps` and one
  `nps-reason`; otherwise the text is a standalone `FreeForm` poll.
- `data-pendo-reveal="answered"` asks for the reason, and offers Submit, only once a score is
  picked, like a classic NPS survey.
- `submit-poll` sends the score and the reason together and moves to the next step, so a
  thank-you step can follow. Without a `submit-poll` button the client submits each score as it is
  picked.

### Reveal by score

To ask for the reason differently by score, give the `nps-reason` box a question per band:
`detractor-question`, `passive-question` and `promoter-question`, for scores of 0-6, 7-8 and 9-10.
`question` is asked until a score is picked, and for a band without its own. Picking another score
swaps the question, and the textarea's accessible name follows what is shown.

Add `data-pendo-reveal="detractor"`, `"passive"` or `"promoter"` to keep any other element hidden
until the guide's `<pendo-nps>` score is in that band, such as a review-site link only promoters
see:

```html
<pendo-guide>
  <pendo-nps question="How likely are you to recommend us to a friend?"></pendo-nps>
  <pendo-open-text nps-reason data-pendo-reveal="answered"
    question="What is the main reason for your score?"
    detractor-question="Sorry to hear that. What went wrong?"
    promoter-question="Glad to hear it! What do you like most?"></pendo-open-text>
  <pendo-button action="submit-poll" data-pendo-reveal="answered">Submit</pendo-button>
  <pendo-button data-pendo-reveal="promoter" variant="secondary"
    action='[{"action":"submit-poll"},{"action":"link","url":"https://example.com/reviews"},{"action":"dismiss"}]'>Review us</pendo-button>
</pendo-guide>
```

Keep one `nps-reason` box for every band so Pendo pairs each reason with its score. A
`<pendo-nps>` that is itself revealed is not the score a band waits on, and a guide with no other
`<pendo-nps>` shows every band at once.

## Card height

A card has no height cap by default and grows with its content. Cap one by
setting an inline `max-height` on the guide root — the same way an inline
`max-width` overrides the width default:

```html
<pendo-guide style="max-height: 420px">…</pendo-guide>
```

What scrolls depends on whether the card uses a `<pendo-guide-content>` region:

| Markup | Behaviour |
|--------|-----------|
| Cap **and** a `pendo-guide-content` | The region scrolls; the step progress and footer stay put, and a `<pendo-title>` heading the region is pinned to the top of it |
| Cap, no content region | The whole card scrolls, title and footer included |
| No cap | Unchanged — the card grows, nothing scrolls |
| Tooltip or banner | Not capped at all — `max-height` is forced off |
| Embedded | Follows the rows above — an embed caps and scrolls like any other card |

The pinned title matters because guides put their title *inside* the content
region rather than beside it:

```html
<pendo-guide style="max-height: 420px">
  <pendo-guide-content>
    <pendo-title>Help</pendo-title>
    <!-- …scrolls under the title… -->
  </pendo-guide-content>
  <pendo-guide-footer>…</pendo-guide-footer>
</pendo-guide>
```

Only the content region shrinks. A card's padding, its step progress and its
footer keep their size, so a cap they alone exceed — a large authored padding, a
bigger type scale, an extra button — leaves them past the card's edge. The card
is `overflow-y: auto` rather than `hidden` so the reader can still scroll to
them; an ordinary capped card never reaches that point and shows no scrollbar.

A tooltip and a banner cannot be height-capped, and their cap is forced off with
`!important` rather than simply ignored. A tooltip's caret is a `::before` outside
the card, which any scrolling or clipping container removes, and a banner is a
full-bleed bar with no height to cap. Excluding them from the scrolling rules
alone would have left the cap applying with `overflow: visible`, painting the body
outside the card — measured at 282px of text on the page background.

Only a title that is the region's first child is pinned. It inherits the card's
whole background rather than reading `--pendo-bg`, so a theme that paints the card
with a literal `background` is followed correctly — including a gradient, which
leaves `background-color` transparent and would otherwise let the body scroll
through the heading.

A `.pendo-guide--slideout` is capped at `80vh` by its own rule and follows the
same table, so giving a slideout a content region is now what keeps its header
and footer fixed.

Only a capped card switches to flex layout, and only when it has a content
region. That restriction is deliberate: flex stops adjacent margins collapsing,
which grows a card holding an image, a divider or a list by 12–24px. A card with
a content region measures the same either way, because its children collapse
inside the region, which stays `display: block`.

## Layout variants

A card's layout is the renderer's choice, not the markup's, and arrives as a class
on the guide root: `pendo-guide--lightbox`, `--tooltip`, `--banner`, `--slideout`
or `--embedded`.

### Embedded

An embedded guide is ordinary page content. The renderer mounts it inside an
element of the host page rather than in an overlay, and `pendo-guide--embedded`
is what tells the component to stop behaving like a dialog. Unlike the other
layout classes it has to be on the element before it is appended: the mode is
read on connect, and a dialog has already moved focus by the time a later class
could say otherwise.

```html
<div class="a-region-of-the-host-page">
  <!-- …page content… -->
  <pendo-guide class="pendo-guide--embedded">
    <pendo-guide-content>
      <pendo-title>Finish setting up billing</pendo-title>
      <pendo-text>Add a payment method to keep your projects running.</pendo-text>
    </pendo-guide-content>
    <pendo-guide-footer>
      <pendo-button action="link:/billing">Add a card</pendo-button>
    </pendo-guide-footer>
  </pendo-guide>
  <!-- …page content… -->
</div>
```

It carries no `role`, no `aria-modal` and no `aria-labelledby`, so a screen reader
announces its contents as the page content they are. Nothing in it takes focus
when it appears, Escape does nothing, and Tab walks through its controls and
straight out the other side into the rest of the page. Only those controls —
buttons, links, inputs and poll answers — are focusable; the card itself is never
a tab stop.

Visually it stays a card. Background, radius, padding, type and colour are
unchanged and just as themeable; only the shadow goes, because a card flowing in
the page is not floating above it. A theme can put one back:

```css
.pendo-guide--embedded {
  --pendo-embedded-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
```

The host owns the width — an embed is `width: 100%` with no `max-width` — and an
inline `width` or `height` set by the renderer outranks that. Height follows
[Card height](#card-height) unchanged: an embed grows with its content, and an
inline `max-height` opts it into the same scrolling content region, pinned title
and fixed footer as a lightbox. Unlike a tooltip or a banner, its cap is not
forced off.

The card is `position: relative` with no offsets, matching what Pendo's other
embedded guides are given, so every kind of embed sits in a host the same way.
It lays out exactly where the host puts it and starts no stacking context.

An embed is the one layout that can take an outer margin — every other one is
positioned by the renderer, so a margin there would fight it. It sits flush by
default, because only the host knows whether it already spaces its own children:

```css
.pendo-guide--embedded {
  --pendo-embedded-margin: 16px 0;
}
```

An embed is not given a close button by default. One can still be authored, and
the card is the containing block for it, so it lands in the card's own corner
rather than somewhere in the host page.

The class has to be in place before the element is appended. A renderer that adds
it afterwards — the way the other layout classes are applied — gets the embedded
styling on a card that still traps focus and dismisses on Escape, because the
mode is read once, on connect.

## Menu rows

`<pendo-action-row>` is a compact menu entry for a guide that offers several
choices — open this guide, go to this section, follow this link. A
`pendo-button` is sized as a call to action, and a `pendo-list-item` is prose
that re-renders its items and discards their attributes, so neither fits.

```html
<pendo-guide-content>
  <pendo-title>How can we help?</pendo-title>
  <pendo-action-row action="launch-guide:GUIDE_ID" description="A two-minute overview">
    Take the welcome tour
  </pendo-action-row>
  <pendo-action-row action="go-to-step:2">Billing and plans</pendo-action-row>
  <pendo-action-row action="link:https://example.com/docs">Documentation</pendo-action-row>
</pendo-guide-content>
```

| Attribute | |
|-----------|---|
| `action` | What a click does. The same grammar as `pendo-button`, and the same `pendo-action` event, so the client needs no new handling. A row with no `action` dismisses, as a button does. |
| `description` | Optional second line under the label. Plain text — it is never parsed as markup. |
| `trailing` | Optional override for the trailing glyph: `chevron`, `external` or `none`. |
| `target` | Where a `link:` action opens. Defaults to a new tab. |

The label is the element's content, so inline formatting works.

**The trailing glyph reflects the action.** A chevron for `go-to-step` and
`launch-guide` (they open something), an external-link glyph for `link`, and
nothing for the rest. In a compound action list the first action that opens
something decides. An author never has to choose one; `trailing` is only an
escape hatch.

**`description`, `action` and `trailing` can change after the row is built.** The
description line and the glyph follow the attribute; the label is never rebuilt.
An authoring surface edits these on the live element, and rebuilding the row for
each change would discard the label being typed into.

**Gates stay on the row.** Every attribute on the authored element stays on it,
including `data-pendo-requires-guide` and `data-pendo-requires-any`, so the
client can filter a row out before it renders. This is the difference from a
`pendo-list-item`, which loses them. Dividers are drawn between rows rather than
around them, so removing a gated row never leaves a stray rule at either end.

Put rows inside a `<pendo-guide-content>` so a [height-capped card](#card-height)
scrolls them while the title and footer stay put. A row's focus ring is drawn
inside it for the same reason: an outline outside the row would be clipped by the
scrolling region.

Not yet handled: the chevron does not flip in right-to-left layouts, in common
with the rest of the HTML guide components.

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
  // type: 'NumberScale', 'NPSRating', 'NPSReason', 'FreeForm'
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

Two exceptions. As of 0.4.0 the `pendo-button` **host** is reset with
`!important`, so a rule painting it is annihilated rather than outranked — see
[Theme buttons and links](#theme-buttons-and-links). As of 0.5.0 a tooltip and a
banner are forced to `max-height: none` the same way, so neither can be
height-capped — see [Card height](#card-height).

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

> **The button host does not paint, as of 0.4.0.** `padding` is zeroed on every
> `pendo-button`, and `background` and `border` on the variants this sheet paints
> (absent, empty, `primary`, `secondary`) — all with `!important`, because a theme
> rule is both more specific and loaded later, so nothing short of that reaches it.
> A rule on the authored tag cannot restore them; use the properties below.
>
> `variant="link"`, and any variant this sheet does not recognise, are **exempt**:
> no rule paints their inner node, so the host's own box is the only paint surface
> they have. Consumers rely on that — Novus's properties panel writes a plain
> `background-color` on the host for exactly those variants.
>
> This drops a legacy theme's host paint rather than relocating it, which is the
> point: it ends the doubled button for every stored theme with no rewrite. A theme
> that painted the tag for size loses that intent and renders at the defaults
> below until it sets the properties instead.

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

### Theme action rows

`pendo-action-row` is a wrapper in the same way: the element that paints is a
`button.pendo-action-row` inside it, and the host does not paint — `padding`,
`background` and `border` are zeroed on it with `!important`, so a legacy theme's
rule on the authored tag cannot draw a second box around the control. Use the
properties instead:

| Property | Applies to | Default |
|----------|------------|---------|
| `--pendo-action-row-padding-y` / `--pendo-action-row-padding-x` | each row | `--pendo-spacing-xs` / `--pendo-spacing-sm` |
| `--pendo-action-row-radius` | each row | `--pendo-radius` |
| `--pendo-action-row-text` | the label | `--pendo-text` |
| `--pendo-action-row-description-text` | the second line | `--pendo-text-muted` |
| `--pendo-action-row-hover-bg` | a hovered row | `rgba(0, 0, 0, 0.05)` |
| `--pendo-action-row-divider` | the rule between rows | `--pendo-border` |

The rule between rows is inset to the text edge and centred between the two
rows' text. Space rows with the padding properties, not with `margin` on
`pendo-action-row`.

### Theme content spacing

`pendo-guide-content` is a flex column that the component lays out itself, with
`display`, `flex-direction` and `gap` held `!important`. Inside it, one gap
spaces every block, and the elements' own vertical margins are dropped. That
way a divider sits as far from a row as from text, which needs the component to
know the gap. A theme's own `gap` on the region has no effect; set the
properties instead:

| Property | Applies to | Default |
|----------|------------|---------|
| `--pendo-content-gap` | between blocks in the content region | `--pendo-spacing-xs` |
| `--pendo-divider-spacing` | added on each side of a `pendo-divider` | `--pendo-spacing-xs` |

Next to an action row, a divider gives back the row's vertical padding, so it
sits the same distance from a row's text as from any other. An author's inline
margin still applies.

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
├── actions.js            # The `action` attribute grammar, shared by button and action row
├── configure.js          # Configuration API
├── elements/             # Core component definitions
│   ├── pendo-guide.js
│   ├── pendo-title.js
│   ├── pendo-text.js
│   ├── pendo-button.js
│   ├── pendo-action-row.js
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
