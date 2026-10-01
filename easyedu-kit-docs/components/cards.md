# Cards

## Experimental responsive tracks — not accepted

`person-card-responsive-tracks` is a WIP layout-only candidate. It changes
the compact responsive identity/email ratio to 1.6:1 without altering action
widths, breakpoints, height, content or motion. The first supervised 390px
comparison FAILED its minimum readability-gain check: name width increased
only from 37.453px to 42.25px. Do not deploy or treat this as a validated
Foundation recipe. Investigate badge/identity allocation before promotion.

## Source-preserving metadata API

Use `card-metadata`, `card-metadata-row`, `card-metadata-label`,
`card-metadata-values`, and `card-metadata-row-stacked` from the public Kit.
The stacked adapter belongs at the existing consumer mobile breakpoint.
Content, token overflow/disclosure and density visibility remain consumer-owned.
This extraction preserves current CSS; Penpot label-size differences are still
pending reconciliation. Evidence and command:
`docs/foundations-student-management.md` in the consuming plugin.

Cards represent user-manipulable objects: participants, groups, groupings,
layers, images, sources or any plugin-specific item.

## Mixins

`card-direct-action` implements the canonical transparent-rest Direct icon
family (1.85rem control, 0.95rem icon). Hover/focus/pressed/disabled are Kit-owned;
responsive visibility, action handlers and grid placement remain local. See
`docs/foundations-student-management.md` for source and live Penpot evidence.

### Student Management header extraction

The canonical Kit now owns `person-card-headline(detailed|compact)` with named
`identity`, `email` and `action` slots, and `selectable-card-header(regular|container)`
with reserved overlay-checkbox space. Use
`person-card-headline(detailed, $min-height: null)` for a selected compact card
that inherits its minimum header height. Preserve consumer-owned responsive
rules, action placement and existing motion. These are layout-only recipes,
not full card styling or a new behavior contract.

See the canonical Kit `docs/components/cards.md` for examples and the consumer
`docs/foundations-student-management.md` for exact scope and test evidence.
The `consumerSync.studentHeaderExtraction` manifest entry identifies this
uncommitted candidate separately from the previously pinned Kit commit.

```scss
.my-card {
  @include easyedu.object-card(var(--easyedu-group));
  @include easyedu.identity-rail(var(--easyedu-icon-group));
  @include easyedu.selectable-card(var(--easyedu-group));
  @include easyedu.drag-handle;
}

.my-card__reveal {
  @include easyedu.card-reveal-toggle;
}

.my-card__header {
  @include easyedu.card-title-row;
}

.my-card__identity {
  @include easyedu.card-title-main;
}

.my-card__title {
  @include easyedu.card-title(regular, var(--easyedu-group));
}

.my-card__context {
  @include easyedu.card-title-context;
}

.my-card__actions {
  @include easyedu.card-title-actions;
}

.my-card__selector {
  @include easyedu.card-selection-slot(overlay);
}

.my-container-card__disclosure {
  @include easyedu.card-disclosure-title;
}

.my-container-card__disclosure .fa {
  @include easyedu.card-disclosure-icon(var(--easyedu-grouping));
}

.my-container-card__disclosure[aria-expanded="true"] .fa {
  @include easyedu.card-disclosure-expanded-icon;
}

.my-card__preview-list {
  @include easyedu.preview-fade-list(
    4.2rem,
    36rem,
    var(--easyedu-surface-soft)
  );
}

.my-card__related-tags {
  @include easyedu.related-tags-inline;
}

.my-card__related-tags-summary {
  @include easyedu.related-tags-summary;
}

.my-card__related-tags-summary .fa {
  @include easyedu.related-tags-summary-icon;
}

.my-card.is-tags-expanded .my-card__related-tags-summary .fa {
  @include easyedu.related-tags-expanded-icon;
}

.my-card__related-tags-details {
  @include easyedu.related-tags-details;
}

.my-card__related-tags-details-list {
  @include easyedu.related-tags-details-list;
}

.my-container-card {
  @include easyedu.open-identity-rail-base(#f7fafc, #b7c5d1);

  &.is-expanded {
    @include easyedu.open-identity-rail-state(#f7fafc, #a9bac7, #a3b3c0);
  }
}
```

## Variants

- `object-card`: base card shell with identity border.
- `identity-rail`: icon embedded in the left identity rail.
- `selectable-card`: selected/aria-selected states.
- `expanded-card`: smooth expanded state foundation.
- `drag-handle`: swaps the identity icon for a drag handle on hover.
- `disabled-card`: compatible visual disabled state for non-target columns.
- `open-identity-rail-base` / `open-identity-rail-state`: turns the filled
  identity rail into a light outlined rail for opened container cards.
  The opened rail must replace the filled rail at the same width; do not offset
  it inward or draw an extra nested rail.
- `card-reveal-toggle`: quiet full-width chevron for revealing hidden card
  content such as members, related groups or advanced metadata.
- `preview-fade-list`: collapsed preview list with a smoke/fade ending and a
  smooth expanded state. Use it for members inside a group, groups inside a
  grouping, or any dense child list where the first items should remain visible.
- `related-tags-inline`: keeps related-object pills on one title line without
  pushing action buttons or count badges out of alignment.
- `related-tags-summary`: count/summary pill used when related tags are too long
  or too numerous to display inline.
- `related-tags-details` / `related-tags-details-list`: revealed row for the
  complete related-object list.
- `density-transition`: shared transition timing for cards that switch between
  compact and detailed density.
- `card-title-row`: stable two-column title line with a flexible identity slot
  and a terminal count/action slot.
- `card-title-main`: aligns the title and optional title-line context while
  preserving truncation.
- `card-title(compact|regular|container)`: semantic title densities for compact
  people/list cards, regular object cards and expandable container cards.
- `card-title-context`: optional secondary metadata that yields before the
  title or terminal actions are displaced.
- `card-title-actions`: non-wrapping terminal action group.
- `card-selection-slot(flow|overlay)`: aligns a selection control in the card
  layout without defining its checkbox appearance.
- `card-disclosure-title`, `card-disclosure-icon($color)` and
  `card-disclosure-expanded-icon`: accessible title button and explicit
  expanded-state rotation for expandable container cards. Pass the semantic
  entity colour when the default muted text colour does not identify the
  container clearly enough.

## Expected structure

```html
<article class="my-card" aria-selected="false">
  <header class="my-card__header">
    <div class="my-card__identity">
      <span class="my-card__title">Object name</span>
      <span class="my-card__context">Optional context</span>
    </div>
    <div class="my-card__actions">
      <span class="my-count">3 items</span>
      <button type="button" aria-label="Open actions">...</button>
    </div>
  </header>
  <ul class="my-card__preview-list has-extra-items" aria-expanded="false">
    <li>Visible child item</li>
    <li>Partially faded child item</li>
    <li>Hidden child item</li>
  </ul>
  <button class="my-card__reveal" type="button" aria-expanded="false">
    <span class="fa fa-chevron-down" aria-hidden="true"></span>
    <span class="visually-hidden">Show more items</span>
  </button>
  <div class="my-card__related-tags-details" hidden>
    <div class="my-card__related-tags-details-list">
      <span class="my-token">Grouping A</span>
      <span class="my-token">Grouping B</span>
    </div>
  </div>
</article>
```

Expandable container cards use a real disclosure button:

```html
<button
  class="my-container-card__disclosure"
  type="button"
  aria-expanded="false"
  aria-controls="my-container-card-content"
>
  <span class="fa fa-chevron-right" aria-hidden="true"></span>
  <span class="my-container-card__title">Container name</span>
</button>
```

Do not add a decorative chevron outside the button. The button owns keyboard
activation, focus, `aria-expanded` and the complete title interaction.
Apply `card-disclosure-expanded-icon` from the button's explicit
`[aria-expanded="true"]` selector; do not rely on an inferred ancestor state.

## Title density

- `compact`: repeated participant/person cards and very dense object lists.
- `regular`: groups, sources, layers and standard manipulable objects.
- `container`: expandable parent objects such as groupings or folders.

Density describes information hierarchy, not decoration. Do not select a
density only to make one card look different from its neighbours. Consumer
plugins may pass a semantic colour token to `card-title`, but should not
redefine font size, weight or truncation locally.

## Accessibility

Cards that are selectable should expose a real checkbox or button in addition to
visual selected state. Do not rely on drag/drop as the only interaction method.

Related-tag summaries must be real buttons with `aria-expanded` when they reveal
the complete tag list.

Preview lists must pair their visible transition state with a real reveal
button. Keep `aria-expanded` synchronized on the button and, when useful, on the
preview list itself.

## Import Audit Checklist

- Object cards use an identity rail token for their object type: participant,
  group, grouping, layer, source or another plugin-owned identity.
- The identity icon sits inside the rail; drag handles may replace it on hover
  only when the object is actually draggable.
- Selected/focus states darken the identity colour consistently and do not
  depend only on checkbox colour.
- Open container cards use `open-identity-rail-base` and
  `open-identity-rail-state`; do not duplicate a second rail inside the card.
- Long related-object labels collapse into a summary pill before they push
  count badges or action buttons onto a new line.
- Related-tag summary buttons expose `aria-expanded` and reveal the full tag row
  in `related-tags-details`.
- Child previews with a fade use `preview-fade-list` plus
  `card-reveal-toggle`; avoid implementing a one-off white gradient that breaks
  on themed cards.
- Dense/compact-to-full card transitions use `density-transition`; plugins own
  which data becomes visible in each density.
- Card titles use the shared density matching their role. Plugins do not create
  local font scales or weights for participant, object and container titles.
- Count badges and actions stay in `card-title-actions`; optional context yields
  before it can push those controls onto another line.
- Expandable title lines use one native button with `aria-expanded` and
  `aria-controls`; the chevron is not a separate action.
- Selection controls use `card-selection-slot` together with the form
  `selection-checkbox(..., card)` variant.
- Overlay selectors reserve the complete checkbox hit target plus a visible
  title gap. Align the visual square with the title line, not with the total
  height of an expanded card.
- Overlay selectors explicitly use `grid-area: auto`; they must never create an
  implicit `selection` row at the bottom of a CSS Grid card.
- Drag/drop disabled states use `disabled-card` or overlay primitives; do not
  make selectable checkboxes look disabled when the current selection type is
  still allowed.

Plugin-owned details:

- Exact domain layout inside the card body.
- Business rules for drag/drop compatibility.
- Pagination/filtering that decides which cards are visible.
- Context menu commands and permission checks.
## Non-draggable container hover

Use `non-draggable-card-hover` for selectable containers such as groupings that
need pointer feedback but cannot be dragged. Apply it only inside
`(hover: hover) and (pointer: fine)`, keep the default cursor, and suppress the
translation under `prefers-reduced-motion`.

## Terminal actions and expanding details

When a card header contains a persistent action such as a details button,
reserve a terminal action slot and keep it anchored to the card. Expanding
metadata must grow below the header and must not recalculate the action's
horizontal or vertical position. Keep the identity region `minmax(0, 1fr)` and
truncate or wrap its optional metadata before moving the terminal action.
