# Colour popup preview and Motion — SM-58 intake audit

EED-UI-2026-0073. Audited after SM-57 served gate; implementation and human
acceptance OPEN. Preserve earlier SM-46 source/native records and twelve providers.

## Verified source gap

The canonical controller exposes a tiny 12px plane handle, colour presets and
editable Hex, but no separate enlarged current-draft sample. The plane reflects
hue, saturation and value, not a large flat sample of the exact selected colour.
The public `_color-panel.scss` has entrance Motion only; presets and the enhanced
swatch have no shared state-transition recipe. Do not confuse the popup entrance
with click/selection Motion. Named native Hex remains authoritative until Apply.

## Live catalogue

Foundations file `40e06342-8830-80d6-8008-96572effc11c`, Standard 08.4
`d0d0680d-7d36-80da-8008-97a6a5af5762` is available on the owned connection.
M host `5daf2376-ada4-8014-8008-ad80be446a29`; S/L host
`386b6f86-a1e7-806b-8008-bdcccad648f7`. Twelve Open/Keyboard/Invalid/Disabled
specimens retain 320/352/384px widths and existing Regular footer controls.
M/Open `5daf2376-ada4-8014-8008-ad80c02ddbb6` is 352x569.6; plane 302x144,
title 302x28 at (25,17), plane at (25,61), selected handle 12x12.
No broad catalogue write occurred during this audit. Hidden legacy fields must
be visibility-qualified before any positioning repair; do not infer paint from
the raw child list alone. Product counterparts are pinned in the SM-46 record.

## Bounded successor

1. Add a clearly visible flat draft sample without enlarging the panel width
   or replacing the existing Hex/plane/slider/preset controls. Keep title and
   sample in a shrinkable shared header; normalize the same density across S/M/L.
2. Share existing control-state Motion for preset hover/press/selection and
   subtle sample updates. Never animate HSV input geometry or introduce lag to
   the handle. Respect reduced/disabled Motion and keyboard focus.
3. Publish twelve source/Standard states and product counterparts after settled
   provider/visible paint checks. Preserve old specimens recoverably, no new
   parallel component family.
4. Run isolated nine-size/width draft/Hex/palette/Apply/Cancel/keyboard/no-Submit
   checks, then embed byte-identical canonical runtime/SCSS and native read-only
   admin proof. Explicitly retain no real Save/persistence or human acceptance.

No Guide, card disclosure, source hierarchy or colour persistence changes belong
to this lot. Public export remains SCSS-only; optional runtime picker stays a
separate explicit package, with no internal agent/docs distribution.

## Implementation and paired publication successor

Kit 0.4.112 adds a decorative 80x40 exact-draft sample, shared shrinkable header
and 12px title clearance. Short-title height +12px; widths 320/352/384 unchanged.
Presets/swatch/sample use existing fast state-Motion, static reduced/disabled
policies. Invalid Hex retains last valid paint; Apply/Cancel/HSV are unchanged.

Isolated `sm58-colour-preview-20261005-b` passes nine size/viewport cases.
Retained predecessor `sm58-colour-preview-20261005-a` exposes the initial
disabled-policy selector miss. Explicit root selectors fix it. Helper placement
also removes new Sass mixed-declaration warnings; consumer rebuild retains
only its existing layout warning. Source gate compares the entire unrelated
CSS and business files against `087956f4d2a02a34bc73950eddda090be7be1cb7`: PASS.
Canonical controller/SCSS identity PASS; only that module is imported, no
whole-Kit synchronization or private plugin styling.

Twelve existing Library providers updated in place; originals recoverable in
`sm58-backup` plugin data. The write exceeded 120s and stalled the editor;
later heartbeat/readback recovered and confirmed all twelve complete. No
duplicate write or forced reload. Standard/source fingerprints match with no
visible descendant overflow. Standard export/capture inspected; initial Library
capture is obscured by toolbar chrome and remains predecessor evidence only.

Product actual Admin page `5daf2376-ada4-8014-8008-ad9db3131f63` contains the
two original linked M/Open copies, now 352x581.6 with 80x40 samples. Provider
`5daf2376-ada4-8014-8008-ad8044e4a033` retained, no visible descendant overflow;
mobile capture inspected. Update click timed out after dispatch, but readback
confirmed successful propagation; no second click. Detailed IDs/readback in
`docs/testing/colour-draft-preview-penpot-2026-10-05.json`. Guide connection
still points to its separate project; no Guide writes.

Native `admin-colour-panel-draft-preview.spec.js` is a local-supervised CI
candidate: seven controls at 1600/768/390, representative draft/invalid/preset,
Cancel/Apply/focus/static Motion, no settings Save/fixtures. Only translation
and template reads are allowed POST; consuming message-draft getter mocked
empty. One-test discovery `easystud-authenticated-20261005T153449979Z-32312`
passes with no credentials/lease. Source checkout lacks CLI dependencies;
use runtime wrapper and explicit source-spec allowlist. Served proof pending.

Artifacts under `%LOCALAPPDATA%/EasyEdu/artifacts/kit/` and `/penpot/`, run
names above plus `sm58-colour-preview-20261005`, manifested; scoped retention
dry-runs preserve all runs without deletion. Pre-edit snapshot is
`%LOCALAPPDATA%/EasyEdu/handoff-snapshots/sm58-source-pre-20261005`.
Human checklist, persistence and wider browser/AT matrix remain OPEN.

## First served native run and precise static-Motion oracle

Managed `20261005T154941Z` serves source `a2cf377`. Native run
`easystud-authenticated-20261005T155007740Z-40328` fails only at its first
reduced-Motion duration assertion: native shared guard intentionally forces
`0.001ms !important`, computed `1e-06s`, not zero. Initial 80x40 sample, 12px
clearance, valid/invalid/preset drafts, Cancel/Apply/focus and matched Regular
actions pass for the first Primary control. No page error/blocked write; all
cleanup flags true. Failure/report/capture remain preserved.

The successor asserts `transition-property: none` plus technical duration at
most one microsecond: no property can animate. This recognizes the existing
shared policy without weakening static behavior or changing production CSS.
Native re-run still pending; previous immutable source/test evidence retained.
