# PG-S1 — modal highlight correction preflight

Demand Kevin, priority before the remaining T037 reading composition. No new
styles/engine or native preview have been activated by this preflight.

## Current baseline, rechecked rather than assumed from old audit

Sourceca53971 / Kit7728357(185) / served runtime9135235. Served CSS still puts
the body-portalled fixed highlight at1020; native modal wrappers use1050 or the
public modal role1070. Discovery checklist uses modal-layer+1. Existing shared
`dockChecklistAwayFromTarget` detects visible external `[role=dialog][aria-modal=true]`
and sets the Guide-root marker. Mutation/scroll refresh and hidden-target cleanup
already exist: do not duplicate them or replace their Motion/persistence.

## Twelve current targets (EN/FR, pure production fixture)

| Path | Step | Public target |
| --- | --- | --- |
| prepare-activity-grouping | choose-grouping | activityGroupDestination |
| prepare-activity-grouping | confirm-groups | activityGroupConfirm |
| inspect-group-settings | inspect-name | groupEditorName |
| inspect-group-settings | inspect-description | groupEditorDescription |
| inspect-group-settings | cancel-editor | groupEditorCancel |
| inspect-grouping-settings | inspect-name | groupingEditorName |
| inspect-grouping-settings | inspect-description | groupingEditorDescription |
| inspect-grouping-settings | cancel-editor | groupingEditorCancel |
| reorganise-source-members | choose-member-destination | memberMoveDestination |
| reorganise-source-members | confirm-member-move | memberMoveConfirm |
| practice-membership | choose-destination | participantMoveDestination |
| practice-membership | confirm-move | participantMoveConfirm |

Offline command `node tools/release/audit-guide-modal-cue-baseline-s1.cjs <php>`
checks9 retained path definitions and12 dialog targets per language. It does not
play paths, infer confirmations, instantiate Moodle or mutate a course.

## Implementation boundary

- Kit highlight class for an external-dialog target, cleaned on clear/exit.
- Existing modal layer with1070 fallback for a body portal, highlight+1 and
  checklist+2; normal highlight1020 unchanged. Verify effective token inheritance
  before assuming body receives variables from the Guide root.
- Keep pointer-events:none, all geometry/observer/focus/Motion/native events,
  server confirmation logic, stable IDs and the original Guide reading state.
- Catalogue/paired examples in Foundations/product for this layering behavior,
  not a competing component or redraw of accepted highlight/checklist chrome.
- Then synchronize/build via the existing atomic Guide bridge and controlled
  preview. Preserve the before/after full unrelated engine/CSS baseline.

## Native gate and loading invariants

For all12 targets, EN/FR at1280/390, normal/reduced and forced-colors: real target
readiness, visible frame paint/order, target-following inner scroll, no pointer
interception, close cleanup and normal1020 beneath Moodle navigation. A temporary
test-only hit probe may detect border paint order, but must restore pointer:none;
never claim the real elementFromPoint returns an inert highlight.

Use the new I1–I13 grid; I2/I9/I10/I13 are directly relevant, I8 Motion must be
preserved, other lines require explicit unchanged/N-A justification. Modal-local
skeleton integration is future R10-16 work: wait actual readiness, do not mark
those unimplemented loading primitives as passed. Full confirmation/creation
workflows need a separately supervised dedicated test-course fixture. Non-mutating
open/search/cancel or QA progress setup is not proof of business completion.

Status: inventory and static stacking diagnosis pass; S1 correction, paired
design, served native regression and human acceptance remain pending.
