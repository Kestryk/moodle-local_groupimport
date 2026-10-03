# Selected Group members — atomic transfer candidate

SM-11 / EED-UI-2026-0073. Source candidate now includes endpoint and actions;
not yet served or a native integration PASS. The human checklist stays open.

## Existing behavior and native constraints

`removeMembers` already submits explicit Group/User pairs, not unenrolment.
The structure toolbar has Remove member(s), but selected members have no Move
destination. Existing Participant Move adds memberships; it cannot represent
transfer from specifically selected source groups.

Native Moodle `groups_add_member` may return false without throwing, notably
for deleted/unenrolled users. Never remove an origin after that result.
`groups_remove_member_allowed` consults component-managed restrictions.
Keep native group APIs in charge of their cache/event/conversation/hook work.

## Prepared service

`membership_transfer::move_members(courseid, destinationid, pairs)` receives
explicit `{groupid, userid}` pairs. It enforces course managegroups, validates
destination, every source membership, enrolment and removal permission, and
uses one delegated database transaction. Duplicate responsive pairs are handled
once. Existing destination is retained; source=destination is a no-op; unrelated
groups and enrolments remain untouched. A failure rolls back membership writes.
Counters distinguish added destination, removed source and unchanged pairs.

The future endpoint must also require login/sesskey, sanitize both parallel ID
arrays and reject unequal lengths. Invoke the service once, not one request per
member or a browser add-then-remove sequence. Snapshot selected pairs on modal
opening; do not silently substitute a changed selection during confirmation.
Keep separate existing Participant/Group commands and original Motion.

## Evidence and gaps

- PHP lint passes for service and all test sources.
- `php tools/release/test-student-membership-transfer.php` passes with isolated
  in-memory API/transaction doubles only: deduplication, unrelated membership,
  multiple origins, same-group/existing destination, capability, malformed/stale/
  foreign/protected input, unenrolment and late add/remove failure rollback.
  It never loads Moodle config or connects to any database.
- Six native cases in `tests/service/membership_transfer_test.php` are candidates
  for an isolated Moodle PHPUnit DB, NOT executed. The local runtime has no
  PHPUnit config or entry point. Never run those fixtures on ordinary course 5.
- Doubles do not prove native DB isolation, event order, conversation/cache
  consistency or external hook side effects. Native integration remains open.
- The original service-only checkpoint `8d78b5e` had no AJAX/button binding.
  The continuation below adds those adapters, but no real Move/remove, fixture
  role or local course-data mutation is used to claim a visual PASS.

## Action adapter continuation

- Guarded POST `movemembers` maps equally sized sanitized Group/User arrays
  to one service invocation. Existing other AJAX branches are byte-preserved.
- Top structure actions place Move member(s) beside Remove member(s). Existing
  right-click selected/single-member semantics and the native sticky mobile bar
  expose the same transfer, not a new inline mobile addition form.
- The shared searchable destination modal freezes/deduplicates explicit pairs
  on opening. Busy disables double confirmation and closing during the request.
  A rejected request leaves selection/rows intact. Success updates all source
  and destination copies and preserves unrelated group memberships.
- No private CSS/SCSS or inline Mustache style; the only template addition is a
  translated member-specific helper. Kit chooser and canonical dialog footer
  are reused; original Motion and Participant/Group command bodies stay exact.
- Three isolated actual-controller DOM scenarios pass in external run
  `EasyEdu/artifacts/easystud/member-transfer-20261003-c`; native APIs are mocked.
  The successor contract checks legacy AJAX/commands/Motion/CSS independently.
  The old search-only whole-file pin gate remains scoped to its historical
  revision `afccee2`; SM-11 explicitly changes endpoint/template/controller.
- Product page 04 has source-backed desktop/mobile transfer examples, linked
  Foundation chooser/Cancel/Confirm providers. Painted helper and button labels
  fit their lanes; both footer controls retain 37.6px height/14.08px Inter.
  See `docs/testing/student-selected-members-penpot-2026-10-03.json` and external
  `EasyEdu/artifacts/penpot/member-actions-20261003` captures. Agent visual proof
  does not close human approval or all-state publication.

## Next gates

1. Native isolated transaction/managed-membership failure tests.
2. Fresh native top/context/sticky-mobile open/search/Cancel proof and paired
   footer geometry; do not confirm a transfer during the visual audit.
3. Source-backed Penpot specimens consuming Foundation controls, readback and
   captures. Catalogue a new shared composition if necessary, then preview.
4. Open/search/Cancel proof; actual transfer only under its own isolated fixture
   gate, never during a real-course visual audit.

No new UI/private SCSS/Mustache style is introduced by this service. Platform
owner proposal: keep the isolated PHP scenario ci-reusable logic proof separate
from native fixture tests. SM-12/13 scoped preview PASS remains historical fact;
SM-11 service is a source candidate, not completed UI.

## Reproducible checks and handoff

`tools/release/test-student-selected-members-contract.ps1 -KitRoot <Kit>` checks
current successor source pins and byte-identical canonical recipes/controller.
`node tools/playwright/student-member-transfer-contract.cjs <playwright-package>
<new-external-owned-run>` checks actual dialog code using isolated DOM/API
doubles and guards unchanged legacy command/Motion/CSS/template/endpoint lanes.
`save-selected-members-snapshot.ps1 -Name <unique-name> -File <exact-allowlist>`
copies only supplied source files and verifies SHA256 before publishing metadata.
Generated AMD comes from the two versioned builders, never manual edits.
Source spec discovery is separate from native execution; the real-course visual
scenario blocks every plugin POST and only opens/searches/cancels.
