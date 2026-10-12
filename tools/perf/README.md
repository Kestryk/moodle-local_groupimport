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

## T052-bis: regions and participant load curve

The same supervisor accepts `-Participants 100` (1..800) and `-Mode curve`.
Use separate runs for 100, 300 and 500; groups/groupings remain 150/40 and each
participant has three memberships. `-Mode regions -Participants 800` measures
PHP/source attribution only, without repeating the already-failed 800-user
browser run. Every run uses its own manifest and the same native cleanup.

The generator's original default long descriptions for groups/groupings are
preserved to keep the fixture comparable with T052. They are a deliberate stress
case, not an assumption that every production group has that much text.

`decompose.php` attributes exclusive spans in the original rendered UTF-8 HTML:
participant cards, group member lists, group card chrome, grouping chrome, data
attributes/JSON, profile image markup, Guide and other page shell. Region bytes
sum exactly to total HTML; nested group/member regions do not count twice.
Attribute bytes include their original source spacing and HTML entity escaping.
Data attributes themselves create no additional elements. Per-field decoded
participant JSON bytes are a separate diagnostic and must not be added to source
region totals. HTML-looking strings inside raw script/style text are excluded
from source element counts. `verify-decomposition.php` checks independent cases.

Source tag counts describe server markup before JavaScript. The load curve also
records the live browser DOM, which includes native enhancement nodes. The two
counts are intentionally named separately. Browser readiness is measured from
navigation, with a 30s threshold. A blocked main thread can postpone the actual
observation beyond that threshold; its observed time is not reported as a
successful ready time. `readinessPassed: false` remains explicit even when the
measurement scenario completes successfully and cleans its fixture.

The reported 5MB threshold uses 5,000,000 original HTML bytes. If the first 100-user
sample already exceeds both limits, the measured crossing is at or below 100;
no exact lower crossing is claimed without additional smaller samples.
