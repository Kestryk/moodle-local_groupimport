# Modals

## Entity-field Penpot catalogue (2026-10-03)

Foundations publishes twelve linked Regular/Narrow resting specimens at
`08.4` Standard host `a301101d-ddc2-807b-8008-bb6dd6dc6194` and
`08.4.1` Library host `a301101d-ddc2-807b-8008-bb6b608ca7c5`.
Detail, optional empty detail, readonly count/empty, editable and textarea
use the opt-in `_entity-fields.scss` recipes; generic Text-field masters
and other consumers are unchanged. Recursive fingerprints, all four radii,
painted text containment and provider links match for all twelve pairs.

Caption, value and editing roles are Inter 12.16/600/#62788E,
14.08/400/#263B4F and 13.76/400 respectively; readonly empty uses #8A9BAD.
Widths 378/324 illustrate density, not a fixed native responsive grid.
Textarea rows/height and optional empty detail are composition examples,
not changed native data or field sizing. Source focus #86B7E0 remains an
explicit legacy exception to the general #8ABCE3 palette; no all-state claim.

EasyStud page 04 consumes seventeen linked fields in Participant/Group/Grouping.
Its `docs/testing/student-entity-fields-penpot-2026-10-03.json` records exact
providers, painted bounds, recoverable originals and external captures.
Product raster export failed; editor viewport captures were inspected without
reloading or closing an unsaved tab. This resolves the caption palette for
these specimens only, not metadata-list publication or human acceptance.

## Source-preserving entity metadata (2026-10-03)

`components/_entity-metadata.scss` is an opt-in presentation API for native
details/settings. The settings and readonly-detail recipes are intentionally
distinct: they retain their accepted density, count limits and scroll height.
Generic `metadata-*` defaults remain compatible with other consumers.

Use the `entity-metadata-*` title/count/count-label/chevron/scroll/primary/meta/
chip/semantic recipes for settings lists. `entity-detail-list-*` provides the
readonly list surface, summary, summary end, scroll content and empty state;
`entity-detail-description-*` retains the separate description disclosure.
Semantic roles are `members`, `roles`, `groups` and `groupings`; invalid roles
fail compilation. They do not change entity eligibility or business meaning.

Consumers retain selectors, native summary/ul/li/table markup, counts, conditional
fields, localized values, export handlers, hidden CSV tables, responsive grids
and disclosure predicates/controller. The complete summary owns focus. Keep
surface overflow visible and clipping on the nested scroll region. Existing
chevron timing is transferred unchanged, while reduced-motion/state rotation
remain in their original consumer adapters.

Compile `examples/entity-metadata.scss` and run
`scripts/test-entity-metadata-contract.ps1`. Extraction requires exact emitted
consumer CSS identity, not only a compile PASS. This is not a class-only body
or a new Penpot/human visual acceptance. Legacy 650/720/760 weights and the
uppercase CSV header are preserved pending source-backed visual reconciliation.

## Source-preserving entity fields (2026-10-03)

The opt-in `components/_entity-fields.scss` API centralises the existing
detail/settings recipes without changing the legacy `settings-modal-field`.
Use `entity-settings-field` for editable fields, `entity-readonly-field` for
the readonly modifier and `entity-detail-field` for metadata. Shared
`entity-field-caption($inline: false)` and `entity-field-value($empty-state:
false)` retain quiet sentence-case labels and regular values.

Consumers still own field selection, conditional forms, grid placement, native
data hooks and Motion. No CSS is emitted merely by forwarding these mixins.
This extraction does not yet make the entire entity body class-only: metadata
lists, image/CSV anatomy and Close remain separate work. Do not change other
consumers by editing the legacy field default to match this opt-in recipe.

Compile `examples/entity-fields.scss` and run
`scripts/test-entity-fields-contract.ps1`. EasyStud additionally compares the
complete emitted CSS with the external pre-extraction baseline. This establishes
source preservation, not new Penpot/human pixel acceptance. Existing product
captions still need palette/density reconciliation with their canonical sources.

## Neutral and destructive confirmation roles

Emit `dialog-classes` and apply `easyedu-modal-layer` to the native fixed root.
Use `easyedu-confirmation-dialog` on the surface, `__header`, `__body`,
`easyedu-modal-title`, `easyedu-dialog-description` and `__actions` on its
existing anatomy. The shared header is 64px minimum; description is Inter
13px and wraps. Actions are right-end/wrapping regular density.

A Copy/Move choice is neutral. For deletion only, add
`easyedu-confirmation-dialog--danger` plus `easyedu-modal__header`/`__body`
to select the existing destructive shell. Its action uses
`easyedu-button easyedu-button--danger`; Cancel uses `--secondary`.
Do not infer risk from a narrow dialog or apply a destructive class to a
neutral choice. Preserve native callbacks, options, focus and Motion.

`scripts/test-confirmation-dialog-contract.ps1` certifies compiled anatomy,
matched dimensions and semantic focus/hover/disabled, not runtime or human
acceptance. The 2026-10-03 earlier modal browser proof remains historical.

## EasyStud local preview checkpoint - 2026-10-03

Canonical chrome/footer source `cd9b56e` is now consumed by EasyStud's controlled
Moodle 5.1 preview; the earlier candidate notes are historical. The product
records `docs/testing/student-modal-preview-2026-10-03.json`: nine entity, nine
Move and three native Message cases pass at 1600/768/390. Actions remain
right-aligned with equal paired font/height/padding/radius and adaptive widths.
Regular Destination/entity and compact Message densities remain distinct.

Consume `easyedu-modal-layer` on the fixed root, not on an inner surface, so
native navigation cannot cover modal help. Participant Close restores its real
trigger after the existing Motion exit. Native templates, options, commands,
conditional bodies, disclosure and focus remain product-owned.

Participant opens natively at all three sizes. Group/Grouping settings use
their native desktop gear and then resize: responsive paint proof is not a
mobile entry claim. Scroll long native bodies normally to inspect footer hit
targets, never hide sticky controls. The shared source is Git-content-identical
in Kit/consumer/runtime; runtime checkout line endings differ (CRLF/LF), not
SCSS rules. Full body style parity, foreign CCB overlays, all states and human
acceptance remain open. This is not a production release or complete migration.

The opt-in Moodle message adapter sizes phone dialogs to their native body and
capped textarea, with a viewport maximum. Never combine a capped phone field
with a fixed-height dialog: this leaves an unexplained blank region above the
footer. Desktop sizing, async loading, focus trap and recipients remain native.

EasyEdu modals use Moodle-compatible markup with a shared visual shell.

## Modal action-row contract (2026-10-03)

`foundation-dialog-actions($density: regular)` is the common footer recipe.
It aligns actions to the inline end (right in the current LTR examples), wraps
when needed and keeps the canonical 0.65rem icon/action gap. Primary and
secondary controls share font, minimum height, padding and radius within the
same footer. Regular pairs use 0.88rem/600, 2.35rem minimum height and .72rem
radius; native Message preserves compact .75rem/700, 1.625rem and .5rem.
Widths follow translated labels, not an equal-width or fixed mobile token.
The secondary semantic palette remains secondary. No change applies to
unrelated card/inline actions or the default generic Secondary specimen.

The public `easyedu-dialog-actions` and `easyedu-entity-dialog__actions` roles
consume the regular recipe; the native Message adapter consumes compact.
Keep existing footer anatomy, business order, commands, focus and Motion.
Source test: `scripts/test-modal-footer-contract.ps1`. Consumer readback:
`docs/testing/student-modal-footers-penpot-2026-10-03.json`: four existing
Foundation Standard/Library pairs and eleven linked product compositions.
This supersedes their centred footer records, not the historical browser
proofs. New runtime promotion/open-cancel and human gates remain pending.

## Entity detail and settings chrome

Use `easyedu-modal-layer` on the fixed root, `easyedu-entity-dialog` on
the existing surface and `easyedu-entity-dialog__header`, `__heading`,
`__icon`, `__eyebrow`, `__body` on the existing semantic children. The title
uses `easyedu-modal-title`: 1rem/700 in the shared identity-title colour.
The header retains the canonical soft gradient, a 4rem minimum height,
1.25rem inline padding, a 2rem icon tile and .75rem heading gap. The eyebrow
is .625rem/700. Body content and responsive dialog dimensions remain owned
by the consumer; these roles do not impose a new field or disclosure layout.

Use `easyedu-entity-dialog__actions` for right-aligned, wrapping actions with the
shared icon gap. Save uses regular `easyedu-button`, Cancel/native links use
regular `easyedu-button--secondary`; apply `easyedu-action-with-icon` when
the source action actually has an icon. Do not invent a Cancel icon or retain
Bootstrap margin utility spacing between icon and label. Optional native links
keep their real URL and are omitted when the source has none.

Read-only Participant detail must not gain a Save/Cancel editing footer.
Its optional native-profile action can use the same right-aligned action-row role.
Group-specific image, enrolment key and delete-picture control, Grouping
configuration, counted exportable lists and all original Motion/focus/commands
remain consumer-owned. This is chrome migration, not full body-style parity.
The 0.4.55 checkpoint requires paired Penpot and a separately authorised
read-only open/cancel browser gate; compile success is not runtime acceptance.

Paired Penpot publication for this chrome checkpoint uses Foundations file
`40e06342-8830-80d6-8008-96572effc11c`: Standard page
`2b150968-5877-802e-8008-97c286173199`, Library page
`81455adb-6787-8068-8008-9ce6186bf6ef`. Entity-header Desktop component is
`c937b22a-fc4d-8004-8008-bae32deee79a`; Narrow is
`c937b22a-fc4d-8004-8008-bae3711770b7`. Both are header-only, retain hidden
legacy body/footer recoverably, and do not modify the original Shell M main.
Standard copies match the visible Library anatomy including actual Inter
family, fills and geometry; three EasyStud desktop headers remain linked.
The product actions retain linked regular Primary/Secondary sources with a
10.4px icon-box-to-label gap and right-aligned rows. Body styles, generic Close
action and complete responsive product compositions remain separate gates.
Portable evidence: consumer
`docs/testing/student-entity-dialog-chrome-penpot-2026-10-02.json` and
`docs/student-entity-dialog-chrome-2026-10-02.md`. Agent inspection and source
contracts do not imply human approval or a new Moodle preview.

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

The 0.4.54 source checkpoint is compile-validated, not a release or human
acceptance. Paired Foundation publication and linked EasyStud Desktop/Narrow
composition readbacks are recorded below. Post-promotion browser proof is a
separate consumer gate.

### Paired neutral-lookup specimens (2026-10-02)

`EasyEdu / Modals / Neutral lookup` is published on 09.2.1 Library and consumed
by linked copies on 09.2 Standards:

- Desktop component `c937b22a-fc4d-8004-8008-bada37621049`, main
  `c937b22a-fc4d-8004-8008-bada35334524`: 34rem wide, 20rem example height.
- Narrow component `c937b22a-fc4d-8004-8008-bada55f324a5`, main
  `c937b22a-fc4d-8004-8008-bada5485bb85`: measured 22.138671875rem wide at a
  24.375rem viewport, 20rem example height. This is responsive source equivalence,
  not a new fixed phone-width token.

Canvas readings use 1rem = 16px: widths 544/354.21875px. Both expose a 1rem/700
identity title, .8125rem/400 helper at 1.45 line height, existing linked Textarea
M and linked Close. Neutral chrome retains modal border/radius/shadow; there is
no header icon, eyebrow or invented footer. Standard/Library recursive visible
fingerprints match. The full Standard export was inspected; the Library caption
paint was reflowed and checked separately.

The consumer owns business wording, native six rows, parser, live results,
focus and Motion. EasyStud's longer helper uses a three-line Narrow lane and
retains a 1rem helper-to-field gap; result tokens wrap inside the surface.
The textarea remains 7.798828125rem / 124.78125px high in the measured example.
Content and viewport, not the catalogue height, determine runtime height.

Consumer evidence: `docs/testing/student-neutral-lookup-penpot-2026-10-02.json`.
The product has no local component mains; all modal, field, Close and result
heads are Foundation-linked. Hidden legacy source anatomy remains recoverable.
Exact native Close chrome, every lookup state, RTL, forced-colors and human
acceptance are not certified by linkage or these two specimens.

EasyStud supervised run `easystud-authenticated-20261002T205725336Z-32120`
passes at 1600/768/390 on preview `b8a3c0f`. It verifies 111 helper character
centres unobscured at each width, fixed-root 1070 above trigger 1064, neutral
border/header, title/helper roles, field rest/hover/focus, recognised/unknown
tokens and opener focus return. Three final captures were inspected and pinned.
No business command or fixture ran; cleanup is complete. This is local Moodle
5.1 technical evidence, not human acceptance, release or full state coverage.

## Native message portal and action-dialog classes

Import `easyedu/adapters/moodle-message-dialog` and include its
`moodle-message-dialog` recipe only on the decorated native modal root. Apply
`easyedu-message-dialog__field` to the native textarea and `__field-wrap` to
its existing wrapper; decorate footer buttons with `easyedu-button` and use
`easyedu-button--secondary` on Cancel. The adapter owns chrome, Inter/modal
roles, a non-resizable Textarea M, the canonical compact header Close, matched
compact actions, right-aligned footer and narrow reflow. Its asynchronous
loading state uses the shared unboxed spinner: do not restore the former radial
halo, framed tile or drop shadow. Bootstrap's empty `btn-close` receives the
same centred multiplication-sign glyph as the linked Close component after its
native background image is replaced; never ship an empty painted square.

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
field M closed-select paint at 2.375rem high, and right-aligned matched regular actions
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
- Close controls use `close-button`; do not leave raw `x` links. The default
  modal-header control is the compact `1.9rem` square mapped to Foundation
  `Core action / Secondary / S`; the consumer owns only its accessible label
  and dismissal/focus-return routing.
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
