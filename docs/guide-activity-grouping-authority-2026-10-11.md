# Activity-grouping Guide successor: native authority preparation

## Scope card

- Programme: EED-UI-2026-0073, remaining Student Management Guide work, P1.
- Owner: existing EasyStud implementation window; existing Source worktree on
  `work/port4719pg3/easystud-foundations-student-management-20260928`.
- Baseline: `59d42bcc0c5e612dc290d8099711754b1e2ba46c`.
- Includes: actual native Group destination adapter audit, isolated executable
  authority test, non-mutating browser candidate and local roadmap/contract.
- Excludes: product assets, business commands, live progress, database/fixtures,
  Kit/Penpot writes, old-path migration and deferred human acceptance.
- Runtime: only supervised open/search/Cancel requires the active-runtime lease;
  no cache purge, fixture-write lease or course mutation is needed.
- Shared planning/scenario registry: Platform-owned. This local record is its
  exact handoff, not permission to edit the shared registry.
- Moodle component/floor: `local_groupimport`, declared 5.1; no new Moodle API,
  upgrade, compatibility-floor change or additional-version claim.

## Why the old signals cannot be reused

The writer proposes `prepare-activity-grouping`: create or open a grouping,
place the relevant groups in it, then verify that grouping's expected content.
The current `create-grouping` definition and invitation are still retained.
Its first milestone follows successful native grouping creation. It must not
be described as merely opening a view or as completely unimplemented.

The later legacy signal is much broader. Actual member-removal and participant
clipboard-add handlers emit `emitGuidedCompletion(root, 1, 'grouping')`. Neither
operation proves that a Group was placed in a Grouping. Existing grouping
selection/expansion can also emit verification before the expected assignment
is known. The successor must not reuse these signals as its completion oracle.

## Executed native command authority

`test-guide-activity-grouping-authority.cjs` evaluates the actual complete
`bindMoveModal` function in isolated DOM-shaped inputs, not a reimplemented
command or Moodle bootstrap. Its 73 cases cover zero/one/two selected groups,
empty/zero/positive destinations, original-membership removal on/off, already
present/not present, success/failure and Cancel.

Observed behavior:

1. The native dialog marks its context `group`; Participant and source-Member
   contexts are distinct. Opening/searching/selecting/Cancel submit no command.
2. Its chooser lists real grouping IDs, deduplicates them, and inserts value
   `0` for “Groups without grouping”. Zero is removal, never a valid activity
   destination. A positive grouping must be explicitly chosen.
3. `removefromorigin` defaults to false. A positive destination then preserves
   other grouping memberships. Checking that option changes the meaning: remove
   the Group from its other Groupings, keeping the target. Narration must state
   this before the explicit final confirmation, not call every case “Move”.
4. Confirmation submits one `movegroup` request per selected Group. A successful
   already-present response still proves target membership; it is not a new
   addition. The old completion signal fires only when the positive-destination
   batch finishes successfully, not for zero or an empty selection.
5. This Group batch is **not** the atomic source-Member transfer. One request may
   succeed before another fails; the existing catch reloads. The future Guide
   must never promise batch rollback or complete all groups on partial success.

The endpoint source independently checks the Group and destination against the
course and uses `groups_assign_grouping`. That is a source-contract observation,
not backend execution or database outcome proof.

The separate pasted `addgroups` response returns newly added Group IDs but only
an aggregate count for already-present IDs. Missing and ambiguous tokens are
reported separately. A generic success/message or the returned newly-added
array alone is insufficient to prove every originally requested Group.

## Bounded successor design, not yet installed

Use a new additive path ID; do not rename or delete `create-grouping`, remap its
completed steps or reset live user storage. The current 12 reading IDs,
7 invitations and 8 definitions stay unchanged during this audit.

Prefer the native selected-Groups/destination-dialog workflow for both desktop
and mobile. Do not teach the pasted desktop field as the sole compact workflow.
Proposed milestones:

1. Create a Grouping if necessary, or explicitly open an existing one.
2. Select the relevant Groups, not Participants or members inside a Group.
3. Open the Group destination dialog and search/choose a positive Grouping.
4. Check the destination/removal option, then explicitly confirm.
5. Expand that **same** Grouping and verify all expected Group IDs.

Implementation requirements:

- Every event is typed and dependency-gated by the active next unfinished step.
  Presentation/highlights may open/focus controls but never submit a command.
- Freeze the selected Group IDs and destination at confirmation. Do not certify
  a later unrelated grouping, silently use destination zero or infer success
  from a label/count/first visible card.
- Verification needs scoped expected IDs that survive reload/resume/reset
  consistently with the path. Audit the existing storage contract before adding
  this context; a document-only scratch property is not a durable resume policy.
- Re-review and Cancel must preserve native selection and Motion; opening an
  already-active workspace must not silently clear the selected Groups.
- No-groups/no-groupings cases need clear prerequisite copy, not automatic data
  creation, simulated native success or a silently completed checklist.
- The activity lesson must explain that Moodle activity settings still need an
  explicit Grouping choice afterwards. The Guide does not configure an activity.

## Validation and scenario classification

Static PASS: 73 actual adapter cases and two unrelated legacy completion sites.
Adapter SHA256 (LF normalized):
`5e619cd89a5c7eebb0d3b890dde9e82c0bcd9c2bc41a6adc6a6fd0a0fc540a1e`.

Native candidate:
`tools/playwright/guide-activity-grouping-authority-native.spec.js`.
Classification: `local-supervised`, existing course-5 data, no fixture mutation,
POST blocked, open/search/Cancel only, 1280/768/390. It asserts actual language
and media preference, typed Group context, positive searchable destination,
unchecked removal default and unchanged rendered membership pairs after Cancel.
Guide presentation uses an ephemeral QA storage key, not real user progress.
No screenshot review is requested by this lot.

Discovery selects exactly one test before credentials/lease. Running specs are
immutable; failures and their evidence must be retained. Native evidence is
recorded separately when available; do not read a candidate as a passing run.

Native PASS: six cases at runtime
`eec1a3ea8b5cee6a2cce2e60421ed8c8498f7cea`:
EN normal run `easystud-authenticated-20261011T073235803Z-48580` and FR reduced
run `easystud-authenticated-20261011T073419615Z-47716`, each at1280/768/390.
Every case uses real selection/search/positive destination/Cancel; original
removal remains unchecked and rendered membership pairs stay unchanged.
Errors and blocked business requests are empty. Both cleanup reports confirm
credentials cleared, lease released and owned child stopped. Retention dry-run
protects both runs, with zero candidates/deletions. Sanitized evidence:
`testing/guide-activity-grouping-authority-2026-10-11.json`.
This does not prove confirmed assignment, backend rollback, new checklist cues,
new-path completion, FR-normal/EN-reduced combinations or human acceptance.

## Documentation and cost discipline

The local current-engineering projection, changelog and AGENTS contract record
this authority boundary; shared Platform planning remains with its owner.
No reusable UI change is made, so Kit/Foundation/product Penpot component
propagation is not applicable. No public version bump or cache purge is needed.
The test reuses actual bounded source and rejects broad legacy completion;
it avoids regenerating UI assets, cloning scenes or duplicating the Guide engine.
No provider token/cost totals are available; these are workflow observations,
not a numeric quota audit.

Next: implement the typed successor with explicit scoped resume context, then
run bilingual payload/progression checks and native cue/Cancel checks. Confirmed
business outcomes, complete artwork and human acceptance remain separate gates.
