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
