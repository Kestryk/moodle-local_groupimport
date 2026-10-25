# EasyStud Wave 15 corrections

- Date: 2026-09-03
- Lots: `EED-UI-2026-0052-RF1`, `EED-UI-2026-0038-RF8` and
  `EED-UI-2026-0040-RF1`
- Base: cumulative EasyStud Wave 13 source `e960204`
- Kit input: `EED-KIT-2026-0009-RF1` and `EED-KIT-2026-0006-RF1` at
  `1de3514`

## Contextual help

Enrollment key and Group image remain the only semantic question-mark
consumers. They use the canonical 1.15 rem component reset, including its
compiled cascade ownership for geometry, alignment, text decoration and focus
paint. Their native buttons no longer carry Bootstrap `btn-link`. Accessible
names, help copy and popover creation/removal are unchanged.

## Delete picture

`Delete picture` remains a destructive command for the current Group form, not
a stored preference. Activating it only prepares the hidden value submitted by
Save. Cancel removes the modal without a request. After a successful Group
update, the pending command is reset to `0`/Disabled before the modal is
removed; reopening therefore starts from Disabled. The button keeps the
accepted Slideshow height and type scale, becomes content-sized and uses a
visible icon/colour transition. Reduced motion shortens that transition without
changing the transaction.

## Navigation and Guide

The desktop Guide outer control is transparent and centred, while the compact
Guide row keeps a neutral visible border and deliberate clearance before the
following section. Navigation Close continues to consume the shared close
button mixin; no plugin-local hover was added. Routes, destinations, Guide
content, body portal behavior, scrolling, Escape and focus return are outside
this correction and preserved.

## Validation boundary

The Sass and Course Manager AMD outputs are rebuilt from source. Focused and
legacy static contracts cover the final help cascade, one-shot delete command,
reduced-motion branch and breakpoint-specific Guide composition. Managed
preview and human browser acceptance remain separate; this batch performs no
runtime, cache, fixture or preview operation.
