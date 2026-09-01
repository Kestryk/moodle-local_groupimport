# EED-UI-2026-0045 - Selected-participant action surface

## Current dependency result

Implementation is deferred. The embedded UI Kit currently exposes two
different, already accepted selection surfaces:

- `sticky-selection-panel` for compact desktop feedback with a count and one
  recovery action;
- `mobile-action-tray` for the responsive multi-action workflow.

The requested desktop surface is a contextual, floating multi-action bar that
appears only when participants are selected. Expanding the one-action sticky
panel or using the mobile tray at desktop would violate those documented
contracts and create a consumer-only variant.

## Required Kit handoff

The UI Kit owner must first approve a named desktop contextual-action surface
that composes a selection summary with several action buttons, defines wrapping
for translated labels and preserves focus, overflow and responsive handoff to
`mobile-action-tray`. EasyStud can then consume it without changing selection,
pagination, drag/drop or action business logic.

No product source, generated asset or runtime behaviour is changed for this
lot in Wave 11.
