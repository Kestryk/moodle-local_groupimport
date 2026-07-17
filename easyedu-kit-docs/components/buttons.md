# Buttons

Button mixins complement Moodle/Bootstrap classes rather than replacing them.
The plugin should keep semantic Bootstrap classes such as `btn`,
`btn-primary`, `btn-outline-secondary` or `btn-outline-danger`, then add an
EasyEdu mixin on the plugin-specific selector to align spacing, icons and
states.

## Mixins

```scss
.my-action {
  @include easyedu.action-button;
}

.my-action--small {
  @include easyedu.action-button(small);
}

.my-action--large {
  @include easyedu.action-button(large);
}

.my-icon-action {
  @include easyedu.icon-button;
}

.my-close {
  @include easyedu.close-button;
}

.my-more {
  @include easyedu.overflow-button;
}

.my-compact-actions {
  @include easyedu.action-menu-trigger;
}

.my-compact-actions__icon {
  @include easyedu.action-menu-trigger-icon;
}

.my-admin-nav {
  @include easyedu.admin-primary-nav;
}

.my-admin-nav__action {
  @include easyedu.admin-primary-nav-action;
}

.my-admin-nav__format {
  @include easyedu.admin-primary-nav-action(format);
}

.my-admin-nav__danger {
  @include easyedu.admin-primary-nav-action(destructive);
}

.my-admin-secondary-actions {
  @include easyedu.admin-secondary-actions;
}

.my-admin-secondary-action {
  @include easyedu.admin-secondary-action;
}

.my-admin-form-actions {
  @include easyedu.admin-form-actions;
}
```

## Sizes

Use the same size names across buttons, menus and form controls.

| Size | Intended usage |
| --- | --- |
| `small` | Dense cards, compact filter rows, overflow menu triggers and responsive trays. |
| `regular` | Default toolbar actions, create buttons and modal footer buttons. |
| `large` | Prominent onboarding, guide entry points or hero actions. |

Avoid hard-coding widths per plugin. Prefer the mixin size first, then adjust
only the container layout if translated labels need more room.

## States

The reusable state contract is:

- `:hover` and `:focus-visible` share the same visual intent.
- `[aria-expanded="true"]`, `[aria-pressed="true"]`, `.active` and `.is-active`
  represent a selected/open action.
- `:disabled`, `[aria-disabled="true"]` and `.disabled` must look unavailable
  and should not receive pointer events.
- Busy/loading states are plugin-owned, but should keep button dimensions
  stable and pair with the kit busy indicators where possible.

```html
<button class="btn btn-outline-secondary my-action" type="button">
  <span class="fa fa-arrow-right" aria-hidden="true"></span>
  <span>Move item(s)</span>
</button>
```

## Compact Action Menu Trigger

Use `action-menu-trigger` when an action row or a dense card cannot display all
actions without wrapping. The visual convention is a small three-line trigger,
not an ellipsis, so users read it as "more actions for this object" rather than
hidden text.

The trigger intentionally borrows the compact, rounded feeling of EasyEdu
labels/chips: it should feel like a lightweight affordance inside an action row,
not a heavy primary button.

```html
<button class="my-compact-actions" type="button" aria-expanded="false">
  <span class="my-compact-actions__icon" aria-hidden="true"></span>
  <span class="visually-hidden">More actions</span>
</button>
```

## Admin Primary Navigation

Use `admin-primary-nav` for important plugin-level administration navigation:
view switchers, format/settings entry points, import/export links, and one
optional guide launcher. This is the right component for the first action row at
the top of an admin page; do not style those controls as isolated dashed buttons.

The guide wrapper should sit inside the same container, before the navigation
actions. When the guide must remain at the far left while the menu itself is
centred against the complete rail, add
`.easyedu-admin-primary-nav--balanced` to the rail and wrap the menu actions in
`.easyedu-admin-primary-nav__actions`. This is the canonical EasyStud/CCB
layout. The mirrored grid track on the right balances the guide without empty
HTML or plugin-local offsets.

The legacy direct-child form remains supported: a direct `.easyedu-guide`
child is anchored at the far left with `margin-right: auto`. Use it only where
the action group does not need mathematically exact centring. A custom fallback
guide button may use `.easyedu-admin-primary-nav__guide`.

The launcher keeps its own `guide-launcher-button` styling. Do not apply
`admin-primary-nav-action` to `.easyedu-guide__launcher` and do not add
plugin-local margins to reposition it.

The component is a compact non-wrapping navigation rail. Labels must stay on one
line; the container scrolls horizontally when the viewport is too narrow.

```html
<div class="my-admin-nav easyedu-admin-primary-nav--balanced">
  <div class="easyedu-guide">
    <button class="easyedu-guide__launcher" type="button">
      <span class="easyedu-guide__launcher-icon">
        <span class="fa fa-compass" aria-hidden="true"></span>
      </span>
      <span class="easyedu-guide__launcher-label">Open guide</span>
    </button>
  </div>
  <div class="easyedu-admin-primary-nav__actions">
    <a class="btn btn-outline-secondary my-admin-nav__action active" aria-current="page" href="#">Banners</a>
    <a class="btn btn-outline-secondary my-admin-nav__action" href="#">Slideshow</a>
    <button class="btn btn-outline-secondary my-admin-nav__format" type="button">Format</button>
    <button class="btn btn-outline-danger my-admin-nav__danger" type="button">Delete settings</button>
  </div>
</div>
```

The action wrapper is required for balanced centring. On narrow screens the
rail automatically returns to a start-aligned horizontal scroller so the guide
and every action remain reachable.

Fallback guide button:

```html
<div class="my-admin-nav easyedu-admin-primary-nav--balanced">
  <button class="easyedu-admin-primary-nav__guide" type="button">
    <span class="easyedu-guide__launcher-icon">
      <span class="fa fa-compass" aria-hidden="true"></span>
    </span>
    <span class="easyedu-guide__launcher-label">Open guide</span>
  </button>
  <div class="easyedu-admin-primary-nav__actions">...</div>
</div>
```

Rules:

- Use `active`, `.is-active`, `[aria-current="page"]` or `[aria-pressed="true"]`
  for the current view.
- Use the `format` variant for format/settings modal entry points.
- Use the `destructive` variant for reset/delete plugin-level actions.
- Keep this as one responsive rail; never let nav button text wrap onto two
  lines.
- Use the balanced modifier and action wrapper when a guide sits beside a menu
  whose visual centre must match the page centre.

## Admin Secondary Actions

Use `admin-secondary-actions` for contextual action groups inside a view, such
as enable/disable toggles, edit-title actions, or status controls. These buttons
are deliberately rounder and calmer so users can distinguish actions from
navigation.

## Admin Form Actions And Spacing

Use `admin-form-actions` on the final Moodle settings action row. It creates a
clear separation from the final setting, provides a stable gap between actions,
and right-aligns Save/Cancel controls on desktop. This follows Moodle's normal
form completion flow; centre alignment is reserved for single-purpose welcome,
empty-state or onboarding actions. On compact screens the primary action may
use the available width.

Every button containing both an icon and a label must use `inline-flex` (or the
kit `action-button` mixin) with an explicit gap. Do not use an icon immediately
followed by raw text and do not rely on a glyph's intrinsic whitespace. The
`action-button` contract reserves a stable `1em` icon slot and uses
`--easyedu-action-icon-gap` so narrow Font Awesome glyphs cannot collapse the
visual gap before the label. Do not reduce that gap locally for file/export or
destructive actions, whose glyphs are visually dense.

## Usage Guide

- Primary validation/save: keep Moodle `btn btn-primary`, add
  `action-button(regular)`.
- Final Moodle settings row: use `admin-form-actions`; do not attach the row to
  the preceding setting and do not centre Save by default.
- Secondary/cancel: keep `btn btn-outline-secondary`, add
  `action-button(regular)`.
- Destructive action: keep `btn btn-outline-danger`, add
  `action-button(regular)` and use explicit wording.
- Square icon action: use `icon-button`, always include an accessible label.
- Dense overflow trigger: use `action-menu-trigger(small)` with
  `action-menu-trigger-icon`.
- Modal close action: use `close-button`; do not leave a raw `x` link.
- Admin view switchers: use `admin-primary-nav` and
  `admin-primary-nav-action`; never let labels wrap onto two lines.
- Status/action rows inside an admin view: use `admin-secondary-actions` and
  `admin-secondary-action`.

## Disabled Actions

Disabled buttons should remain visually understandable but clearly unavailable.
On small screens, prefer hiding unavailable contextual actions rather than
showing many disabled buttons.

## Responsive card action trigger

Use `mobile-card-menu-trigger` for the explicit menu button on compact cards.
It is not a replacement for desktop card actions: expose it only in the
responsive workspace and route it to the same action resolver as long press.

- Keep the target at least `--easyedu-touch-target-min` in both dimensions.
- Use `aria-haspopup="menu"` and update `aria-expanded` while the sheet is open.
- Normal remains quiet; hover, focus-visible and open states share the primary
  soft surface. Disabled controls use the native `disabled` attribute.
- Plugins may change the icon, but must not reduce the target or remove the
  accessible label.

## Import Audit Checklist

Before accepting a plugin-local button style, check:

- The button keeps Moodle/Bootstrap semantics (`btn`, `btn-primary`,
  `btn-outline-*`) and adds the EasyEdu mixin as the visual layer.
- Icon and text are vertically centred in every state and translated labels do
  not collapse the hit area.
- Icon and text have an explicit component-owned gap; visual whitespace inside
  an icon font is never treated as spacing.
- `small`, `regular` and `large` variants are chosen from the kit, not by
  hard-coded local heights.
- Focus-visible is at least as visible as hover and never clips under adjacent
  filter boxes, cards or modal sections.
- The close button is a styled button, never a raw `x` link.
- The guide launcher and "Show in the interface" button use the guide contract,
  not a one-off local button style.
- The guide launcher is never restyled as a standard admin nav action.
- The guide remains anchored at the start edge; with the balanced structure,
  only `.easyedu-admin-primary-nav__actions` is centred.
- Compact overflow action rows use `action-menu-trigger` and
  `action-menu-trigger-icon`.
- Plugin-level admin navigation uses `admin-primary-nav`; do not invent local
  dashed or floating top navigation buttons.

## Errors To Avoid

- Do not replace Moodle button classes entirely; the kit is a visual layer, not
  a semantic button framework.
- Do not use native browser `title` tooltips on buttons that already have an
  EasyEdu hover-help bubble.
- Do not duplicate hidden overflow actions in the visible row on responsive
  screens.
- Do not put raw icon-only buttons in modals without `aria-label`.
- Do not create local "pretty" admin nav buttons outside the kit contract.
