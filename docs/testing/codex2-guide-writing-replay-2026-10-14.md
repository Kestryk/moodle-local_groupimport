# Native guided writes with A-CHECKLIST, 14 October 2026

Requested8051 replay is complete for paths3,7,11; path10 remains open on a
reproduced native highlight failure after the first gesture. No global PASS or
human acceptance is claimed. Product/Guide sources were not modified for QA.

## Version, scope and fixture

The dedicated copy has approved loading0df9010c and the served A-CHECKLIST
Guide1fb3206a (bootstrap immediate frame, Guide src/AMD/map/Discovery SCSS),
assembled with our prior K21/Mass Import/K16 work. Deployment and conservative
CSS evidence are in `codex2-component-loading-2026-10-14.md`. Sole on-demand
mode, FR1280, actual animations; no retired config setter or dual matrix.

The authenticated wrapper discovers one test, owns the8051 runtime lease,
creates a disposable course with two nologin synthetic students, three groups
and two groupings, and cleans it even on failure. Fixture ownership is written
incrementally to its external manifest. Commands are allowlisted by actual
courseid and action; unrelated plugin writes are blocked. Existing real users
are never enrolled or given roles. No import/file/message was submitted.

The specs retain installed full path definitions and dependencies, no seeded
completion or dispatched Guide events. An owned ephemeral QA storage key
isolates progress from user history. Each milestone requires the actual
is-complete state, accessible completed label and painted CSS tick; current
highlight must align within2px of the native target. Final message must be
visible and complete. Real ajax.php success receipts and fresh get_state reads
are awaited before using rerendered cards. Cleanup restores Guide config and
removes only the owned QA storage key.

## Scoped results, historical global failures retained

| Path | Result | Native evidence |
| --- | --- | --- |
|3, steps2–6|PASS, full6-step exercise|Create group, actual participant selection/add; all6 ticks, highlights, final panel|
|7, step4|PASS, full4-step exercise|Native member move succeeds; all4 ticks, highlights, final panel|
|11, steps4–5|PASS, full5-step exercise|Native group assignment succeeds, same destination verified; all5 ticks, highlights, final panel|
|10, steps1–3|OPEN/FAIL at next cue|Real dragstart/dragend and first tick pass; next active step's highlight remains hidden, steps2/3 and final panel not reached|

Paths3/7 run `easystud-authenticated-20261014T181600828Z-19180`, course83,
`C:/dev/artifacts/es-guide-writing-settled`. Overall run FAILED at path10's
obsolete drop-write expectation, before path11. Three actual writes succeed:
creategroup/addusers/movemembers. Final DB snapshot before cleanup proves one
member in the new practice group5048, moved member in its destination, and
absence from its old source. Read-back summary `es-guide-writing-3-7-db-evidence.json`.

Path11 run `easystud-authenticated-20261014T181928560Z-33752`, course84,
`C:/dev/artifacts/es-guide-writing-actions-activity`. Overall run FAILED on the
manual text-area drag recipe in path10, but the independent path11 completes.
Its single movegroup write succeeds; DB snapshot proves group5051 assigned to
the exact selected grouping1326, matching the stored native path context.
Read-back summary `es-guide-writing-11-db-evidence.json`. No repeated3/7 pass.

## Product failure to Claude: path10 next highlight

- Final spec `tools/playwright/guide-native-drag-cue-successor.spec.js:53`
  (called from line116); FR1280, sole on-demand, course87.
- Run `easystud-authenticated-20261014T182553205Z-37564`, artifacts
  `C:/dev/artifacts/es-guide-native-drag-cue`.
- Avatar-rail native drag to the real h3 panel title, outside any group. Actual
  captured dragstart/dragend target belongs to the participant, draggable=true,
  fine pointer, no drop or business write. First milestone becomes complete.
- After drag ends, current native "Tester les boutons d'action" is active,
  checkbox target is visible, but `[data-easyedu-guide-highlight]` stays hidden
  for the strict5s expectation. No subsequent layout toggle, source/DOM/CSS
  injection, seeded step or forced hidden control. Zero pageerror/blocked write.
- Capture `C:/dev/artifacts/es-guide-native-drag-cue/easystud/authenticated/easystud-authenticated-20261014T182553205Z-37564/playwright-output/guide-native-drag-cue-succ-3b885-urrent-checklist-native8051/path10-failure.png`;
  JSON and error-context adjacent. Image visually inspected.
- Source lead, not proven cause: dragstart emits next-step completion while the
  dragged card is temporarily hidden; participant dragend7175 restores cards
  without requesting Guide highlight refresh. Course Manager drag/tutorial
  functions are reserved to Claude, outside our focus/window exception.

Kevin's current choice b validates only beginning the drag, explicitly allowing
release outside a group without a write. Step3 is try-context (native menu),
not a move confirmation. The old plan's generic "steps that write" cannot be
used to invent a required drop receipt or replace installed path definitions.

## Immutable predecessors and cleanup

- Initial `181117689Z-52292` course82: stale rerendered card, auto-valid default
  choice advanced its cue before the old choice oracle, unavailable overview
  toggle. One creation succeeded; no complete path claimed.
- Settled successor owns fresh state reads, re-resolves cue targets and accepts
  already-current confirm cue after native default choice, keeping strict
  confirmation and size/alignment checks. It resolves3/7 without product edits.
- Actions/activity successor separately completes11; its manual text movement
  did not begin native dragging, so its missing first tick is a harness failure.
- Avatar predecessor `182216450Z-4588`, course85, incorrectly required h2;
  native panel title is h3. Retained failed recipe/run.
- h3 successor `182331031Z-16460`, course86, proves drag and first tick, then
  hidden next cue; final successor removes the extra view toggle to isolate it.
  Same native failure, no unchanged rerun or weakened highlight oracle.
- All six wrappers clear credentials, stop their child, release lease and
  complete fixture cleanup. Fresh read-only DB inspection confirms courses82–87
  absent and all12 synthetic users deleted. `es-guide-writing-cleanup-db.json`.
- All nine new roots (three loading, six guided) have retention dry-run without
  errors/deletion; manifests/JSON/logs/PNGs external, no Apply.

No new visual component/Kit/Penpot change in this QA lot. For Kevin: checklist
ticks/current cue/final panels on actual writing paths3/7/11 FR1280, missing
next cue after drag in path10; human/Penpot/4.5 and path10 acceptance remain open.
AI contract: native business receipts certify completion; presentation or QA
storage never replaces them. Existing product/Kit contracts and AGENTS unchanged.
