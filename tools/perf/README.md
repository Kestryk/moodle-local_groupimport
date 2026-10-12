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

## AP-E6 server candidate (inactive by default)

`course_structure::get_state()` retains the complete historical result unless
the future `local_groupimport/deferparticipantdetails` option is true. There is
no settings UI or activation in this server lot. An explicit third argument can
select full/deferred data in a diagnostic. Deferred state excludes description
from the initial user query, skips profile HTML/description rendering and marks
`detailsdeferred: true`, retaining empty compatibility keys and all identities,
roles, memberships and existing short profile/copy fields.

`ajax.php?action=userdetails&courseid=...&userid=...&sesskey=...` returns
`{success:true,details:{id,profileimage,description,detailsdeferred:false}}`.
Existing login, sesskey and course `moodle/course:managegroups` gates apply. The
service independently checks the same capability, matching course/context and
enrolment. Merge the returned fields into the existing user payload, not over its
memberships or configured metadata. Photo/description formatting matches the old
100px HTML/native `format_text(..., FORMAT_HTML)` behavior.

Codex1 owns the JS consumer, loading/focus/error behavior and any activation.
The server lot must not be enabled before that consumer is implemented and the
I1-I13 gates are met. No click-network or T054 policy is silently changed here.

Use `-Mode details -Participants 800` for the same fixture/cleanup supervisor.
It measures the served baseline and full/deferred **source candidate** in owned
PHP processes against native Moodle APIs. `--service-root` loads the source
class in that process only. The defer flag is forced process-locally, never
saved; no runtime file is overwritten. The native checks execute the actual
source dispatch, compare every light identity/role/membership, verify heavy-field
restoration, and reject invalid users and synthetic students lacking managegroups.

Measured page gain: 276,800 bytes (0.638%) at 800 users, from 43,403,146 to
43,126,346 bytes. Course-state JSON falls from 2,172,941 to 2,024,941 bytes.
No SQL read reduction is claimed: both state variants measured 807 reads.
Default candidate payload hash matches the served version exactly. This is
server/native API evidence, not served browser activation or human acceptance.
