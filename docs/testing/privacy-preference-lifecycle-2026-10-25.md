# Privacy discovery and preference lifecycle tests

## Expected behavior

Privacy discovery must return the context containing a stored preference and
the course contexts containing a subject's import history, including legacy
payloads and failed rows. Export must include only that subject's data and
continue to exclude peer identifiers. Approved user-context deletion removes
the preferences declared by the provider, without erasing another user's
choice.

Uninstall removes the plugin-owned welcome-generation preference for all users.
It retains `easyedu_motion_level`, which is shared by the EasyEdu family, and
preferences owned by unrelated components. Repeating uninstall cleanup remains
safe. Privacy erasure and plugin uninstall intentionally have different scopes.

## Moodle API details relevant to the assertions

`contextlist::add_from_sql()` returns database-supplied `ctxid` values, while
context objects cast their id to integer. The SQL values can be numeric strings
depending on the database driver. The core context-list tests account for this
representation difference. Normalize discovered ids to integers before the
strict membership assertion; never remove the expected-context assertion or
accept an empty list.

`get_user_preferences()` uses a supplied user object's `preference` property
as a local cache. A retained object does not get updated when another call
erases preferences by user id. The provider and uninstall hook operate by id,
so post-erasure checks must read fresh state by id and inspect the actual
`user_preferences` records. Also exercise the current `$USER` cache, which
Moodle's preference APIs explicitly update. Do not alter product deletion code
to mutate arbitrary user objects retained only by a test fixture.

## Verification

Run the three original failing methods unchanged first and retain their logs.
Then execute the corrected methods and the entire `local_groupimport` test
suite with the real Moodle PHPUnit bootstrap, `--fail-on-warning` and
`--testsuite local_groupimport_testsuite`.
An isolated database prefix and dataroot are mandatory; never point PHPUnit
at normal site tables. Compare the full-suite count and retain all existing
privacy export/exclusion and shared-preference preservation assertions.

Additional negative probes can temporarily omit preference discovery, privacy
erasure or uninstall erasure in the disposable plugin copy. Each corrected
test must reject its corresponding omission. Restore the original copied
file after every probe and rerun the full suite. Keep probes, credentials,
database data and generated reports outside the product repository.

## Verified result (2026-10-25)

On Moodle 5.1.3, PHP 8.2.4, MariaDB 10.11.14 and PHPUnit 11.5.12:

- Original full suite: 57 tests, 217 assertions, 3 failures.
- Corrected targeted methods: 3 tests, 34 assertions, no failures.
- Final full suite after restoring all negative probes: 57 tests,
  245 assertions, no failures, exit 0 with `--fail-on-warning`.
- All three negative probes failed at the expected assertion.
- PHP syntax and Moodle coding-standard checks: no errors or warnings.

PHPUnit 11 reports 14 existing docblock-metadata deprecations before and
with this change; none was suppressed. The repository CI uses Moodle 4.5
and PHPUnit 9.6 with both MariaDB and PostgreSQL; that separate CI matrix
must still run on the delivered commit. Production deletion code is unchanged.
