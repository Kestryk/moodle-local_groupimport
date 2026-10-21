# K21-36 — Release metadata, Privacy and uninstall hook

- `version.php`: add `supported = [405, 503]`, retaining `requires = 2024100700`
  and schema version `2026101801`. This declares the intended release range;
  it does not replace native certification on each supported Moodle release.
- Privacy: declare `local_groupimport_jobs.nextrow`, matching `install.xml`,
  instead of the nonexistent `cursor`. No database migration or stored data
  changes. The PHPUnit metadata test checks both presence and absence.
- `db/uninstall.php`: remove the plugin-owned welcome preference through
  `unset_user_preference`, including cache invalidation, using a closed
  recordset and an idempotent hook. Moodle's native uninstall pipeline handles
  plugin tables, component files/configuration and scheduled/adhoc tasks
  (`lib/adminlib.php`, `uninstall_plugin`).
- Preserve `easyedu_motion_level`: `classes/local/motion.php:35` explicitly
  declares it shared across the EasyEdu family. Deleting it would change other
  consumers. Preserve user tours as core-owned content; no name/content-only
  deletion can prove exclusive ownership or safely delete edited/site tours.
  This minimal hook does not silently apply the broader tour-retirement policy.

`test-k21-uninstall.cjs <absolute PHP CLI path>` executes the production hook
twice with database/preference doubles. Two users' welcome entries are removed;
shared Motion and foreign preferences remain; both recordsets close. It also
loads version metadata and checks all nine declared job fields against the
actual XML schema. PASS. Existing S2 isolated provider suite: **49 PASS**.
All touched PHP files pass syntax checks. Full MoodleCS: **0 errors, 28 existing
warnings**; official local_codechecker other-file checks: **0/0**.

Native `tests/uninstall_test.php` and the enriched Privacy PHPUnit assertion
are supplied but were not executed against a Moodle test database in this lot.
Run from an initialized isolated Moodle test checkout:

```text
vendor/bin/phpunit --testsuite local_groupimport_testsuite --filter 'uninstall_test|provider_test'
```

No native uninstallation, upgrade, runtime deployment or build was performed.
Intake JSON retains its pre-existing merge markers; this document and the
changelog carry the delivery until that separate reconciliation.
