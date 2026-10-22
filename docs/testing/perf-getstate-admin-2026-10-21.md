# Student Management initial transport and administration profile — 21/10/2026

Base: `06fe1aaf`. Worktree and branch:
`<workspace>/worktrees/easystud-codex1-perf-getstate-admin-20261021`,
`work/codex1/easystud-perf-getstate-admin-20261021`.

## Profile before implementation

Allocated copy: `http://localhost:8052`, atomic pool lease. Course 71 has
801 participants, 151 groups, 40 groupings and 2,398 memberships. One admin,
sequential requests, eight rounds per phase, first round excluded. This is
an isolated diagnosis, not the parallel charge campaign. No benchmark of
20/50 accounts was launched. No database fixture or schema was changed.

PHP has no Xdebug loaded. Temporary, header-gated manual instrumentation in
the allocated plugin measures microtime, Moodle DB read/write/query-time
counters and PHP allocated peak memory at shutdown. Markers delimit original
validation, model read/render phases, JSON serialization, plugin settings
registration and colour-control preparation. Instrumentation is external to
this branch and must be removed by the verified copy restoration.

The original get_state request median is 1.887 s. Model-building phases take
about 0.11 s; the largest model phase is the users loop (60 ms median), SQL
is 30 ms for the whole request, and JSON serialization about 1 ms. Most of
the request precedes the external function. Optimising JSON or introducing
a participant cache would not address that measured second bootstrap.

Administration median is 3.039 s: the interval before this plugin's settings
registration is 2.541 s, registering its options 6.3 ms and preparing all seven
colour controls 2.3 ms. The residual includes Moodle's settings tree, other
extensions and native rendering; it is not evidence against a specific other
plugin. There is one user_info_field read, not a per-option N+1. No costly
plugin-only calculation or repeated initializer was demonstrated, so settings
behaviour and loading were left unchanged. Its load target remains open.

## Change and boundaries

The authenticated document invokes the **unchanged**
`local_groupimport\external\get_state::execute()` after the existing page
login/course/capability checks. This retains the service's validation, context,
front-page rejection, permissions, serialization and errors. The exact result
is encoded as an inert JSON script using HEX_TAG/AMP/APOS/QUOT, Unicode and
invalid-UTF8 handling. Failure omits this optional seed; the original AJAX
error/retry path remains authoritative.

The store consumes that current document snapshot once, validates its schema,
course and list shape, removes the script, and initializes the same Reactive
state. Missing/invalid/foreign seeds fetch normally. `fetchState()` and every
later refresh remain network calls; no session, MUC, browser storage or persistent
participant cache is added. Each document reload rebuilds the payload. The
existing lean page data remains untouched, including grouping headers/filters.
No capability/service/model, templates, SCSS, Motion or administration source
changes are included. No Kit/Penpot update applies to this transport-only change.

## Final isolated measurements

Seven measured warm rounds per phase; sum per round before taking the median.
Native reference is `/user/index.php?id=71` on the same copy, interleaved after
each scenario. Ordinary get_state is still measured separately after the change
as a control, but it is **not** added to the initial flow once the seed is consumed.

| Route / flow | Before median | Final median | SQL reads before → final | Peak PHP before → final |
| --- | ---: | ---: | ---: | ---: |
| Student Management initial flow | 5.014 s | 2.778 s | 109 → 104 | 56 → 50 MiB |
| Document only | 2.452 s | 2.778 s | 92 → 104 | 50 → 50 MiB |
| Ordinary get_state control | 1.887 s | 2.019 s | 17 → 17 | 56 → 52 MiB |
| Administration, unchanged | 3.039 s | 2.790 s | 149 → 149 | 70 → 70 MiB |
| Native Participants | 2.389 s | 2.425 s | 181 → 181 | 56 → 56 MiB |

Initial-flow server median falls 44.6%. Median of paired initial-flow/native
ratios: 1.867 → 0.936. Administration's paired ratio: 1.370 → 1.344; its
unchanged code and seven sequential samples do not prove the ≤1.2 load target.
The spread is substantial and the machine is shared. Do not relabel these
isolated ratios as the historical 10-account result, a charge PASS or a
prediction for 20/50 accounts. Codex n°2 must replay the full charge harness.

## Checks and evidence

- Node 22.11.0: required SM and CM builders pass. Only store AMD/map content
  changes; unrelated generated CRLF-only differences are removed after exact
  normalized-byte comparison. No styles build or dependency upgrade needed.
- `test-initial-state-transport.cjs`: valid seed, consumption once, a changed
  subsequent snapshot, explicit refresh and malformed/missing/wrong-course/schema
  fallback; 15 checks. Permissions call/hex flags/optional fallback asserted.
- Existing escaping and filter-engine tests PASS. Moodle ESLint on normalized
  stdin: base 0/0, candidate 0/0. `php -l manage.php` PASS; MoodleCS touched
  PHP 0 errors/0 warnings. Whole plugin: 0 errors/27 existing warnings.
- Actual pre/post ordinary service payload hashes are identical. Final native
  tests also compare the document seed to a fresh real service result, count
  **zero** initial get_state HTTP calls and **one** on explicit refresh, and
  verify the script has been consumed. FR/EN ×1600/390, both pages, snapshots,
  geometry and console diagnostics are retained externally.

Final native/audit/parity and restoration summaries are appended only after
the respective executions finish. No main localhost publication is authorized.

The base intake JSON already contains conflict markers. It is deliberately
preserved, not silently repaired here. The pending additive entry is supplied
separately in `perf-getstate-admin-intake-20261021.json` for the integrator.

Emplacements à réviser:
`<workspace>/artifacts/perf-getstate-admin-20261021/measurements-final.json`,
`profile-summary-before.json`, `admin-profile-summary.json`, before/final
bench logs and shutdown markers, paired captures and visual JSON;
`RAPPORT-PERF-GETSTATE-ADMIN-20261021.md` in the review folder.

Final gates: FR89PASS/0FAIL and EN89PASS/0FAIL (12INFO each), native missing-seed
fallback PASS with exactly one real request and the same service result. Eight
paired region-main crops have zero changed pixels and identical plugin settings;
all four Student Management computed samples are identical. The full-image
predecessor retains a native Moodle header-block image paint difference in one
FR desktop admin frame (outside region-main), dynamic hidden preference-radio
insertion and per-session hidden form values. These are explicitly excluded in
the scoped successor, not attributed to a product style change. Original raw
comparisons and captures are retained outside Git; do not publish hidden tokens.
The parameterized native candidate is versioned as
test-initial-state-transport-native.cjs; its EN390 two-page run also passes.

Final restoration:1284 backup SHA-256 hashes identical, temporary profiling
helper removed, cache purged, lease released; existing schema1801 retained,
no migration. Whole-plugin MoodleCS0errors/27warnings (external warnings.json),
touched PHP0/0, AMD ESLint0/0. Raw broad checker exits1 because of warnings,
not errors. Reported metrics use the final call through get_state::execute,
not the earlier direct-builder candidate (measurements of both are preserved).

Ratios of page/flow medians to native medians: Student Management2.099 to1.146;
Administration1.272 to1.151. These differ from medians of paired ratios above.
Neither statistic is a parallel-load certification; the Administration target
at20/50 remains explicitly unverified.
