# EasyStud T052 performance baseline

Local-supervised tools for a dedicated, hidden synthetic course (800 nologin
users, 150 groups, 40 groupings, 2,400 memberships and 300 grouping assignments).
There are no product, theme, setting or compiled-asset changes in this lot.
Requires Moodle 5.1, PHP's CLI executable and the existing authenticated runner.

Run `Invoke-Baseline.ps1` with local paths supplied explicitly:

```powershell
.\tools\perf\Invoke-Baseline.ps1 `
  -CredentialLoaderPath '<local DPAPI loader>' `
  -OrchestrationModulePath '<Platform>/tools/orchestration/EasyEduOrchestration.psm1' `
  -MoodleRoot '<local Moodle root containing config.php>' `
  -RuntimeRunnerPath '<served plugin>/tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1' `
  -PhpPath '<local PHP CLI executable>' `
  -OutputRoot '<external artifact directory>' `
  -WaitForLease
```

The runner first discovers exactly one existing Student startup test. It then
owns the runtime lease while the native runner owns the fixture lease. Both are
released in `finally`; credentials stay inside the existing native runner.
`-DiscoveryOnly` does not create data. Every run uses an external ownership
manifest; it never adopts an existing course or user by name.

`create-fixture.php --moodle-root PATH --manifest EXTERNAL.json --action setup`
is idempotent for that manifest. `--action verify` checks ownership.
`--purge` removes the exact owned course/users through Moodle APIs and retains
normal deleted-user tombstones. These commands require the same runtime and
fixture leases. The supervisor also handles partial-setup cleanup. An ownership
conflict stops deletion and preserves the manifest for investigation.

`measure.php --moodle-root PATH --manifest EXTERNAL.json --output EXTERNAL.json
--case CASE` records eight cases: manage, course-state, addemails (50 Moodle
IDs), duplicategroup, deletegroupings (10), movemembers (50), import-preview
(2,000 CSV rows) and rollback (50 recorded memberships). Each action uses
disposable entities inside the fixture and checks its native result. Preparation
and cleanup are outside the measured section. The CSV uses an already-enabled
username or email field; cache settings and identification settings are never
changed. Rollback uses a clearly synthetic history record, not a real import.

Server counters use unmodified **served** entry points and `$DB->perf_get_reads()` /
`perf_get_writes()`. They run in separate CLI processes with native web bootstrap
and renderer; they are not Apache timings. Browser response/readiness timing is
reported separately, with three cached 1280px samples, HTML/DOM size and long tasks.
If the first sample fails readiness, its complete metrics are retained and the
remaining samples are skipped. A complete measurement can therefore report
`measurementComplete: true` and `passed: false`; it is not functional acceptance.
The source HEAD and served HEAD are both recorded. Baseline files describe the
served revision; a later optimization must use the same fixture and cache policy.

Moodle may bundle plugin CSS into theme stylesheets. Home/course measurements
look for real plugin rules and report transferred/decoded bytes for the complete
containing bundle; `stylesSourceBytes` is the separate plugin source-file size.
Neither number is mislabelled as the isolated transferred plugin payload.

The 12 October snapshot records eight passing PHP cases and a failing 800-user
browser startup: 136,180 DOM elements, about 43.4MB HTML and 352.7s of long tasks.
The fixture's setup was repeated without creating new IDs and all owned data was
removed afterward. Moodle's native audit events, user tombstones and course
recycle-bin backups remain under normal Moodle retention.

Raw JSON/process outcomes and cleanup manifests stay outside Git. The compact
`baseline-YYYY-MM-DD.json` is the reviewable measurement snapshot. No rendered
HTML, cookies, sesskeys, passwords or authentication storage is persisted.

The historical startup diagnostic remains unchanged unless the supervisor opts
into T052. This baseline does not certify every I1-I13 interaction; no product
selector, Guide completion, selection, Motion or focus implementation is changed.
