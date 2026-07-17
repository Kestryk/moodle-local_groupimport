# Cards

Cards represent user-manipulable objects: participants, groups, groupings,
layers, images, sources or any plugin-specific item.

## Mixins

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

## Expected structure

```html
<article class="my-card" aria-selected="false">
  <header class="my-card__header">
    <span class="my-card__title">Object name</span>
    <span class="my-card__related-tags">
      <button class="my-card__related-tags-summary" type="button">
        <span>2 groupings</span>
        <span class="fa fa-chevron-down" aria-hidden="true"></span>
      </button>
    </span>
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
