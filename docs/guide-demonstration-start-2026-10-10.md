# R10-30: explicit demonstration entry, preparation only

User request: every timed illustration needs an explicit Start demonstration
button before playback, with an In progress state. This is not the guided-path
Start command and does not create course data. No implementation is activated
by this document.

## Current source inventory

- applyActiveSlide invokes playDiscoveryScene on entry to the visible modal.
- membership, actions and inspection start timed choreography on that call.
- concepts is static. Creation initializes an interactive fictional name
  exercise, with Preview/Letters/Clear and Enter; it is not timed choreography.
- membership Add/Move controls currently both select a mode and start playback.
- Replay starts the stored mode. Reset restores the illustration and returns
  before a new controller is created. Pause/Next share the existing scene clock.
- stopDiscoveryScene owns abort/teardown; its semantics must be preserved.

## Intended shared state contract

| State | Start control | Existing playback controls | Expected scene |
| --- | --- | --- | --- |
| Ready | Start demonstration, enabled | Pause/Next disabled | Natural initial cards |
| Playing | In progress, disabled | Pause/Next retain current clock | Existing choreography |
| Paused | In progress, disabled | Resume/Next retain remaining time | Frozen scene |
| Finished | Replay demonstration, enabled | Pause/Next disabled | Completion and recap |
| Reset/re-entry | Start demonstration, enabled | Pause/Next disabled | Restored initial cards |

Compare Add/Move remains a mode choice. It must not silently restart an active
scene or issue a native membership action. The chosen mode is used by the
explicit Start command; mode-switch behavior during playback needs a bounded
test and clear feedback, not an undocumented automatic replay. Preserve the
existing buttons/pressed palette and the natural scene return.

## Publication and activation gates

Reuse canonical Small/Default button geometry, icon/text gap, focus and disabled
states. Catalogue linked Ready/Playing/Finished examples at desktop/mobile in
Foundations, then Guide; no custom consumer button CSS. Source/Standard saved
geometry and focused painted examples precede consumer activation.

Add localized EN/FR data defaults and the shared template/engine atomically.
Keep old curriculum IDs, reading/path storage, real actions, creation exercise,
Motion timings and pause/phase ownership. Tests must cover idle entry, explicit
start, rapid repeat, mode selection, pause/resume/next, finish, reset, departure,
re-entry and teardown, normal/reduced/disabled policies and three widths.
No forced hidden controls or course/settings writes in the native test.

## Current proof boundary

Inventory is source-only. R10-28 native playing/pause proof is retained as the
predecessor, not treated as proof of this unimplemented gate. The user has been
asked to reconnect Foundations for the linked state catalogue. Existing preview
continues serving the spacing successor while this lot is prepared.
