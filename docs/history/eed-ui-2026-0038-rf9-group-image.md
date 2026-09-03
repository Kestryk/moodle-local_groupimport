# EED-UI-2026-0038-RF9 - Group image upload and toggle ownership

- Date: 2026-09-03
- Base: cumulative EasyStud Wave 15 source `8ec5eaf`
- Runtime: not promoted by this source batch

## Corrective scope

The Group settings image picker keeps the shared Kit filepicker surface and its
existing drag/drop path. Its visible Choose control is now a real button that
directly activates the file input located in the same filepicker. This removes
the browser-dependent nested-label activation path while preserving native
file selection, filename feedback, `FormData`, the existing AJAX endpoint and
Moodle's `process_new_icon` storage flow.

The pending `Delete picture` command now has native checkbox semantics and
composes the embedded Kit's `toggle-check` with `slideshow-toggle-row`, exactly
as required by the component contract. The rejected EasyStud-only icon
rotation, press scaling, colours, timings and copied CCB product classes are
removed. Save remains the only server transaction; Cancel still discards the
pending command and a successful Save resets it before the modal closes.

## Preservation and validation boundary

Group/Grouping fields, membership lists, contextual help, modal footer,
drag/drop, image processing, card rehydration and URL behavior are unchanged.
Source/generated contracts cover direct picker activation, multipart form
submission, canonical Kit composition and removal of the rejected imitation.
Sass and Course Manager AMD are rebuilt from source. No runtime, cache, fixture,
preview or browser operation belongs to this source batch, so the operating
system file chooser and persisted image still require preview validation.
