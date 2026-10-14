# Path10 after the published dragend refresh, 14 October 2026

Only path10 is replayed, FR1280, sole on-demand mode, on the owned8051 copy.
Paths3/7/11 and loading/menu recipes are not rerun. Their historical evidence
and the earlier path10 failure remain in the versioned replay report.

## Served code and synchronization

Claude8229f81c, integrated as6bff40b4 and published on41515be6, requests a
Guide highlight refresh after an actual group or participant dragend. The
exact source patch is applied to the existing8051 assembly, retaining its
K21/Mass Import/K16/checklist work. Only course_manager.js and its regenerated
AMD/map are synchronized, under the owned runtime/cache leases, then purged.
Before/after SHA256 and backups are external:
`C:/dev/artifacts/es-guide10-dragend-refresh-deploy/manifest.json`.
The source difference is exactly11 added lines. No product file is committed
by this QA lot; no shared source or Penpot is modified.

## Native diagnostic protocol

`tools/playwright/guide-native-dragend-refresh-successor.spec.js` is a new
successor of the immutable failed drag-cue spec. The native participant
avatar is dragged to the actual neutral panel title. It must emit real
dragstart and dragend, with no membership drop or extra view toggle.

A capture listener timestamps that dragend and takes browser-state samples
at1000ms and5000ms. Each records the highlight's presence, hidden flag,
classes, computed display/visibility/opacity and bounds, the Guide's actual
current target, active step, dragging state and scroll. Corresponding PNGs
are captured immediately after each timed sample; the JSON elapsedMs is the
precise state timestamp. Fixed two-point diagnostics do not retry the run.

The existing strict native oracles remain: each painted completed tick,
highlight bounds within2px, actual checkbox selection, actual context menu,
then the visible completed end panel. Desktop menu closure uses native Escape
because its mobile Close button is hidden at1280. No synthetic Guide receipt
or seeded completion is introduced. The owned ephemeral progress key and
original Guide configuration are restored at cleanup.

The wrapper discovers exactly one test, creates an owned disposable course
and two synthetic nologin students, and removes them in its finally path.
Runtime identity and the absent retired renderingmode row are checked
read-only before credentials. Browser proof remains separate from human,
Penpot and Moodle4.5 acceptance. Existing AI/event contracts are unchanged.

## Result: product failure still reproduced

Run `easystud-authenticated-20261014T190808602Z-42040` discovers exactly one
test and returns Playwright exit1. Path10's first painted tick passes after
real participant dragstart/dragend. Step2, `try-selection`, is active, the
participant checkbox is visible, and `is-dragging-participants` is false.
The highlight is still hidden; steps2/3 and the completed end panel are open.
Failure: successor line53, caller138; FR1280, on-demand-only, course88.
The final aggregate assertion reports that preserved failure at line142.

| Timed state after dragend | Highlight state | Current target |
| --- | --- | --- |
|1009.10ms (requested1000)|present, hidden=true, display=none, visibility=visible, opacity=1, x/y/width/height=0, painted=false|null|
|5006.30ms (requested5000)|same hidden/computed/bounds state|null|

Class at both times: `easyedu-guide-highlight easyedu-guide-highlight--pulse-blue`.
Both inspected screenshots show1/3 completed and the second step active,
with no painted cue. No product correction or unchanged retry is attempted.
Claude owns the follow-up diagnosis.

Diagnostic JSON: `C:/dev/artifacts/es-guide10-dragend-refresh-diagnostic.json`.
The complete raw report, context and PNGs are under
`C:/dev/artifacts/es-guide10-dragend-refresh-native/easystud/authenticated/easystud-authenticated-20261014T190808602Z-42040/playwright-output/guide-native-dragend-refre-a9541-one-five-second-diagnostics/`:
`guide-writing.json`, `path10-highlight-1000ms.png`,
`path10-highlight-5000ms.png`, `path10-failure.png` and `error-context.md`.

Browser page errors and blocked requests are zero; no business write command
is exercised. Wrapper cleanup confirms credentials cleared, owned child
stopped, runtime lease released and fixture cleanup complete. Fresh read-only
DB inspection proves course88 absent and users35163/35164 deleted:
`C:/dev/artifacts/es-guide10-dragend-refresh-cleanup-db.json`.
Retention dry-run has no errors and performs no deletion; failed evidence is
retained. The scenario remains local-supervised, a CI candidate requiring the
authenticated8051 disposable fixture and a product fix. No full-course,
mobile, human, Penpot or Moodle4.5 acceptance follows from this failing run.
