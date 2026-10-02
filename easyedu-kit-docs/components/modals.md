# Modals

The opt-in Moodle message adapter sizes phone dialogs to their native body and
capped textarea, with a viewport maximum. Never combine a capped phone field
with a fixed-height dialog: this leaves an unexplained blank region above the
footer. Desktop sizing, async loading, focus trap and recipients remain native.

EasyEdu modals use Moodle-compatible markup with a shared visual shell.

## Neutral lookup tools and navigation layering

Include `dialog-classes` from `easyedu/dialog-classes`. On a plugin-owned fixed
modal root under `.easyedu-ui`, opt in with `easyedu-modal-layer`. The public
`--easyedu-modal-layer` defaults to the navigation-panel layer plus four
(1070 with the default panel at 1066). This orders the dialog above navigation,
not above every possible portal. The consumer must verify ancestor stacking
contexts; this class cannot escape a transformed or isolated low-level parent.
Native Moodle body portals retain their own root/focus owner.

For identifier lookup, use `easyedu-lookup-dialog` on the surface and
`easyedu-lookup-dialog__header`, `__body`, `__description` on its existing
children, plus `easyedu-modal-title` on the title. This composes the shared
neutral modal surface: white body/header, modal border/radius/shadow, a capped
34rem width, 16px title and 13px regular muted helper text. No destructive
confirmation tint, invented action footer or new close behaviour is added.
Keep native fields, rows, lookup announcements and entrance/exit Motion.
Penpot and browser evidence are separate gates; the compile fixture validates
public classes without emitting global `.modal` or product selectors.

The 0.4.54 source checkpoint is compile-validated, not a release or visual
acceptance. Paired Foundation Standard/Library publication, product linkage
and post-promotion browser proof remain pending until Penpot reconnects.

## Native message portal and action-dialog classes

Import `easyedu/adapters/moodle-message-dialog` and include its
`moodle-message-dialog` recipe only on the decorated native modal root. Apply
`easyedu-message-dialog__field` to the native textarea and `__field-wrap` to
its existing wrapper; decorate footer buttons with `easyedu-button` and use
`easyedu-button--secondary` on Cancel. The adapter owns chrome, Inter/modal
roles, Textarea M, compact actions, centred footer and narrow reflow.

Body-level portals do not inherit a consumer root's variables. Relay resolved
`--easyedu-*` theme variables and the resolved UI font from the workspace.
This runtime token bridge is not permission to add inline component paint.
Preserve native recipients, rows, labels, focus trap, async loading and events.
Opening/cancelling is proof of appearance, not proof of sending a message.

### Paired Foundations specimens (2026-10-02)

The adapter's native anatomy is now represented by linked components in
Foundations, not by a generic settings dialog with added To/Message labels:

- `EasyEdu / Modals / Native message portal / Desktop`, component
  `db59201c-3dd6-8004-8008-bab0f942bdc9`: 48rem wide, desktop example height
  34rem (768 x 544px canvas equivalence). Runtime height remains viewport-bound.
- `EasyEdu / Modals / Native message portal / Narrow`, component
  `db59201c-3dd6-8004-8008-bab0fa00d117`: 23.375rem wide at a 24.375rem viewport
  (374px shell at 390px); the example is 24.6875rem / 395px high. Runtime height
  fits content and can differ with viewport height, recipients or wrapping.
- Both use the existing linked Textarea M, a 1rem / 16px title, and the paired
  `EasyEdu / Buttons / Native portal compact` Primary/Secondary state families
  in 08.2 Standards and 08.2.1 Library. Default component IDs are
  `db59201c-3dd6-8004-8008-baad74eeb767` and
  `db59201c-3dd6-8004-8008-baad9e9d12b0` respectively.

Compact density represents the existing shared `foundation-button` recipe:
1.625rem / 26px minimum height, Inter .75rem / 12px at 700, .5rem / 8px radius,
.65rem / 10.4px inline padding plus border. It is not a scaled M button.
Default, Hover, Focus-visible, Disabled and Pressed are represented; Pressed
does not add an unimplemented scaling effect. Dialog instances retain linked
controls and override business labels only. Standards examples live beside
the Library sources in their proper pages; product examples inherit them.

These readbacks verify provider IDs, typography, centres and containment,
not pixel-perfect native chrome. Moodle's native close control/focus indicator
and the radial header highlight remain native/paint reconciliation points.
Sending, async failure, long recipient labels, RTL and forced-colors are not
certified by the focused open/cancel test. Human checklist remains open.

`easyedu/dialog-classes` exposes `dialog-classes`: `easyedu-dialog-actions`,
`easyedu-modal-title` and `easyedu-select` inside an `easyedu-ui` scope. The
select keeps its native options and keyboard behavior and reuses Text field M
paint/geometry. It is not a replacement custom dropdown controller.

Compilation fixture: `examples/compact-drag-and-message.scss`. Static check:
`powershell -File scripts/test-compact-portals-contract.ps1`. These checks do
not replace the consumer's authenticated desktop/mobile captures or paired
Penpot readbacks, and do not mark human acceptance.

### Native destination-action specimens (2026-10-02)

The existing regular `foundation-button` recipe now has its own paired
08.2 Standard / 08.2.1 Library family:
`EasyEdu / Buttons / Foundation action / Regular`, Primary and Secondary,
each Default/Hover/Focus-visible/Disabled/Pressed. Primary uses .88rem at
600, 2.35rem minimum height and .72rem radius. Secondary uses .75rem at 600,
2rem minimum height and .58rem radius. Both keep 1rem inline padding plus
border and the shared control-state transition. Width is intrinsic to the
label, not a fixed button token. Pressed adds no invented scale. All solid
surface, label and focus-border/ring paints use linked source palette roles.
Default IDs: `db59201c-3dd6-8004-8008-babe0d7923f8` and
`724138fb-4a17-80dc-8008-babe45e05c1b`; compact Message actions are unchanged.

09.2 Standard / 09.2.1 Library additionally expose neutral bounded shells:

- `EasyEdu / Modals / Native destination action / Desktop`,
  `d0b01e4e-5e95-8062-8008-babf5ad09eeb`: 42rem wide.
- `EasyEdu / Modals / Native destination action / Narrow`,
  `d0b01e4e-5e95-8062-8008-babf63999247`: measured 22.138671875rem
  at a 24.375rem viewport. This is native source equivalence, not a new
  fixed mobile-width token.

Both use a 1rem/700 title, .9375rem regular help/field label, linked Text
field M closed-select paint at 2.375rem high, and centred regular actions
with the existing .65rem gap. Do not add an eyebrow, header icon or custom
dropdown chevron to the native action anatomy. Options and keyboard/focus
behavior stay with the native select; OS-open decoration is not certified.

EasyStud owns participant/group help, destination labels/options, plural
button copy, the conditional unchecked Remove-from-origin checkbox and
no-destination states. Compose optional content in the product host without
detaching the shared shell. No destination hides label/select and disables
Move; do not manufacture course data to claim runtime coverage.

Source-equivalent heights, using 1rem = 16px only for the labelled canvas
reading: Desktop 16.125rem / 258px, or 18.4375rem / 295px with origin;
Narrow 17.53125rem / 280.5px, or 19.84375rem / 317.5px with origin.
They are measured examples; content, wrapping and viewport remain authoritative.
The 167px primary canvas lane rounds an intrinsic 166.4375px native label
measurement upward to avoid a two-line Penpot wrap; it is not a CSS minimum.

Six native open/cancel cases passed at 1600/390, including selected groups
already in a grouping. The two empty-destination product examples have
source/static/Penpot proof only. Regular ten-state Standard/Library fingerprints
match, and painted label centres differ by at most .5 canvas unit. Exact
native close chrome, shell border/shadow, origin-checkbox paint, all runtime
states, sending/moving commands, RTL and forced-colors remain open. These
specimens retain the canonical Kit modal chrome rather than silently copying
legacy consumer overrides. No SCSS/release pin changed in this documentation lot.

## Mixins

```scss
.my-modal {
  @include easyedu.modal-surface;
}

.my-modal-root {
  @include easyedu.modal-runtime-animation(".my-modal");
}

.my-native-modal-root {
  @include easyedu.modal-runtime-animation(".modal-dialog");
  @include easyedu.native-modal-loading(".loading-icon");
}

.my-modal__header {
  @include easyedu.modal-header;
}

.my-modal__icon {
  @include easyedu.modal-header-icon(var(--easyedu-group));
}

.my-modal__section {
  @include easyedu.modal-section;
}

.my-context-modal {
  @include easyedu.context-modal-surface;
  @include easyedu.context-modal-variant(success);
}

.my-preview-modal-content {
  @include easyedu.preview-modal-content-shell;
  @include easyedu.preview-modal-inline-rhythm;
}

.my-danger-modal {
  @include easyedu.destructive-confirmation-modal;
}

.my-move-modal {
  @include easyedu.move-destination-modal;
}
```

## Variants

- Detail modal: object identity, lists and native Moodle links.
- Settings modal: editable fields and filepicker sections.
- Confirmation modal: concise risk/action confirmation.
- Move/copy modal: destination list and option checkboxes.
- Moodle native bridge modal: decorate Moodle's `.modal-dialog` with a
  plugin-specific class, then apply `modal-runtime-animation()` on the native
  modal root so it opens with the same EasyEdu motion as custom modals.
  If the native body is still resolving, toggle an `is-loading` class and use
  `native-modal-loading()` to harmonise Moodle's `core/loading` template.
  When a Moodle native modal is created before it becomes visible, temporarily
  add `is-easyedu-animating` after it receives the visible state to replay the
  EasyEdu entrance motion.

`context-modal-surface` owns only the shared header/body/footer chrome. The
plugin keeps dimensions, internal grids, sticky regions and JS behaviour.
Available variants are `primary`, `success`, `warning` and `danger`. Custom
modal class names can be passed as the three selector arguments.

Do not import the gradient alone. A complete import includes the shared border,
body/footer surfaces and the semantic variant variables. Never change existing
modal ids or `data-*` hooks to adopt this visual shell.

`preview-modal-inline-rhythm` standardises the header, visible footer and body
start edge at `1rem`. It deliberately does not change body end padding: preview
editors may reserve a wider end rail for accordions and contextual actions.
Likewise, editors with their own internal scroll grid can keep the modal body at
zero padding and apply the same `1rem` token to that inner grid. Do not use this
mixin to rewrite sticky, overflow, crop, resize or preview geometry.

## Move/Copy Modal Structure

Use these optional class hooks inside move/copy modals:

```html
<p class="easyedu-modal__help">Choose where the selected items should go.</p>
<div class="easyedu-modal__destination">
  <label>Destination</label>
  <select class="form-select">...</select>
</div>
<label class="easyedu-modal__option">
  <input type="checkbox">
  <span>Remove from original location</span>
</label>
```

## Settings/detail modals

```scss
.my-settings-modal {
  @include easyedu.settings-modal-dialog;
  @include easyedu.modal-file-drop-state(".is-file-drag-over", var(--easyedu-primary));
}

.my-settings-modal__heading {
  @include easyedu.settings-modal-heading;
}

.my-settings-modal__field {
  @include easyedu.settings-modal-field;
}

.my-settings-modal__summary {
  @include easyedu.settings-modal-summary-grid;
}

.my-settings-modal__image {
  @include easyedu.image-preview;
}

.my-settings-modal__image-placeholder {
  @include easyedu.image-preview-placeholder;
}

.my-settings-modal__help {
  @include easyedu.settings-modal-help-icon;
}

.my-settings-modal__filepicker {
  @include easyedu.settings-modal-filepicker;
}

.my-settings-modal__list {
  @include easyedu.metadata-list;
}

.my-settings-modal__section {
  @include easyedu.metadata-section;
}

.my-settings-modal__section summary {
  @include easyedu.metadata-section-summary;
}

.my-settings-modal__section-scroll {
  @include easyedu.metadata-scroll-list;
}

.my-settings-modal__chip {
  @include easyedu.metadata-item-chip;
}

.my-settings-modal__empty {
  @include easyedu.metadata-empty;
}

.my-history-list {
  @include easyedu.history-list;
}

.my-history-list__main {
  @include easyedu.history-item-main;
}

.my-history-list__meta {
  @include easyedu.history-meta;
}

.my-history-list__rollback {
  @include easyedu.history-action;
}

.my-history-list__state--legacy {
  @include easyedu.history-state;
}

.my-history-list__state--complete {
  @include easyedu.history-state(success);
}
```

`metadata-section-summary` includes the shared `focus.ring(...)` treatment for
keyboard focus. Keep the summary as the complete interactive target; do not
move the ring onto a nested label, count badge or action icon. Consumer-owned
detail summaries with a different grid may reuse the same focus mixin directly
while retaining their own layout and disclosure motion.

Use these for group/layer/banner settings, participant/user details or any modal
that combines identity, editable fields, image preview and related item lists.

The filepicker primitive is intentionally visual only. The plugin remains
responsible for connecting Moodle's file API, validating accepted file types and
updating the displayed filename.

If the whole modal accepts image/file drops, combine `settings-modal-dialog`
with `modal-file-drop-state` and toggle the provided state class from plugin
JavaScript.

History actions remain real buttons and keep their semantic Bootstrap variant;
`history-action` only standardises compact geometry. Use `history-state` for
non-interactive status pills. Available state variants are `neutral`, `success`
and `warning`.

## Import Audit Checklist

Use this checklist before recreating a modal locally:

- The modal shell uses `modal-surface` or `settings-modal-dialog`.
- Runtime entrance/exit motion is applied through `modal-runtime-animation`,
  including Moodle native modal bridges.
- Moodle native loading states use `native-modal-loading` instead of the raw
  default spinner when the modal body resolves asynchronously.
- The header icon uses `modal-header-icon`; the icon must be centred both
  visually and by line-height.
- Close controls use `close-button`; do not leave raw `x` links.
- Field groups use `settings-modal-field` and short labels; longer Moodle help
  text belongs in a help icon/tooltip.
- Related-object lists use `metadata-section`, `metadata-scroll-list`,
  `metadata-item-chip` and `metadata-empty`.
- Image/file areas use `image-preview`, `image-preview-placeholder`,
  `settings-modal-filepicker` and `modal-file-drop-state`.
- The modal should fit inside the viewport without requiring the browser page to
  scroll; if content grows, reorganise into sections/lists before increasing
  size.

Plugin-owned responsibilities:

- Data loading, capability checks and Moodle API calls.
- File validation and file area persistence.
- Export actions for metadata lists.
- The exact field set for Moodle object settings.
