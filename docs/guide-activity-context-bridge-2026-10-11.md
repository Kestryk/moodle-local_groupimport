# Activity Grouping: native confirmation bridge

## Scope and ownership

EED-UI-2026-0073, Guide priority, existing Source worktree only. Baseline
`c1cdbccacd55f825f5fa29af1811d443da571c87`. Shared Platform planning remains
owned by Platform; this document is the exact local handoff. The existing
Kit context API is consumed, not forked. No new UI, Foundation or Penpot
family is introduced. Component `local_groupimport`, Moodle 5.1 floor unchanged.

## What is implemented

The real native Group destination command captures immutable destination and
Group IDs immediately before its asynchronous batch. Capture is read-only and
requires the active additive path's next enabled `confirm-groups` milestone,
a positive existing Grouping and positive selected Group IDs. Duplicate card
copies produce unique expected IDs, but the original request count is retained.

Only after all native requests resolve does the bridge attempt canonical
`setPathContext`, using the token captured before submission. It refuses partial
response sets, explicit failure, disconnected/hidden/reviewed steps and an
obsolete session token. A successful already-present response counts as target
membership, not a new addition. Only a successful context save emits the typed
milestone. Original notifications, selection cleanup, business payloads,
Add/Move behavior and legacy milestones remain unchanged.

The Group batch is still non-atomic: one request can succeed before another
fails. The bridge never reports the batch complete after that failure and does
not claim rollback. Reset can prevent a late Guide completion; it cannot undo
an already submitted Moodle command. Opening, searching and Cancel submit none.

Course Manager now imports the canonical Guide module; its maintained AMD
builder explicitly adds that dependency. No manual generated-code edits.

## Validation

`node tools/release/test-guide-activity-context-bridge.cjs` passes:

- 63 helper cases: ID/destination validation, immutable capture, matching
  response cardinality, already-present success and stale/hidden/review guards.
- 73 unchanged native command assertions from the immutable predecessor fixture,
  executing the current complete `bindMoveModal` adapter with bridge spies.
- Exact reconstruction of all unrelated Course Manager source and 15 unchanged
  product/historical-test guards; generated AMD dependency inventory verified.

The initial reconstruction test failed because its removal span retained an
extra blank line; the test span was corrected, without changing product code
or weakening the full-source equality. This was an isolated test diagnostic,
not a runtime failure.

## Explicit remaining boundary

The new path/schema/invitation is **not installed** yet, so this bridge remains
inert in normal Moodle. It does not complete an old path, migrate progress or
write any real user's activity context. Same-Grouping verification, bilingual
steps, dependency targets and no-prerequisite copy are the next activation lot.
No new browser, confirmed business outcome or human acceptance is claimed here.
Previous context lifecycle proof remains independently pinned.

Technical docs, changelog, local current-engineering projection and agent rule
are updated together. No Kit source change, public version bump or new artwork.
The combined human checklist and all older Guide/SM lots remain open.
