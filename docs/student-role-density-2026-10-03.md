# Many roles - SM-15 / EED-UI-2026-0073

Short catalogues retain their native quick role buttons. Above six nonempty,
enabled roles, every width reuses the existing canonical Kit searchable multiple
choice. Below 768px that same fallback already applies regardless of count.
Native select/options, values, OR predicate, reset, membership commands and
Motion remain authoritative. No new paint, inline Mustache rule or private
dropdown is introduced; Kit/CSS bytes are unchanged. The only controller
change is the explicit role count in `updateRoleFilterMode`; AMD is rebuilt.

`test-role-density-mode.cjs` checks fifty width/count/enhancement cases and
selection preservation. `test-student-role-density-contract.ps1` guards exact
source/AMD pins, canonical choices and unchanged paint/markup/business/Motion.
The historical soft-loading gate keeps its default exact behavior comparison;
its explicit `-RoleDensitySuccessor` path permits only this exact mode patch,
not arbitrary controller drift. Historical browser proofs/pins are preserved.

## Bounded local test data

`Invoke-EasyStudRolesDensitySupervised.ps1` first discovers exactly one test,
then holds the active GroupImport runtime lease while the saved-credentials
runner independently holds `moodle51-active-fixture-write`. Its PHP helper
rejects non-localhost Moodle. In the existing local course 5, it creates twelve
uniquely namespaced roles with no archetype or capabilities and three new
`nologin` users, enrolled without a standard role. All identifiers and hashes
of pre-existing relationships are persisted in the external manifest. Creation
is transactional; cleanup checks exact ownership before any deletion.

Native APIs unenrol/delete only the new users and delete only the new roles.
Hashes must prove unchanged pre-existing role definitions, course assignments,
enrolments, groups, members and groupings. Existing users, permissions and group
memberships are never modified. Native deleted-user tombstones and audit events
are intentionally retained, not physically purged. This fixture is temporary,
not a permanent set of roles for manual testing. Unknown ownership or incomplete
cleanup is a blocker, not permission to retry or delete more broadly.

The native candidate verifies twelve real role options, shared search/selection,
no-match retention, exact original OR filtering, reset and containment at
1600/768/390. The browser blocks all non-GET GroupImport requests. CLI fixture
changes are the only authorised business mutations for this test. Credentials
stay process-local; only hashes, fixture IDs and QA labels are recorded.
Native successor `easystud-authenticated-20261003T134726686Z-46720` passes at
1600/768/390 on clean served runtime `ebe133c`, with twelve real QA choices and
two existing roles. Search/selection/no-match/original OR predicate/reset/focus
and contained 38/44/44px triggers pass; all three long-label captures are
inspected and pinned. No browser business POST or page error. The final external
fixture manifest records matching pre-existing relationship hashes; all active
test roles/enrolments/users are removed using native APIs, with tombstones/audit
events retained. Both leases are released and credentials/child cleanup completes.
Proof: `testing/student-role-density-preview-2026-10-03.json`.

Foundations Standard 08.4 and Library 08.4.1 receive paired charted usage notes;
their six existing shared providers/paint are unchanged. EasyStud page 03 adds
`Student management — Many roles / Desktop and Mobile` below the preserved
short-catalogue board with a 160px board gap. The unified filters inherit the
existing multiple-choice/field/More-filters providers, without a product Library
duplicate, new icon or detached control. Readbacks show Inter 14px vertically
centred choice text and zero visible descendant overflow; inspected captures
remain external. `testing/student-role-density-{foundations,product}-2026-10-03.json`
records IDs, before/after usage copy and provider/paint bounds. This publication
shows the closed dense role entry alongside the existing group search, not all
twelve roles in an expanded full participant-card composition.
First native run `easystud-authenticated-20261003T134332397Z-42960` failed
in the test candidate: its unqualified DOM count included two correctly hidden
pre-existing roles after search. The shared controller deliberately retains
those rows/options. The successor counts matching visible rows; all native
selection, no-match, predicate, reset and geometry assertions remain. The
immutable failure is pinned in `testing/student-role-density-preview-failure-2026-10-03.json`.
Both leases/credentials/child and all twelve roles/three users were cleaned up;
the helper's original relationship-hash equality returned true. Future manifests
also persist the detailed post-cleanup hashes. No UI/source-mode change is needed.
Human checklist stays open; no release or production deployment is involved.

## Platform-owner proposal and recovery

Register `student-role-density-preview.spec.js` as local-supervised, with the
separately leased temporary-role fixture, not as a read-only production probe.
Publish the dense catalogue as a product composition using the unchanged
Foundation multiple-choice providers, with the count/mobile rule in Foundations.
This window does not edit shared dirty planning/registry/crosswalk records.
Source recovery is a reviewed successor/revert of the owned commit; fixture
recovery uses its exact manifest and leases, never a broad database deletion.
