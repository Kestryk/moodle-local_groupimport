# Responsive

Responsive mixins provide common behaviour for Moodle plugins on tablets and
phones without forcing a single layout.

## Stack split views

```scss
.my-two-column-layout {
  @include easyedu.responsive-stack(56rem);
}
```

## Mobile action tray

```scss
.my-mobile-actions {
  @include easyedu.mobile-action-tray;
}

.my-mobile-actions__summary {
  @include easyedu.mobile-action-tray-summary;
}

.my-mobile-actions__buttons {
  @include easyedu.mobile-action-tray-buttons;

  .btn {
    @include easyedu.mobile-action-tray-button;
  }
}

@media (max-width: 35rem) {
  .my-mobile-actions {
    @include easyedu.mobile-action-tray-stacked;
  }
}
```

Use the action tray only for contextual actions that are currently available.
Avoid showing disabled actions on small screens.

The tray surface is constrained to the viewport width. In stacked mode, action
buttons wrap to a second row instead of creating horizontal scrolling, which is
safer for translated labels and dense Moodle action sets.

Use the shared compact action class inside an `easyedu-ui` ancestor:
`btn btn-sm foundation-selection-action foundation-selection-action--tray`,
plus the appropriate native semantic `btn-*` class. Its minimum height is
2.35rem; long labels may grow a row while preserving icon gap and horizontal
padding. Do not treat the minimum as a fixed height.

The current two-column usage catalogue covers two, three and four enabled
actions. Two occupy one row; three fill two rows with the last action stretching
across the second row; four occupy two complete rows. At 16px root, short-label
specimens measure about 84.4px / 128.72px including summary, gaps and frame.
These are reference measurements, not fixed CSS heights. Viewport/scrollbar
width, translated labels and safe areas remain adaptive.

Consumers resolve command eligibility from their native source controls and
selected entity type. Omit unavailable actions; do not invent a tray Details
command when only a card-specific Details control exists. Neither routing nor
membership semantics belong in the shared visual component.

Desktop selection feedback should use `sticky-selection-panel` from
`components/panels.md`. On touch screens, prefer this mobile tray and hide
duplicate desktop recovery actions so the interface has only one obvious action
area.

## Mobile cards and guide panel

```scss
.my-card {
  @include easyedu.mobile-card-density;
}

.my-guided-panel {
  @include easyedu.mobile-guided-panel;
}
```

On touch screens, selection and action trays should be treated as the primary
workflow. Drag/drop can remain available but should not be required.

Long-press context menus are intentionally plugin-owned JavaScript because each
plugin needs different conflict rules with drag/drop. Recommended behaviour:

- Do not start drag feedback before the long-press threshold has resolved.
- Keep the menu open after the finger is released so actions are selectable.
- Hide unavailable actions instead of presenting many disabled options.
- Keep the tray and guided checklist from overlapping each other.

When responsive changes move highlighted targets, dispatch the public guide
refresh event after the tray or menu finishes opening. See
`docs/components/orchestration.md` for the recommended hook map.

## Expected action tray structure

```html
<div class="my-mobile-actions" hidden>
  <div class="my-mobile-actions__summary">2 selected</div>
  <div class="my-mobile-actions__buttons">
    <button class="btn btn-sm btn-primary">Move</button>
    <button class="btn btn-sm btn-outline-danger">Delete</button>
  </div>
</div>
```

If another sticky surface is visible, such as a guided checklist, the plugin
should adjust vertical offsets or stack both surfaces rather than letting them
overlap.

## Entity switcher

Use a dedicated mobile switcher instead of relabelling desktop controls. This
keeps desktop state independent from responsive state.

```scss
.my-mobile-switcher {
  @include easyedu.mobile-entity-switcher;
}

.my-mobile-switcher__button {
  @include easyedu.mobile-entity-switcher-button;
}
```

Buttons expose `aria-pressed`. Keep one entity list visible at a time and clear
incompatible selections before switching.

The responsive state must not reuse or rewrite the desktop toggle values.
Remember each state independently for the lifetime of the page, restore the
desktop layout after crossing the breakpoint, and use a cancellable swap that
does not introduce an intermediate height or scroll jump.

## Card menu and context sheet

```scss
.my-card__menu {
  @include easyedu.mobile-card-menu-trigger;
}

.my-context-backdrop {
  @include easyedu.mobile-context-backdrop;
}

.my-context-menu.is-mobile-sheet {
  @include easyedu.mobile-context-sheet;
}
```

Use `mobile-context-sheet-header` and `mobile-context-sheet-list` for the two
internal regions. The explicit card button and long press must open the same
action resolver. Return focus after closing and support close button, backdrop
and Escape. The desktop context menu stays anchored near the pointer.

## Responsive filter disclosure

```scss
.my-mobile-filters {
  @include easyedu.mobile-filter-disclosure;
}
```

Keep primary search visible. Put secondary filters in the disclosure and show
reset only while at least one filter is active.

## Compact primary navigation

```scss
.my-plugin-nav {
  @include easyedu.mobile-primary-nav-rail;
}
```

Keep every destination in the DOM and expose the active destination with
`aria-current`. The rail scrolls horizontally without a visible scrollbar;
do not replace it with an active-item-only label. Interactive children retain
the shared 44 px touch target and must not wrap.

When the rail would compete with the workspace content, use the off-canvas
family instead:

```scss
.my-nav-trigger {
  @include easyedu.mobile-primary-nav-trigger;
}

.my-nav-panel {
  @include easyedu.mobile-primary-nav-panel;
}

.my-nav-backdrop {
  @include easyedu.mobile-primary-nav-backdrop;
}
```

The panel must expose every destination, mark the active item with
`aria-current`, close through its explicit close button, backdrop and Escape,
and return focus to the trigger. Do not use it to replace Moodle's native
course navigation.

Use `mobile-filter-disclosure-trigger` for the single button that opens a
secondary-filter panel. Do not reuse a card expand/collapse control: its rail,
fade and border treatments belong to entity cards and break filter layouts.
When an established desktop disclosure already exists, keep its HTML contract
unchanged and scope the compact presentation to the responsive breakpoint.
Do not replace a desktop wrapper with a native button globally: existing
visibility selectors may hide only its children and leave an empty browser-
styled control behind.

## Panel rails and action status

Use `mobile-panel-heading-spacing` for compact workspace headings and
`mobile-identity-rail-containment` on cards whose semantic left rail previously
used negative offsets. The latter keeps open, selected and focused cards inside
the viewport.

Use `mobile-action-status` on a real `role="status"` element with
`aria-live="polite"`. Toggle `hidden` and the owning workspace's `aria-busy`
from JavaScript. Position it above action trays through the mixin's `$bottom`
argument and retain a static status under reduced motion.

## States and accessibility

- Use `--easyedu-touch-target-min` for every tappable control; its default is
  `2.75rem` (44 px at the default root size).
- Preserve normal, hover, focus-visible, active/open and disabled states.
- A mobile context sheet needs a backdrop, explicit close button, Escape,
  focus return, safe-area padding and bounded internal scrolling.
- Long press must not emit drag feedback and the sheet must remain open after
  pointer release.
- Under reduced motion, state changes remain immediate and understandable.
- Hide duplicate desktop action rows when the mobile contextual tray is the
  active action surface.
- Reuse an existing card action trigger where one is already rendered. The
  visible trigger, long press and keyboard context action must share one action
  resolver; injecting a second trigger is a contract violation.
- If a legacy desktop trigger is hidden because its local dropdown has no
  items, the responsive layer may reveal that same trigger when the shared
  context-sheet resolver has available actions. Do not change its desktop
  visibility or revive the empty legacy dropdown.
- Dedicated mobile entity views must render their flat entity catalogue only.
  Hide desktop-only parent containers such as an ungrouped section rather than
  displaying the same objects through two simultaneous structures.
- Activating a flat mobile catalogue must restore both the DOM `hidden` state
  and its breakpoint display mode (`grid`, `flex` or `block`). Clearing only
  the `hidden` property is insufficient when the desktop base rule uses
  `display: none`.

## Preserved rails, complete navigation and sticky surfaces

Use `mobile-preserved-identity-rail` on compact cards that retain a semantic
left rail. The rail remains `1.28rem`; make room with a small list gutter and
card `max-width` rather than shrinking the icon-bearing identity treatment.

Use `mobile-navigation-guide-row` when a navigation-panel trigger and a guide
launcher share the compact header. The guide launcher stays outside the
off-canvas panel. Keep the panel header sticky, opaque and above its scrollable
sections so its close action cannot be covered by links during panel motion.
Inside the panel, use `mobile-navigation-section` to separate plugin tools from
links reconstructed from Moodle's native navigation. Preserve section labels,
real URLs, `aria-current`, focus trapping, Escape, backdrop and focus
restitution. The native desktop navigation must remain untouched.

The desktop action rail and compact drawer must be separate DOM regions. Hide
each region only inside its own breakpoint; never wrap desktop actions in a
class whose base contract is `display: none`. A shared guide launcher may move
between documented anchor slots, but must not be duplicated.

Mobile navigation destinations are action rows rather than browser-like text
links. Preserve `text-decoration: none`, the icon tile, a visible active state
and the kit focus ring for links, buttons and current-page labels alike.

## Compact card rhythm

Reserve one terminal action slot in compact card headers before absolutely
positioning a menu trigger. Identity content remains `minmax(0, 1fr)` and the
terminal action remains in the final grid column. Filters, top pagination and
the first card use one shared vertical gap; desktop list spacing is unaffected.

The card-menu primitive defines the touch target and interaction states, not a
mandatory glyph. Preserve a plugin's established semantic menu icon when it is
clear and consistently placed. Its resting glyph uses the primary action colour
so the affordance remains visible without hover. The button keeps a 44 px touch
target while its single direct child provides the smaller visual surface. Hover
and open states colour that inner surface only; keyboard focus remains visible
around the complete touch target. Do not add a persistent border, shadow or
gradient to this quiet action. Normalisation must be idempotent: never rewrite
the trigger's child markup on every MutationObserver pass.

## View-owned entity regions

Mark containers that belong to one compact workspace with an explicit data
contract such as `data-easyedu-mobile-entity-region="groups"`. Switchers may
hide that region in another workspace, but should leave its records in the DOM
when shared dialogs, destination lists or permission-aware actions still read
them. Do not infer ownership from DOM order or a translated heading.

Desktop and compact navigation must remain separate DOM regions. Introducing a
drawer must never reuse a `mobile-*` wrapper around established desktop actions;
each region is hidden only within its own breakpoint.

When switching from a desktop multi-panel mode to independent mobile entity
views, remove desktop-only focus classes before showing the mobile region.
Restore the saved desktop mode only when crossing back above the breakpoint.
Mobile-only filter controls must never be made visible by a desktop focus
selector.

Use `mobile-back-to-top` for the page-level return control. Show it only after
meaningful scrolling, honour safe areas and raise it above action trays or busy
status surfaces. Hide it while a modal or mobile context sheet is open. Smooth
scrolling must fall back to immediate scrolling under reduced motion.
Consumers may update `--easyedu-back-to-top-bottom` from measured sticky
surfaces; this is preferred to fixed offsets that break when a checklist grows.

Never override `[hidden]` with unconditional `display: block !important`.
Disclosure JavaScript owns height and visibility during expand/collapse; CSS
may choose the visible display mode only with `:not([hidden])`. Responsive
Reset controls appear only for an active filter scope and reset that scope
before closing its disclosure.
