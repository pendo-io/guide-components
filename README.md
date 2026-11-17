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

### Layout Elements

| Component | Description |
|-----------|-------------|
| `<pendo-columns>` | Puts 2 to 4 columns side by side; they stack when the guide is narrow |
| `<pendo-column>` | One column; `variant="card"` draws it as a card |
| `<pendo-table>` | A table of data that scrolls sideways when it is too wide |
| `<pendo-table-row>` | One row of a table; `header` makes it the column headings |
| `<pendo-table-cell>` | One cell: text, inline formatting and an optional `<pendo-link>` |
| `<pendo-accordion>` | Sections that open and close, such as an FAQ |
| `<pendo-accordion-item>` | One section: a `label` row, and a body of content elements; `open` starts it open |

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

## Columns and cards

`<pendo-columns>` puts content side by side: plans to compare, tiles to pick
from. It holds 2 to 4 `<pendo-column>` elements, and each column holds the usual
content elements.

```html
<pendo-guide style="max-width: 600px">
  <pendo-guide-content>
    <pendo-title>Pick a plan</pendo-title>
    <pendo-columns>
      <pendo-column variant="card">
        <pendo-title>Growth</pendo-title>
        <pendo-text>For small teams that ship every week.</pendo-text>
        <pendo-button action="link:https://example.com/growth">Choose Growth</pendo-button>
      </pendo-column>
      <pendo-column variant="card">
        <pendo-title>Business</pendo-title>
        <pendo-text>For several teams and their admins.</pendo-text>
        <pendo-button action="link:https://example.com/business">Choose Business</pendo-button>
      </pendo-column>
      <pendo-column variant="card">
        <pendo-title>Enterprise</pendo-title>
        <pendo-text>For the whole company, with SSO.</pendo-text>
        <pendo-button action="link:https://example.com/enterprise">Talk to us</pendo-button>
      </pendo-column>
    </pendo-columns>
  </pendo-guide-content>
</pendo-guide>
```

| Attribute | On | |
|-----------|----|---|
| `variant="card"` | `pendo-column` | Draws the column as a card: a border, a background, rounded corners and padding. Without it a column has no paint of its own. |

**All side by side, or all stacked.** The columns share one row while each one
can be at least `--pendo-column-min-width` (120px) wide. When the guide is
narrower than that, every column moves to its own row, in source order. They
never wrap part of the way, with two columns over a third. The width that counts
is the guide's, not the window's, so the same markup stacks in a tooltip and
stays side by side in a wider lightbox. Measured from the built output with the
default tokens:

| Guide | 2 columns | 3 columns | 4 columns |
|-------|-----------|-----------|-----------|
| Tooltip at its widest (360px) | side by side | stacked | stacked |
| Tooltip at its narrowest (280px) | stacked | stacked | stacked |
| Lightbox (400px default) | side by side | stacked | stacked |
| `max-width: 600px` | side by side | side by side | side by side |

So give a guide with 3 or 4 columns a wider `max-width`, as above. A tooltip
sizes to its content, between 280px and 360px: two columns sit side by side only
when the tooltip is at least 300px wide, which other text in it usually makes it.
A tooltip that holds only short tiles stays at 280px, and its columns stack.

Both size tokens, `--pendo-columns-gap` and `--pendo-column-min-width`, go into
a `calc()`, so a theme gives them a unit: `0px`, never a bare `0`. A bare `0`
still draws no gap, but it breaks the stacking rule, and columns can then wrap
part of the way.

**Each column is a content region of its own.** Its blocks are spaced by
`--pendo-content-gap`, with their own vertical margins dropped, as in
`<pendo-guide-content>`. Columns in one row are the same height. A long word
breaks inside its column, and a button's label wraps to the column's width,
breaking inside a word when one word alone is too long.

**The markup stays as authored.** Neither element changes the DOM, so a gate on a
column (`data-pendo-requires-guide`, `data-pendo-requires-any`) works, and the
layout counts only the columns that are left: two of three left share the row
as two.

Not yet handled: the buttons at the foot of a row of cards do not line up when
the cards hold different amounts of text, and a whole card cannot be clickable;
put a button or an action row in it.

## Tables

`<pendo-table>` shows data in rows and columns: plans and their limits, status
values and what to do about each, numbers by segment. It holds
`<pendo-table-row>` elements, and each row holds `<pendo-table-cell>` elements. A
cell holds text, with inline formatting and an optional `<pendo-link>`.

```html
<pendo-table>
  <pendo-table-row header>
    <pendo-table-cell>Status</pendo-table-cell>
    <pendo-table-cell>Meaning</pendo-table-cell>
    <pendo-table-cell>What to do</pendo-table-cell>
  </pendo-table-row>
  <pendo-table-row>
    <pendo-table-cell><strong>Paused</strong></pendo-table-cell>
    <pendo-table-cell>An admin stopped the sync.</pendo-table-cell>
    <pendo-table-cell>Resume it in Settings.</pendo-table-cell>
  </pendo-table-row>
  <pendo-table-row>
    <pendo-table-cell><strong>Failed</strong></pendo-table-cell>
    <pendo-table-cell>The last three runs failed.</pendo-table-cell>
    <pendo-table-cell>Read the <pendo-link href="https://example.com/help/sync">sync guide</pendo-link>.</pendo-table-cell>
  </pendo-table-row>
</pendo-table>
```

| Attribute | On | |
|-----------|----|---|
| `header` | `pendo-table-row` | The row holds the column headings. Its cells are drawn as headings and read as column headers. |

**It fills the guide, and scrolls when it is too wide.** The columns line up
across the rows. Each column is never narrower than its longest word, takes the
width its content needs when there is room, and shares what is left. When even
the longest words do not fit, the table scrolls sideways inside the guide. It
never makes the guide wider, and a word never breaks. Measured from the built
output with the default tokens, for a table of four short columns (`Feature`,
`Growth`, `Business`, `Enterprise`):

| Guide | Result |
|-------|--------|
| Tooltip (sizes to its content, up to 360px) | the tooltip grows to 360px, and the table scrolls by 16px |
| Lightbox (400px default) | fits, and fills the guide |
| `max-width: 280px` | scrolls by 96px |

A table of three columns of sentences fits a 360px tooltip, because sentences
wrap. In a banner, the content region that holds a table takes the room the bar
has left, so the table scrolls there too and the bar's buttons stay in it.

**A keyboard can scroll it.** While a table overflows, it takes `tabindex="0"`,
so Tab reaches it and the arrow keys scroll it, with a focus ring drawn inside
its edge. It drops the attribute again once it fits. A `tabindex` the author
wrote is left alone.

**A screen reader reads a table.** The elements are not rebuilt into a
`<table>`. Each one takes the ARIA role of the part it plays: `table`, `row`, and
`columnheader` for a cell in a `header` row or `cell` for any other. The role
follows the row: a cell moved to another row, and a row whose `header` is turned
on or off, take the new role at once.

A row outside a table, or a cell outside a row, takes no role, since ARIA allows
those parts only inside their own parent.

**The markup stays as authored**, apart from `role`, and `tabindex` while the
table scrolls. A gate on a row or a cell (`data-pendo-requires-guide`,
`data-pendo-requires-any`) works, and the layout counts only the cells that are
left. `hidden` hides a table, a row or a cell.

**Up to 8 columns fill the guide.** The layout is a grid whose rows are subgrids,
with as many columns as the longest row has cells. A table with more columns, or
an engine without `subgrid` or `:has()`, gets CSS table display instead: the same
aligned, scrolling table, as wide as its content rather than as wide as the
guide. A row holds cells only: anything else in it takes a place of its own.

Not yet handled: a header column (the first cell of each row as a row heading),
cells that span columns, and cell alignment, such as numbers on the right. A
table that scrolls has no visible hint that it does, apart from the browser's
own scroll bar.

## Accordions

`<pendo-accordion>` holds sections that open and close: an FAQ, release notes
with one section for each feature, a video behind its title. It holds
`<pendo-accordion-item>` elements. Each item has a label row, from its `label`
attribute, and a body: the item's children, which are the usual content elements
(title, text, image, video, button, link, list, table).

```html
<pendo-accordion>
  <pendo-accordion-item label="How do I export a report?">
    <pendo-text>Open the report and choose <strong>Export</strong>.</pendo-text>
  </pendo-accordion-item>
  <pendo-accordion-item label="Who can see my reports?" open>
    <pendo-text>Everyone on your team. Change it in Sharing.</pendo-text>
  </pendo-accordion-item>
  <pendo-accordion-item label="Watch the two-minute tour">
    <pendo-video src="https://example.com/tour.mp4"></pendo-video>
  </pendo-accordion-item>
</pendo-accordion>
```

| Attribute | On | |
|-----------|----|---|
| `label` | `pendo-accordion-item` | The text of the label row. Plain text. |
| `open` | `pendo-accordion-item` | The item starts open. Without it, the item starts closed. |

**A click, Enter or Space opens and closes an item.** Each item opens on its
own: opening one does not close another. The body is a content region, spaced
like `pendo-guide-content`. An open item makes the guide taller; a guide with a
height cap scrolls its content region, not the whole card. Closing an item stops
a video playing in it: a native video pauses, and a YouTube or Vimeo player
reloads at its start. A label too long for the row wraps, breaking a long word if
it must.

**A keyboard and a screen reader can use it.** The label row is a real
`<button>` with `aria-expanded` and `aria-controls`, inside an element with the
`heading` role, as the WAI-ARIA accordion pattern has it. A closed body is
`hidden`, so nothing in it is drawn, reached by Tab or read. The guide's focus
trap lists the label rows too.

**The markup stays as authored.** The label row and the box of the body are
built in the item's shadow root, and the children are slotted into the body.
Nothing is added to the authored markup, and opening an item by hand does not
change its `open` attribute, so an editor saves what the author wrote. Turning
`open` on or off on a live item opens or closes it. A gate on an accordion or an
item (`data-pendo-requires-guide`, `data-pendo-requires-any`) works, and `hidden`
hides either one. A script can read and set `item.expanded`, or call
`item.toggle()`.

Opening an item sends no event.

On a renderer without this version, the elements are unknown: every body shows,
open, and the labels do not show.

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

A `pendo-column` and the body of a `pendo-accordion-item` follow the same rules,
so these properties space their blocks too.

### Theme columns and cards

`pendo-columns` holds its `display`, `flex-wrap` and `gap` with `!important`, as
the content region does. A card is the `pendo-column` itself, not a wrapper, so a
theme rule on the tag does paint it, but the properties are the supported route:

| Property | Applies to | Default |
|----------|------------|---------|
| `--pendo-columns-gap` | between columns, and in the width at which they stack (needs a unit) | `--pendo-spacing-sm` |
| `--pendo-column-min-width` | the narrowest a column gets before the columns stack (needs a unit) | `120px` |
| `--pendo-column-card-padding` | inside a card | `--pendo-spacing-sm` |
| `--pendo-column-card-bg` | a card's background | `--pendo-bg` |
| `--pendo-column-card-border` | a card's border (the whole shorthand) | `1px solid var(--pendo-border)` |
| `--pendo-column-card-radius` | a card's corners | `--pendo-radius` |
| `--pendo-column-card-shadow` | a card's shadow | `none` |

### Theme tables

`pendo-table`, `pendo-table-row` and `pendo-table-cell` hold their `display` with
`!important`, so a theme cannot break the columns' alignment. The rest of a
table's look is themed through these properties:

| Property | Applies to | Default |
|----------|------------|---------|
| `--pendo-table-font-size` | the table's text | `0.875rem` |
| `--pendo-table-cell-padding` | inside each cell | `var(--pendo-spacing-xs) var(--pendo-spacing-sm)` |
| `--pendo-table-border` | the line between two rows (the whole shorthand); the last row draws none | `1px solid var(--pendo-border)` |
| `--pendo-table-header-bg` | the header row's background | `rgba(0, 0, 0, 0.04)` |
| `--pendo-table-header-text` | the header row's text colour | `--pendo-text` |
| `--pendo-table-header-font-weight` | the header row's text weight | `600` |

### Theme accordions

The label row and the box of an item's body are in the item's shadow root, so a
theme rule on the authored tags cannot reach them. They are styled through the
shadow parts `label`, `icon` (also `icon-open` while the item is open) and
`content`, and themed through these properties:

| Property | Applies to | Default |
|----------|------------|---------|
| `--pendo-accordion-border` | the line between two items (the whole shorthand); the first shown item draws none | `1px solid var(--pendo-border)` |
| `--pendo-accordion-label-padding` | inside the label row | `var(--pendo-spacing-sm) var(--pendo-spacing-xs)` |
| `--pendo-accordion-label-text` | the label's text colour | `--pendo-text` |
| `--pendo-accordion-label-font-size` | the label's text size | `0.9375rem` |
| `--pendo-accordion-label-font-weight` | the label's text weight | `600` |
| `--pendo-accordion-body-padding` | around an open item's body | `0 var(--pendo-spacing-xs) var(--pendo-spacing-sm)` |

An item's body is a content region, so `--pendo-content-gap` and
`--pendo-divider-spacing` space its blocks too.

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
│   ├── pendo-columns.js
│   ├── pendo-table.js
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
