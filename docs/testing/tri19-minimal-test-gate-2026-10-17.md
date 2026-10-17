# TRI19 — minimum test gate
Base 05a84c57. Test infrastructure only; no product/build/runtime changes.

## Executed isolated gate
`node tools/release/test-release-smoke-isolated.cjs PHP_EXE MOODLE_LIB EXTERNAL_JSON`
requires absolute paths and never bootstraps Moodle. It executes existing actual
production policies through standalone adapters: editable preview, execution,
privacy S2, AJAX/manage S4, scoped matching S5, real readers S6, text export S7,
bulk R6, history R8 and formatted XLSX R9, then security escaping/filter engine.
All 13 suites PASS. Per-suite JSON is preserved in external tri19-isolated.json.
This is not a substitute for Moodle PHPUnit or Behat execution.

Added tests/local/import_policies_test.php: three database-free basic_testcase
methods for 500-item bulk cap, literal formula/identifier export and multiline/BOM
CSV plus course size cap. PHP lint and MoodleCS zero errors/warnings PASS.
Native autoloading/assertion behavior remains unexecuted in this restricted turn.
Existing native privacy, identity, transfer/assignment and welcome tests remain.

## Native release gate still required on an explicitly dedicated test installation
- Install/integrate the branch in the disposable test Moodle checkout.
- Initialize PHPUnit using that checkout's own documented test DB/data directories.
- Run its vendor/bin/phpunit --testsuite local_groupimport_testsuite, including
  tests/privacy/provider_test.php, tests/local/import_user_lookup_test.php,
  tests/local/import_policies_test.php and service membership tests.
- On a separately initialized Behat installation run the local_groupimport tag,
  then accessibility. Current files: tests/behat/core-flows.feature (two scenarios)
  and accessibility.feature (one). Core-flows still names legacy desktop layout
  selectors absent from the current template; Claude must update them against the
  actual new layout after the visual freeze and replay. Do not fabricate a PASS.
- Retain logs, exact Moodle/PHP version, locale and test counts before publication.

TRI19 is PARTIAL: isolated gate and native policy coverage prepared, not native
release acceptance. PHPUnit/Behat services, Moodle bootstrap/DB, localhost,
Apache/MariaDB and CI were not accessed. No new visual design decision.
