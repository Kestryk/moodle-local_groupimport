# Developer-debug notices - 16 October 2026

Base: `c2077524`, branch `work/codex1/easystud-debug-notices-20261016`.
Status: static PASS; native NOT RUN. No product or generated file changed.

## Diagnosis and existing corrections

- Reading `$PAGE->url` invokes `moodle_page::magic_get_url()`; if no URL has been set, Moodle emits `This page did not call $PAGE->set_url(...)` at DEBUG_DEVELOPER (5.1 core `lib/pagelib.php`, lines 681-689).
- Commit `d9fa9f09`, already in this base, guards BOTH settings presentation blocks with `has_set_url()` before reading the URL (`settings.php`:225 and :341). Early own-page presentation is scoped by path and section; the settings tree remains registered outside these blocks on other admin pages. No registration or presentation change is needed here.
- Core `page_requirements_manager::js_call_amd()` warns above 1024 serialized argument characters in developer mode (5.1 `lib/classes/output/requirements/page_requirements_manager.php`:1126-1133).
- Commit `d3d2ac51`, already in this base, moved Guide and manager argument arrays to `script#easystud-page-config[type=application/json]` (`manage.php`:201-209), with JSON_HEX_TAG/AMP/APOS/QUOT. The AMD call at :116 passes only its ID. `page_bootstrap.js` parses this element once and passes the original argument arrays to the unchanged Guide/manager init interfaces.
- The relevant settings/manage/source/bootstrap-build files on :8051 matched this base at inspection. The reported legacy calls at manage.php:71/:75 are no longer AMD calls on this base.

## Static evidence

- PHP lint: settings.php, manage.php, developer-debug helper and database-free presentation test PASS.
- `php tools/release/test-settings-presentation.php`: 10 behavioral cases across both actual predicates, with an unset-URL read trap; missing URL/other page/other section/header-started skip presentation, own early page enables it. This uses a test double and does not claim a native Moodle warning reproduction.
- `node tools/release/test-security-escaping.cjs`, `test-filter-engine.cjs`, and `test-page-bootstrap.cjs`: PASS.
- New native spec: ESLint eslint:recommended, zero errors/warnings. Product AMD sources unchanged, lint delta zero.
- No AMD source changed: builds not required. No SCSS, template, language, production JS/PHP or generated asset changed; CRLF retained.
- No new product API/PHP dependency: compatibility is preserved by the unchanged code, not newly certified on 4.5/5.3.

## Native boundary and reproducible candidate

The initial source-wrapper preflight failed because its own `tools/playwright/node_modules/@playwright/test/cli.js` was absent. It stopped before fixture setup. Before retry, :8051 was reserved by run `easystud-authenticated-20261016T193302607Z-20120` until 19:50:02Z (observed 19:47:25Z). Per Kevin's instruction, no wait, lease recovery, runtime modification or native retry followed. No debug configuration was changed. Localhost and ports 8052/8054/8055 were untouched.

Candidate files (NOT native-validated):
- `tools/playwright/debug-notices-fixture.php`: exact Perf path + origin allowlist; record/restore original debug settings; real Moodle legacy URL/oversized-AMD probes versus guarded URL/short-ID transport. No course, membership or user fixture changes.
- `tools/playwright/debug-notices-native.spec.js`: actual developer flag required; FR/EN manager, Mass Import, own settings and another settings section; JSON/bootstrap/Guide/cards readiness and zero debug/console/page errors, result JSON written externally.

When the copy is explicitly free, use its existing installed Playwright wrapper with `-AllowedSpecRoot C:/dev/worktrees/easystud-codex1-debug-notices-20261016/tools/playwright`, this spec, `-MoodleUrl http://localhost:8051/local/groupimport/manage.php?id=5`, `-LeaseResource groupimport-perf-runtime-write`, `-MoodleRoot 'C:/dev/Moodle 51 Perf/moodle'`, and this fixture helper. Keep the wrapper's guaranteed helper cleanup and credential/lease cleanup. Native PASS remains open.

Summary JSON: `docs/testing/debug-notices-results-2026-10-16.json`.
External preflight log: `%LOCALAPPDATA%/EasyEdu/artifacts/easystud/debug-notices-20261016/native.log`.
