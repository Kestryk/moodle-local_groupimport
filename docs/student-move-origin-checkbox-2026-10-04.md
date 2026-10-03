# Move-group origin option — 2026-10-04

## Scope

SM-33 removes the undersized browser-default rendering from “Remove from the
original grouping”. The existing native checkbox and business hook remain
authoritative; its label now consumes the published Kit `easyedu-toggle-check`
primitive for coherent size, label spacing, hover, focus-within, checked and
disabled states.

This is consumption of an existing shared component, not a product-specific
redrawing. The option remains visible only for a selected group that currently
belongs to a grouping.

## Evidence status

Static lineage passes against Kit 0.4.75 (`d0e6afc`). Managed run
`easystud-authenticated-20261003T231631578Z-48756` opened and cancelled the
Participant, Group and grouped-Group branches at 1600/768/390 px. The option is
37.59375 px on desktop and uses the shared 44 px touch target at 768/390; native
checkbox semantics, focus and track geometry pass. There was no fixture or
business request and no move was confirmed.

Durable proof:
`docs/testing/student-move-origin-checkbox-preview-2026-10-04.json`.

Product Penpot propagation and human acceptance remain open in the combined
checklist.
