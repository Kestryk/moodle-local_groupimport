# Guide10 and T058 focus after the T055 module split

Requested native scope: Guide path10 only, and group-card magnifier focus
parity before/after T055. FR1280, sole on-demand mode, headless Chromium,
actual motion, dedicated disposable8051 fixtures. Other guided paths and
loading/K16 suites are not rerun.

The pre-T055 baseline is the exact committed product snapshot41515be6,
exported without touching the shared main worktree. Product source/builds,
PHP, templates, languages and CSS are copied under owned8051 runtime/cache
leases, before/after hashes and backups recorded, and caches purged. Native
oracles run against a fresh browser profile. The new snapshot must be served
by Codex1 before it is synchronized or exercised.

`t058-group-search-focus-ready-successor.spec.js` defines three observations per
version, each from a fresh navigation. It opens the structure view, focuses
QA Source Alpha's actual magnifier button, presses Enter and awaits the
native search field's initial focus. It then presses Escape; capture-phase
browser timers sample document.activeElement at100ms and500ms, retaining
identity/connectivity, panel state and real focus events. No probe sets focus
after Escape. PNGs follow each timed state. The final assertion requires all
three500ms returns to the original magnifier. This is a predefined small
intermittence comparison, not a retry or a whole accessibility matrix.

`guide-native-held-drag-travel-successor.spec.js` preserves the immutable previous
failure and strengthens the native Guide10 recipe. The avatar starts a real
trusted browser drag, is held750ms and released over the neutral panel title.
Actual dragstart-to-dragend must exceed600ms and belong to QA Guided One.
Timers at1000ms/5000ms require a painted non-hidden highlight within2px of
that card's selector and away from its neighbour, try-selection active and
no participant-dragging class. A timed600ms sample after native selection
requires the highlight on QA Guided One's card; try-selection's painted tick,
native context menu and visible complete end panel finish the path.

Both scenarios block plugin writes and require zero blocked writes/page
errors. The existing guarded fixture owns its course and synthetic nologin
users; wrapper finally cleanup and fresh read-only DB evidence are retained.
No product fix, Guide event simulation, seeded completion or accepted Motion
change is introduced. Local-supervised CI candidates need a seeded backend
and authentication; runtime proof is separate from human/Penpot/Moodle4.5.

## Published successor

The main checkout is clean on b0602918 with the served sequence:
T05570db3f96→f8b3fd37, skeleton v2f04fd8a0→21914bd9,
Guide10280eade2→f3a0704b, T058b6175377→8cfcd18b,
K216b932106→8f41498e, followed by the integration recordb0602918.
The export retains both Group/Grouping count labels and the ported model-only
updateStructureSummary. The published modular product snapshot is copied as
one complete product version, including its generated AMD/map and conservative
CSS. QA does not rebuild or independently modify the reserved CM/SM modules.
Archive export rules exclude one SCSS README; only existing product files are
listed for sync. Failed export/path checks happened before any runtime copy.

The first baseline run, `easystud-authenticated-20261014T202553064Z-8004`,
course89, stops at the default5s readiness assertion before any focus cycle.
No T058 conclusion follows from it. Its original spec/report/context remain
immutable. The ready successor waits the same actual ready attribute for60s,
as other active native specs do; all Enter/Escape/focus assertions and timers
are unchanged. The served snapshot had been copied by then, so41515be6 is
restored and purged before the corrected baseline, with another complete
backup/hash record. No product change addresses this harness deadline.

After the final sync, the old read-only preflight stops before browser/fixture
setup because T055 removed local_groupimport_is_on_demand_rendering. The log
is preserved as `es-guide10-held-t055-obsolete-preflight.log`; this is a tool
prerequisite failure, not a second native path10 attempt. Its successor,
`tools/perf/inspect-t055-on-demand.php`, verifies explicit runtime identity,
upgraded schema and the absent retired configuration without calling that
removed product function. The active single-mode runner uses this successor;
no setting or cache is changed by either inspection.

## Baseline41515be6 focus result

Ready successor `easystud-authenticated-20261014T202911435Z-48304`, course90:
PASS, three real magnifier Enter/Escape cycles. At the requested100ms samples,
the input still owns focus (actual elapsed195.40/157.50/201.40ms). At500ms the
original connected magnifier owns focus in all three observations (actual
504.90/506.90/503.30ms). No intermittent loss reproduced in this small sample;
the early input focus occurs during the native closing transition.
Zero page errors or blocked writes. Raw timed focus states/events/PNGs:
`C:/dev/artifacts/es-t058-focus-pre-t055-ready-native/easystud/authenticated/easystud-authenticated-20261014T202911435Z-48304/playwright-output/t058-group-search-focus-re-8a61b--three-native-focus-samples/`.

## T058 after T055: same native focus behavior

Same ready successor, `easystud-authenticated-20261014T203509932Z-48156`,
course92, PASS3/3. At the requested100ms samples the field still owns focus
(actual129.80/205.20/224.30ms); at500ms the original connected magnifier owns
focus in all three observations (actual505.00/506.00/500.90ms).
No regression or intermittent loss reproduced in this small before/after
sample. This does not disprove Claude's separate8052 observation. Both
versions use the same seeded group with one synthetic member and actual
motion, so early field focus is compared at like-for-like panel closure.
Zero page errors or blocked writes. Post-T055 raw events/PNG/report:
`C:/dev/artifacts/es-t058-focus-post-t055-native/easystud/authenticated/easystud-authenticated-20261014T203509932Z-48156/playwright-output/t058-group-search-focus-re-8a61b--three-native-focus-samples/`.

## Held-drag recipe predecessor

`easystud-authenticated-20261014T203336195Z-37380`, course91, stops before a
real dragstart: moving only24px inside the avatar and then waiting does not
start this native Chromium drag. No timed Guide-cue verdict follows. The
original held spec, JSON, screenshot and error context remain immutable.
The travel successor uses a locator hover to settle the actual start point,
checks its native elementFromPoint hit, moves to the neutral title with a
second pointer move, then awaits real trusted dragstart and holds750ms before
mouse-up. It does not dispatch or mock drag/Guide events or force hidden UI.
All highlight identity/bounds/timing and completed-path oracles are unchanged.

## Guide10 result: drag cue passes, next cue still fails after selection

Travel successor `easystud-authenticated-20261014T203710868Z-43044`, course93,
returns FAIL in FR1280/on-demand-only. Actual trusted dragstart/dragend belong
to QA Guided One; the native drag lasts872ms, over the requested600ms.

| Native sample | Highlight | Current cue |
| --- | --- | --- |
|1004.30ms after dragend|hidden=false, display=block, painted, positive size; selector bounds delta0px, neighbour delta175.80px|try-selection active, dragging=false|
|5003.00ms after dragend|same exact selector match and neighbour separation|try-selection active, dragging=false|
|606.60ms after selector click|hidden=true, display=none, bounds0/0/0/0, painted=false, current target null|try-context active, QA Guided One selected and visible|

The1s/5s screenshots show the cue on the correct selector. The inspected
post-selection screenshot shows2/3 completed with painted ticks for drag
and selection, and try-context active, but no cue around QA Guided One.
The expected card is painted with bounds x92,y507.70,width531.19,height163.28.
The600ms painted-highlight assertion fails at successor line175 (aggregate
line180). The strict selection mark helper and subsequent right-click/menu
completion are not reached after that failure; no full path acceptance.
No unchanged product retry or product correction is attempted.

Raw JSON/PNG/context are under
`C:/dev/artifacts/es-guide10-held-travel-t055-native/easystud/authenticated/easystud-authenticated-20261014T203710868Z-43044/playwright-output/guide-native-held-drag-tra-7d3ff-ings-and-complete-checklist/`:
`guide-writing.json`, `path10-highlight-1000ms.png`,
`path10-highlight-5000ms.png`, `path10-selection-600ms.png`,
`path10-failure.png`, `error-context.md`. blockedWrites=0, pageErrors=0.
Claude owns diagnosis of this post-selection null target/hidden cue.

## Cleanup and proof boundaries

The four preliminary/final runs plus the failed readiness predecessor own
five manifested courses89–93 and10 synthetic nologin users. All wrapper
cleanups clear credentials, stop the owned child, release the lease and
remove the fixture. Fresh read-only DB evidence confirms every course absent
and all10 users deleted: `C:/dev/artifacts/es-t055-native-cleanup-db.json`.
Five retention dry-runs have zero errors/candidates/deletions, preserving all
failed evidence. Final8051 remains the pinned243-file b0602918 product copy,
hash-verified with its final deploy manifest and purged.

Combined reports, exact output paths, timed focus events and raw cue states:
`C:/dev/artifacts/es-t055-native-diagnostic.json`;
retention: `C:/dev/artifacts/es-t055-native-retention-summary.json`.
No Guide paths3/7/11, K16 or loading matrix are replayed. The photographed
structure summary remains the existing single badge; this focus comparison
does not provide new native acceptance of the separate K21 count-label UI.
