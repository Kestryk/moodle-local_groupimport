# SM-43B — Binary filter / Reset presentation

Current gate: diagnostic only; no toggle recipe, template or Penpot provider
change yet. SM-43A footer is served and independently verified. Human checklist
remains OPEN; original native filtering/reset semantics remain authoritative.

## Source and initial native diagnosis

Current Kit filter toggle is borderless with a leading 36x20px track, 14px
thumb and 48px label indent; label is 12.16px/600, hit target 44px. It is not
the generic framed dialog toggle.

Native desktop: label width 200.72px, Reset 57.52x30.39px. The two are separated
by approximately 384–401px because the native two-column grid stretches the
first track while the toggle uses fit-content. At 768px the toggle and Reset
each occupy their full 513.5px lane on separate rows.

Source `course_manager.js` explicitly calls
`closeResponsiveAdvancedFilters` after catalogue Reset: responsive Reset
closes the panel; desktop Reset keeps it open. Do not change this behaviour
to satisfy a desktop-only test expectation.

First immutable sampler `234820524Z-31112` passes its checkbox/Reset checks
but fails its later manual-close assumption at 768px: Reset had already closed
the panel, so the extra click reopened it. No page error, business POST or
fixture; all cleanup complete. Corrected source-aware sampler is recorded
separately; do not relabel the original as a product defect.

Corrected `235022312Z-23440`: PASS desktop Participants/Structure and compact
Groups at 768/390, four cases; exact native Reset semantics retained.
No page errors/blocked business requests, all owned cleanup complete.
This establishes a baseline, not a redesigned toggle or human acceptance.

## Next bounded implementation

1. Read the corrected native three-width baseline and compare current 08.5 /
   08.5.1 toggle + product catalogue compositions, not only a static checkbox.
2. Propose a trailing switch with a left-aligned short label and clear separation
   from Reset, using one shared responsive action-row recipe. Preserve the
   44px interaction target, native input authority, theme tokens, keyboard
   focus, RTL and reduced-motion. Keep standalone/generic controls separate.
3. Publish all relevant Off/On/Hover/Focus/Disabled states in Standard + Library
   and all effective product consumers, with actual painted bounds and reflow.
4. Sync the canonical Kit source and class-only adapters; preserve original
   predicates, Reset closure, no-result handling, column equal heights and
   accepted panel/card Motion. Old whole-file guards stay pinned.
5. Isolated + fresh native keyboard/pointer/Reset three-width proof, manifest
   and cleanup; only then record served readiness, never human acceptance.

SM-44 History/Message modal chrome, SM-45 Admin section spacing, SM-46 shared
custom colour popup and SM-47 actual native mobile menu remain pending.
Other SM-42 composition/Skeleton header follow-ups remain open. Guide and
component rename retain their separate deferred programmes; no new worktrees.
