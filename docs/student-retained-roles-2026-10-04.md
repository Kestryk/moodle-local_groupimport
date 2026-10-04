# Retained local test roles - SM-39

The user explicitly requested that the earlier temporary test roles be restored,
kept, and assigned to at least one user. Local Moodle 5.1 course 5 now contains
twelve capability-free QA roles (IDs 33-44) and three new `nologin` users (29-31).
`QA role density Fixture 1` has all twelve roles; Fixtures 2/3 have six each.
There are 24 assignments total. No archetype, capability or real-user privilege
was added. All pre-existing role definitions, course assignments/enrolments,
groups, memberships and groupings match their original hashes after excluding
only the exact owned new IDs. Native APIs create/enrol/assign the fixture.

Ownership and verification manifest:
`%LOCALAPPDATA%/EasyEdu/artifacts/easystud/retained-roles-20261004/fixture.json`.
Setup and verification completed on runtime
`24aeaed4e73e19408e0eeeb0663a16f2f5ed5fdf`; both exclusive leases were released.
PHP lint and supervisor PowerShell syntax checks pass. Repeat provisioning with
the same manifest verifies without duplicating. Old SM-15 temporary runs remain
temporary; their cleanup/history is not rewritten. No automatic successful-run
cleanup applies to this retained successor.

`Invoke-EasyStudRetainedRoles.ps1` takes explicit Moodle/PHP/orchestration paths,
external manifest path and expected clean runtime HEAD, holds both active-runtime
and fixture-write leases, and rejects manifests under either checkout. The PHP
helper permits retained fixtures only on localhost course 5. Future removal must
use this exact ownership manifest and separately requested native cleanup,
not broad SQL, inferred prefixes or the temporary browser supervisor.

Read-only browser proof `easystud-authenticated-20261004T205204663Z-32052`
confirms all twelve QA options in the real role catalogue at 1600/768/390;
no business POST/page error, no fixture cleanup. Its cleanup record describes
browser/credentials/leases, not deletion of these deliberately retained roles.
Source scenario: `student-loading-feedback-preview.spec.js` (local-supervised).

Official coding style consulted: https://moodledev.io/general/development/policies/codingstyle
Native 5.1 APIs inspected in `lib/accesslib.php` and `user/lib.php`.
Other Moodle versions and real transfers remain unverified. Human checklist open.
