# Selected Group members — atomic transfer candidate

SM-11 / EED-UI-2026-0073. Source-only service, not a served action or native
integration PASS. The combined human checklist stays open.

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
- No AJAX route, button binding, real Move/remove, fixture role or local data
  mutation was added. Local preview still serves the searchable destination
  tranche with its nine non-mutating native cases.

## Next gates

1. Native isolated transaction/managed-membership failure tests.
2. Guarded endpoint and selected-pair snapshot, shared top Move/Remove and
   equivalent context actions, searchable shared modal and responsive routes.
3. Source-backed Penpot specimens consuming Foundation controls, readback and
   captures. Catalogue a new shared composition if necessary, then preview.
4. Open/search/Cancel proof; actual transfer only under its own isolated fixture
   gate, never during a real-course visual audit.

No new UI/private SCSS/Mustache style is introduced by this service. Platform
owner proposal: keep the isolated PHP scenario ci-reusable logic proof separate
from native fixture tests. SM-12/13 scoped preview PASS remains historical fact;
SM-11 service is a source candidate, not completed UI.
