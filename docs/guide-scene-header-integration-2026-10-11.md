# T009–T011 — shared scene header integration

Continuation after the saved T007 proposal: Kevin requested continued work.
This authorizes integration; the human acceptance checklist remains deferred.
Canonical Kit0.4.173 supplies every new layout/style rule. Consumer changes are
localized scene labels and synchronized template/controller/generated assets.
No Mustache inline styles or plugin-specific SCSS override were introduced.

Timed membership/action/inspection scenes now own a header containing existing
manual Start, applicable Add/Move mode controls, live instruction and playback.
The header owns sticky positioning; reveal accounts for its entire height.
Small density is retained. Phone stacks Start beneath modes. Playback controls
are hidden at rest/after completion; mode choices remain disabled during play.

The membership strip explicitly labels expected memberships before Start.
Changing mode updates source/target consequences and the ready explanation,
while leaving illustrated source cards intact. Start restores actual initial
memberships; the existing final choreography still owns the finished result.
Reset returns to default ready Add (or Actions for the action scene).

Translated phase captions show Ready, current/total, mode and paused state.
Counts derive from actual applicable explanation rows: desktop Add2, compact
Add4, Move4, and inspection's own phase list. Clocks, word-based reading time,
pause remaining time, Next's gate and the full drag/drop animation stay intact.
Historical sibling-live templates retain their fallback. Existing twelve
reading IDs, storage migration, paths and dedicated interface cue are unchanged.

## Verification boundary

- First header-only implementation passed48 existing EN/FR, normal/reduced,
  three-width manual-entry scenarios and six isolated header geometry cases.
- The T010/T011 successor passes six production-payload cases with strict
  expected Add/Move copy, preview memberships, phase1/4, mode lock, Reset and
  painted-text containment. External run `scene-header-integration-20261011-b`.
- The final successor also passes48 EN/FR normal/reduced manual lifecycle
  cases, including finish, replay, Reset, departure and re-entry.
- Original header-only run `scene-header-integration-20261011-a` is retained;
  it does not certify the later expected-outcome/counter additions.
- PHP syntax and canonical synchronization pass. Generated AMD uses the existing
  deterministic compiler; no course/bootstrap command runs in isolated tests.
- Isolated fixtures do not load Moodle's complete font/icon cascade, so their
  screenshots are structural evidence. Actual icon/type paint requires native
  Moodle proof, using `guide-scene-header-native.spec.js` with isolated QA reading
  state and no business command.

Native preview/proof and human acceptance remain open until separately recorded.
T008 full-slide ordering and T012 expandable recap are separate pending lots;
this integration must not be reported as the complete Claude review delivery.
The T007 product proposal uses existing linked Foundation primitives; this
composition introduces no additional Library master or Foundation style family.

## Recovery

Preserve the code commit as a coherent canonical/consumer set. If integration
fails, retain exact test evidence and repair the measured failure before a new
preview. Do not reset worktrees or replace the existing scene engine. Historical
native scene specifications remain pinned to their original template anatomy.
