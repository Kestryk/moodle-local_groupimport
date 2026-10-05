# SM-43B — Binary filter / Reset presentation

Current gate: source and paired publication ready, native preview pending.
Shared/embedded recipes and two class-only adapters pass strict static/isolated
gates. Six Foundation source/Standard states match and both product catalogue
compositions are linked, reflowed and exported after scoped editor recovery.
SM-43A footer remains served. Human checklist OPEN; native filtering/reset
semantics and all accepted Motion remain authoritative.

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

## Candidate implementation and evidence

Kit 0.4.100 adds only opt-in `filter-toggle-trailing` and `filter-actions`.
Caption 12.16/600, 44px hit row, 36x20 track, 14px thumb; trailing text clearance
8px and adjacent Reset gap 12px. Generic and leading recipes unchanged.
Two native wrappers consume public classes; exact obsolete grid-position rules
are removed. No inline style or consumer paint fork is introduced.

`tools/release/test-binary-filter-successor-source.js` compares complete
unrelated compiled CSS to served `7d37a75`, exact template reconstruction and
all existing commands/choices/Motion. PASS. Sass 1.79.1 retains its pre-existing
mixed-declarations warning, not a new functional error.

Isolated Kit run `filter-actions-20261005-c` PASS at 1600/768/390: label/track
geometry, same-row Reset, keyboard checkbox authority, disabled state, RTL,
custom palette and reduced Motion. Earlier `-a` retained a harness-only
disabled-click failure; `-b` and final `-c` pass. Browser closed, manifests
registered and dry-run retention protects final evidence; no deletion.
SCSS-only public-package test passes 0.4.100 with no internal agent/docs leak;
its self-owned temporary test package is cleaned by the existing procedure.

Source host `cf371b29-2e8e-8011-8008-bdb56e782ae0`; Standard host
`386b6f86-a1e7-806b-8008-bdb6fd014b04`. Six Off/On/Hover/Focus/Disabled-off/on
providers and copies are created; final fingerprints/export are NOT certified.
Keep the owned empty preparation board `386b6f86-a1e7-806b-8008-bdb6a2c8d32a`
until the editor responds. Product consumers have NOT been changed.

Prepared native successor: `tools/playwright/student-binary-filter-successor.spec.js`.
It preserves source-aware responsive Reset closure and blocks business POSTs;
it is NOT yet executed. No runtime promotion, cache purge, fixture or DB write
has occurred in this lot. Runtime remains the preceding served .99 tranche.

## Paired publication successor

Global cross-page lookups repeatedly timed out. Page-local indexed reads
recovered the exact shapes without restarting or discarding the editor.
Six settled source/Standard fingerprints match (including focus stroke,
radius, opacity and text roles). Painted containment uses .01px numerical
tolerance; the former exact helper reported floating-point edge artifacts.
Source/Standard fresh exports are inspected. The empty owned preparation
board was removed after confirming it had no children; no user content removed.

Two new linked Regular/Touch action-row providers reuse canonical Reset.
EasyStud Desktop/Mobile catalogue compositions now consume these row providers;
12px action gap, 16px footer clearance and all visible descendant paint fit.
Previous controls remain hidden/recoverable with original geometry in plugin
data. Both product exports inspected; no commands or user-data change.
Exact crosswalk: `docs/testing/filter-actions-foundations-2026-10-05.json` and
`filter-actions-product-2026-10-05.json`. Kit code pin `55cd2c2`.
Native successor and human review are still separate pending gates.
