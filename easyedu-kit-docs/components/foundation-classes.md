# Foundations class API

SM-43B candidate: `.easyedu-filter-actions` owns the adjacent 12px action gap;
`.easyedu-filter-toggle--trailing` opts into an 8px label-to-switch gap and
end-lane 36x20 track, preserving legacy controls and native state authority.
Source/isolated proof is not served native or final Penpot acceptance.

SM-43A public filter roles: `.easyedu-filter-disclosure-row` owns 16px minimum
footer clearance; `.easyedu-filter-disclosure` owns the full-width trigger and
transparent underline-only hover. `.easyedu-filter-toggle` and
`.easyedu-filter-reset` remain the binary and Reset roles. Consumer auto margins,
equal column heights, filtering and original Motion stay product-owned.

Selection toolbars opt in through `.foundation-selection-action`; their native
Bootstrap semantic class selects the primary outline, neutral outline, danger
outline or primary solid role. `.foundation-selection-action--tray` adds only
the 2.35rem responsive minimum height. The `selection-action` recipe owns font,
radius, icon gap, rest/hover/focus/pressed/disabled paint. Products own selection
and command routing; no group/member rule belongs in the Kit.

Destructive label actions opt in through `easyedu-button--danger` or
`foundation-button($danger: true)`. They retain regular Core Action geometry
and the existing Danger palette `#a12b2b`, including hover/focus; disabled
becomes neutral. Danger and Secondary are mutually exclusive.
`foundation-dialog-actions` matches Danger/Cancel just as it matches
Primary/Cancel. No danger paint belongs in a consumer stylesheet.

Modal footers use `foundation-dialog-actions($density: regular)` rather than
mixing independently sized Primary/Secondary controls. The opt-in recipe
aligns to the inline end, wraps, shares the canonical gap and matches paired
font/height/padding/radius. Regular is 14.08px/600, 37.6px minimum, 11.52px
radius; compact Message remains 12px/700, 26px, 8px. Width follows the label.
`foundation-button($matched-size: true)` is internal geometry coordination,
not a new palette or global rewrite of compact card/inline controls.
Use `scripts/test-modal-footer-contract.ps1` alongside the focus contract;
compile proof does not certify native browser paint or human acceptance.

Compact inline actions can consume
`foundation-button($density: compact)` and its `$secondary: true` Cancel
variant. They use 12px/700 labels, a 26px minimum shell, shared icon/label gap
and vertical centring. Primary Add/Save is blue/white; Cancel is white/blue.
Remove Bootstrap glyph-margin utilities from this composition rather than
compensating with spacing characters or another consumer override. Responsive
command exposure stays consumer-owned; this does not create mobile add forms.

Native focus retains the resting semantic colours with the shared keyboard
ring; hover uses primary-strong/white or primary-soft/blue for compact Cancel.
The Foundation recipe owns these paints explicitly, including Moodle's native
`:focus` cascade. Do not stack `action-button` beneath an inline Foundation
skin: its generic focus/hover colours survive even when resting labels match.
Verify settled hover and keyboard focus, not only the initial screenshot.

Keyboard focus explicitly supplies `--easyedu-control-focus-border` to the
shared ring: a halo alone leaves a native outlined button's grey focus border
in place. Both regular/compact and primary/secondary recipes use the same
0.0625rem blue border and unchanged ring width/radius. Validate the four public
paths with `scripts/test-foundation-button-focus-contract.ps1` and native
keyboard focus; do not compensate with a consumer border or `!important`.

This is the shared class-based consumption path, not an EasyStud fork.
The source measurements come from the accepted EasyStud product composition
`5daf2376-ada4-8014-8008-ad9c0e35b6c1`, whose components inherit Foundations.
No product selector, business state, translated sentence or Moodle course ID
belongs in the class emitter.

```scss
@use "easyedu/foundation-classes" as foundations;
@use "easyedu/adapters/moodle-file-deposit" as moodle;
@include foundations.foundation-font($localFontUrl);
@include foundations.foundation-classes;
@include moodle.moodle-file-deposit-classes;
```

For editable generic tables, also emit `data-classes` from
`easyedu/data-classes`. It provides `.easyedu-data-table`, `.easyedu-status`
(`--warning`), `.easyedu-choice`, `.easyedu-notice`, `.easyedu-table-toolbar`,
`.easyedu-search` and button `--neutral` / `--icon` variants. This is not the
hierarchical Sources/Layer-source family. Rows use 64px minimum height, 40px
editable controls and contiguous horizontal borders without vertical dividers.
Business warning rows add `is-warning`; filtering and editing remain native.
On Moodle, add its native `table-reboot` class to opt out of automatic legacy
table decoration. Do not compete with Boost's four-`:not()` selector using
extra specificity or `!important` in a consumer. Status labels centre both
short and wrapped copy, keep a 12px inline inset and centre their fit-content
surface in the cell. Verify computed cell borders, text alignment and padding.

Use `.easyedu-ui` on the application root; `.easyedu-panel` and
`.easyedu-panel--success` on structural panels; `__header`, `__copy`, `__title`
and `__description` for heading anatomy. The copy wrapper becomes `contents`
on narrow viewports so descriptions span below the icon/title row.
`easyedu-information` supplies its own header/title/description/label anatomy;
`easyedu-tag-list` contains `easyedu-tag` metadata. `easyedu-button` supports
the `--secondary` modifier. `easyedu-empty` contains a decorative icon and copy.
Buttons use `--easyedu-action-icon-gap` between icon and label, including
anonymous text labels; consumers must not insert manual spacing characters.
The same Foundation transition applies to pressed/selected/expanded button
states, and icon glyphs retain a fixed one-em slot so labels never touch them.

The `easyedu-file-deposit--moodle` adapter preserves Moodle's native picker
and uses the same shared button recipe. Provide visible localized support
and a requirements strip from the actual accepted types. The duplicated
native empty instruction is suppressed, but filename, errors and progress
remain intact. Moodle still owns the draft, dialog, replacement and upload.
`easyedu-form-actions` centres real submit controls.

Selected files use `easyedu-file-deposit__selected-file`: a linked file-type
icon, the native Moodle filename link and a compact remove action. Single-file
consumers expose one row and replace/remove it; multi-file consumers render one
row and remove action per file. `maxfiles` and accepted types remain explicit
business configuration, never inferred by the visual component.

## Measured properties

| Role | Font px / weight | Line height |
| --- | --- | --- |
| Page | 20 / 700 | 1.2 |
| Panel section | 16 / 600 | 1.2 |
| Information heading | 15.68 / 700 | 1.2 |
| Panel description | 14.4 / 400 | 1.2 |
| File deposit action title | 15.68 / 700 | 1.2 |
| File deposit action help | 12.16 / 400 | 1.2 |
| File metadata / secondary S | 12 / 500 or 600 | 1.2 |

Panel padding is 24px (16px narrow), rail 5.6px, radius 15.2px, no shadow.
Icon tiles are 40.8px with a 20px icon box. File surface is #FBFDFF, solid
#C8D6E3, radius 14.4px. Its requirements strip is #F3F8FC / #D4E2ED.
Do not copy documentation margins, specimen notes or fictional data into UI.

`easyedu-page-header` groups the identity/description block and navigation with
`--easyedu-page-header-gap` (18px). Measured on desktop initial deposit:
introduction frame y334 + 48px, navigation y400. Use document flow so translated
copy can grow; do not fix the header height or rely on paragraph theme margins.
The mobile navigation remains the consumer's existing sticky control.

## Font provenance

Inter 4.1 is vendored unchanged from rsms/inter commit
`e3a3d4c57d5ecc01453a575621882a384c1995a3`, `docs/font-files/InterVariable.woff2`.
SHA256: `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`.
SIL license is included in `assets/fonts/LICENSE.txt`. Moodle consumers copy
the exact asset into `fonts/` and resolve it through Moodle's native font URL.

## Gate and remaining coverage

### Native upload continuation

The Moodle adapter keeps native `dndupload-inprogress` rows expanded; filename,
progress and choose-file action must not overlap. The large drop overlay uses
16px inset, #EDF6FC at .97 opacity, and a 1px #8ABCE3 border. Its localized label
comes from `data-easyedu-drop-label`; `.is-dragover` or native `.dndupload-over`
selects it. Danger uses #FFF4F2 / #D96B63; actual rejection is consumer-owned.
The empty, drag-over, danger and uploading action titles all consume
`type-card-title`; their explanatory sentence consumes `type-caption` with the
Foundation 1.2 line height. Filenames, progress and file metadata keep their
separate data roles.

For exact empty-state strokes, add an aria-hidden `svg.easyedu-empty__boundary`
with a full-size rect (rx=13.6). CSS paints the clipped 2px centred stroke as a
1px inner boundary with 11px dash/gap, as exported by Penpot. The default CSS
border remains the fallback when no SVG boundary is present.

This entry point currently covers the initial import composition primitives;
it is not a claim that all legacy components or every plugin is migrated.
Review preview/report/history/dialogue states separately. Before promotion,
compare rendered titles, colors, icon geometry and spacing with Penpot, inspect
desktop/tablet/mobile captures, test upload/preview without performing import,
and compare embedded module hashes with these canonical files. Never declare
pixel parity from a passing overflow or column-count assertion alone.

## Confirmation and Workspace Create catalogue - 2026-10-03

Regular Danger is an explicit `easyedu-button--danger` modifier; it shares
Primary/Secondary geometry and the neutral Disabled state. Never apply Danger
to a neutral Copy/Move choice. Paired footer heights match, not translated widths.

Workspace Create consumes `_workspace-control-classes.scss`: 38 x 38px regular,
38 x 42.4px narrow, radius 8px and a centred transparent 16px Plus mask. Solid
and Outline each have Default, Hover, Focus-visible and Disabled states. Penpot
uses the linked canonical 24px icon root with 16px paint, not a shrunken root
or an opaque backing square. Foundation hosts are `a301101d-ddc2-807b-8008-bb560202717e`
(Library) and `a301101d-ddc2-807b-8008-bb5687e2cec2` (Standards).

Paired Penpot readbacks/exports and twelve EasyStud field/action compositions
are recorded by the consumer; neither publication nor source compilation is
human acceptance or authenticated browser proof. Existing native Motion stays.
