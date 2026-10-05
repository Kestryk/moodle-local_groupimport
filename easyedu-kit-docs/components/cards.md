# Cards

## Responsive participant membership visibility (consumer contract)

EasyStud SM-50 keeps existing card paint, identity type, metadata and Motion
recipes. A responsive consumer may opt only its Groups/Groupings rows into
membership visibility; roles/profile rows remain untouched. This is not the
desktop Compact list mode and not a Grouping-card expansion variant. The
consumer owns its breakpoint, initial mode, selection and localized action.

Use the existing identity title role (14px/700, `#264861` default in the Kit),
fixed header track, checkbox and direct Eye/More actions. Animate actual card
height changes through existing resize Motion, whole-list mode through swap;
no-op refreshes must not measure/restart animations. Respect reduced/disabled
Motion and preserve independent desktop preference across breakpoints.

Product page 03 now has zero/one/two/manual-full usage compositions and mobile/
tablet successors, with recoverable prior shells and no product-local masters.
This documentation-only update adds no SCSS, source version, style or animation
family. Paired provider title legacy overrides, native containment/behavior and
human acceptance remain independent checks, not a blanket completed-card claim.

## Fixed selection header anchor (0.4.110 source candidate)

`card-selection-header-anchor($block-start: 0.3rem)` opts the existing overlay
slot into a fixed header track, removing card-height translation. It owns no
inline lane, checkbox paint/size, breakpoint or Motion. Bind measured desktop
density states only. Preserve narrow responsive recipes and title clearance.
Paired Foundations/EasyStud publication and served native successor remain
pending; source presence is not whole-card/mobile or human acceptance.

## Source-preserving identity surfaces

`identity-card-paint($kind, $state: rest)` centralises twelve existing painted
states from EasyStud source checkpoint `6f5871a`. Kinds describe reusable
anatomy: `person` and `object` provide rest/hover/selected; `container` provides
rest/expanded/selected/expanded-selected; `unassigned` provides rest/expanded.
It emits paint declarations only, with no DOM, dimensions or Motion rewrite.
Consumers retain identity rail/selected-surface tokens and native predicates.
Focus remains `card-focus-context` on the correct owning selector: focusing
a nested child must not repaint its parent. Selected+expanded+focused ordering
must remain native. This is incremental extraction, not whole-card migration.

EasyStud's `test-student-card-surface-contract.ps1` verifies canonical copies
and can compare all emitted selector/property value sequences against an
extraction baseline. The 2026-10-03 extraction preserved 12,973 sequences.
This proves compiled equivalence, not a new browser or human visual PASS.

## Identity and related-person typography

Foundations shell main `2b5216d9-06a9-80a1-8008-9cf47759bd2b` measures
14px/700, #16324f. `card-title` uses this one identity size for compact,
regular and container shells; density is not a second font scale. Consumers
bind the shared `--easyedu-card-identity-title-color`; semantic identity colour
remains on rails and badges. Keep all existing header tracks and Motion.

`related-person-name` is the subordinate member role: Inter, 13px/600,
`--easyedu-related-person-name-color` (`#49657a` by default), line-height 1.35.
It is intentionally quieter than the `#264861` card identity title while
remaining stronger than tertiary metadata. Foundations existing Member-row main
`2a31d374-d2a1-80fd-8008-ac477de8f7f0` is reused, not duplicated. Apply
the role to participant names inside groups, without changing their contents,
selection/removal behavior or disclosure. Paired Library/Standard/Composition
labels were updated on 2026-10-01; product propagation and browser proof are
separate gates.

## Related-person row ownership (source-preserving)

`related-person-row`, `related-person-selection-slot`,
`related-person-name-layout` and `related-person-remove` centralize the existing
EasyStud member-row skin. Compose the name layout with `related-person-name`:

```scss
.member { @include easyedu.related-person-row; }
.member > .selector { @include easyedu.related-person-selection-slot; }
.member__name {
  @include easyedu.related-person-name;
  @include easyedu.related-person-name-layout;
}
.member__remove { @include easyedu.related-person-remove; }
```

The row keeps its 2.25rem minimum, 0.25rem/0.45rem padding and 0.5rem gap.
The selection slot keeps the existing card-checkbox recipe; removal is a
1.45rem square with the existing hover, native focus and keyboard ring.
The `span` inside the named removal button carries the existing minus glyph;
this extraction does not replace it with an SVG or change its command.
The literal row/removal paints are documented source component constants,
not additional semantic tokens. Run
`scripts/test-related-person-row-contract.ps1` through the public Sass API.

Consumer adapters must emit identical complete CSS with the same Sass version.
Responsive density, member extras/fades, selection routing, accessible names,
permissions and disclosure Motion remain consumer-owned. No global CSS class,
new animation, 44px touch-target claim or density normalization is introduced.
Foundations' existing 52px Member-row specimen and its 32px removal surface
remain distinct from the native EasyStud density/action size. Paired design
alignment and pending whole-card exports must be resolved before claiming
pixel parity; ownership extraction is not design acceptance.

## Narrow participant investigation (not adopted)

Selection-inclusive comparison `easystud-authenticated-20261001T180425356Z-36668`
passes the four-width geometry gates, selected 320px readability, unchanged
selection transition declarations and restoration of compact height. This is
still experimental: paired Penpot publication/acceptance remain pending.

The readable adapter also covers selected compact cards unless the product
enters its dedicated single-participant detailed density. Selection must not
restore the rejected narrow name/email lanes. `person-card-narrow-readable-name`
keeps block ellipsis and aligns its line box with the action height. Never use
flex display just to centre a truncating text node. These recipes remain unused.

A separate experimental readable-density fixture stacks name/badge and lets
email span both headline columns below. At 320px: name 66.75px, email 103.53px,
card height 93.125px. Checkbox/name/eye centres align; neither 44px selection/
menu targets nor existing Motion are reduced. Supervised comparison passes
320/390/768/1600, preserving wider card-local geometry and all text contents.
This remains **not adopted**: publish paired Foundation/Product specimens and
obtain visual acceptance for the taller endpoint before embedding. The failed
first fixture is retained separately.

The diagnostic adapter keeps a numeric 6rem compact maximum, not `none`,
so a future density collapse retains an interpolable endpoint. Normal-motion
selection/disclosure behavior still needs its dedicated regression before
adoption: endpoint geometry alone is not animation acceptance.

Final numeric-endpoint comparison:
`easystud-authenticated-20261001T174755379Z-44640` passes all four widths.

At 320px the established compact row with primary badge leaves only 20.52px
for the sampled name. The opt-in `person-card-narrow-tracks` fixture moves
email below identity without changing font or Motion. Temporary comparison
failed: name becomes 34.20px and email 66.75px, below 50/80px gates; card grows
45.97 -> 52.80px. This is not a validated narrow control or consumer recipe.
Do not deploy it before reworking identity/badge/action-slot allocation and
publishing paired Foundation specimens. The existing 3:1 layout stays active.

## Responsive name-priority tracks

`person-card-responsive-tracks` gives the compact responsive identity/email
lanes a 3:1 ratio while preserving action width, breakpoints, height, content
and motion. At 390px the sampled name with badge grows from 37.453px to
54.547px; email remains 32.391px and the eye stays in place. A temporary
browser comparison passed and its screenshot was inspected. This improves
truncation; it does not guarantee every long name/email fits in a single row.
The earlier 1.6:1 experiment failed. Foundations source documentation and
human review of this new ratio remain pending.

Cards represent user-manipulable objects: participants, groups, groupings,
layers, images, sources or any plugin-specific item.

## Mixins

### Card metadata (source-preserving extraction)

`card-metadata`, `card-metadata-row`, `card-metadata-label` and
`card-metadata-values` centralize the existing participant metadata grid.
Use `card-metadata-row-stacked` on the same row at the consumer's existing
mobile breakpoint. The default label lane is 5.25rem; values wrap in the
remaining space. Label typography remains 0.67rem/700 with 0.06em tracking.

```scss
.person__meta { @include easyedu.card-metadata; }
.person__meta-row { @include easyedu.card-metadata-row; }
.person__meta-label { @include easyedu.card-metadata-label; }
.person__meta-values { @include easyedu.card-metadata-values; }
// Inside the consumer's existing mobile media query:
.person__meta-row { @include easyedu.card-metadata-row-stacked; }
```

Roles, groups, groupings and custom-field content, token semantics, hidden
extras, the show-more control and density visibility remain consumer-owned.
These recipes add no clipping, animation, breakpoint or global CSS class.
The 2026-10-01 active detailed EasyStud specimens now use the same 0.67rem
label, 0.06em tracking, #627387 paint and 5.25rem lane, with a 0.55rem gap
before values. Five product cards and the paired Foundation Detailed
Participant Library/Standard specimens were reconciled. Compact mobile
selection remains compact; hidden archives were not migrated. Readback passes,
but the full Foundation card export timed out; visual closure is not inferred
from geometry alone. Preserve this distinction before promoting the tranche.

### Direct card actions

Moodle can load `.btn:hover` and `.btn:focus-visible` after plugin styles.
The shared recipe emits both the plain selector and its `.btn` composition
so these host rules cannot erase the canonical hover/focus paint. Consumers
must not repair this with local specificity or `!important`.

`card-direct-action` owns the Foundations Direct icon recipe (Library main
`10fc9fee-0b8e-807e-8008-98ead919bfd2`, read through the connected library on
2026-09-30). Its border-box is 1.85rem square, the icon slot 0.95rem, with a
transparent rest surface and border. Hover uses #f7fbff/#bdd0e5; pressed uses
#eaf4ff/#b8d5ef. Keyboard focus uses the shared focus ring. Disabled uses
#f0f4f8/#d7e1ea/#9aa9b8 at full opacity, matching this specific specimen.
The optional `--easyedu-card-action-*` custom properties override these paints.
Primary and strong icon colours use existing shared tokens.

```scss
.person__details { @include easyedu.card-direct-action; grid-area: action; }
.object__search { @include easyedu.card-direct-action; }
```

Use a real named button and preserve the existing click handler. `aria-disabled`
is paint only: the consumer remains responsible for preventing activation.
Do not use this desktop action as a replacement for the existing 2.75rem touch
overflow trigger. The recipe owns neither visibility, grid placement nor motion.
No filled circle appears at rest. Font icons keep their native glyph proportions
inside the centred slot; this is not a claim of SVG/Font Awesome glyph parity.

### Source-preserving Student Management headers

`person-card-headline(detailed|compact)` composes the existing `identity`,
`email` and `action` grid slots. The detailed variant puts secondary metadata
below the identity; compact keeps it between identity and the terminal action.
Use `person-card-headline(detailed, $min-height: null)` when a selected compact
card inherits its header minimum from its base rule. Keep the action in its
named slot; do not position it against the expanding body.

`selectable-card-header(regular|container)` reserves the established checkbox
space for an object or expandable container header. These recipes do not own
paint, contents, responsive breakpoints, action visibility, menus or motion.
They intentionally preserve the existing physical left inset during this
extraction; this is not a claim of new RTL coverage. The existing
`card-title-row` remains appropriate for two-slot generic cards.

```scss
.person__headline { @include easyedu.person-card-headline; }
.compact .person__headline { @include easyedu.person-card-headline(compact); }
.compact .person.is-selected .person__headline {
  @include easyedu.person-card-headline(detailed, $min-height: null);
}
.group__header { @include easyedu.selectable-card-header; }
.container__header { @include easyedu.selectable-card-header(container); }
```

Run `./scripts/test-card-header-contract.ps1` to compile all five variants via
the public Sass entry point. Consumer geometry extraction must also compare the
complete compiled stylesheet before/after, using the same Sass version.
Header recipes must not add clipping or modify disclosure/density animations.

### Object-card primitives

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

.my-card:focus-within {
  @include easyedu.card-focus-context(var(--easyedu-card-shadow));
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
- `card-focus-context($base-shadow)`: contained `:focus-within` context for an
  identity-rail or dense card. It preserves the card elevation without
  extending a halo into the leading rail/gutter; the focused child keeps the
  normal outer `focus.ring`.
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

## Responsive layout integrity

Cards must keep separate zones for primary content, secondary metadata and
actions. An action must never overlap the title, hide metadata, shrink the
intended touch target or create unmanaged horizontal overflow.

Prefer explicit layout contracts:

- use Grid or Flex with `minmax(0, 1fr)` for the content zone;
- reserve terminal action zones before positioning actions;
- make secondary metadata yield through ellipsis, wrapping or summary pills;
- move dense secondary information into a details row or disclosure at narrow
  breakpoints.

Removing visible information is a last resort. If a plugin hides a value on
small screens, the value must remain available through a documented alternate
path such as details, a disclosure, modal, tooltip or contextual action.

This rule is a design contract, not a new primitive. Do not create a one-off
mixin for a single EasyStud case; promote a primitive only when the same layout
pressure appears in several consumers.

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
- Responsive cards preserve distinct content, metadata and action zones; they
  reorganize or summarize content before actions can overlap or reduce touch
  targets.
- A card `:focus-within` treatment is contextual only. Use
  `card-focus-context` where an external parent halo would collide with a
  rail/gutter, and retain the ordinary outer focus ring on the child control.
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

### Direct and overflow actions

`card-direct-action` owns the shared Direct icon states. Use
`card-overflow-trigger` for the existing desktop Overflow trigger: 1.85rem
square, 0.88rem glyph and 0.4rem radius. It reproduces the source desktop
declarations; it is not the raised `action-menu-trigger` toolbar family.
Foundations main `16efa6a5-be95-808f-8008-98eb972325be` and product Grouping
more/Bulk more instances preserve this compact geometry.

Compose the existing `mobile-card-menu-trigger` at responsive breakpoints;
retain its 44px touch target, centred 29.12px visual surface and Motion.
Consumers own placement, disclosure, focus restoration, command routing and
permission checks. Never shrink the hit target to the visible glyph. This
ownership extraction requires exact full consumer CSS equality, not only a
successful Sass build; no new animation or Penpot variant is introduced.

When a card header contains a persistent action such as a details button,
reserve a terminal action slot and keep it anchored to the card. Expanding
metadata must grow below the header and must not recalculate the action's
horizontal or vertical position. Keep the identity region `minmax(0, 1fr)` and
truncate or wrap its optional metadata before moving the terminal action.
