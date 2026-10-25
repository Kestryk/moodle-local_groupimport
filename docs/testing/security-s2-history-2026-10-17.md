# S2 — Privacy and configurable import-history retention — 2026-10-17

Branch: work/codex1/easystud-security-s2-20261017.
Base: origin/work/claude/easystud-regressions-20261016, 6c3ac95f.
Scope: audit S2, decision Kevin: 365-day default, administrator-adjustable days,
daily purge, Privacy user-list discovery, subject export and erasure.

## Behaviour and integration contract

- New native admin setting historyretentiondays: 1–36500 days, default 365.
  Missing/invalid/out-of-range values use 365 rather than a dangerously short period.
- New scheduled task purge_import_history runs daily at 03:R and deletes only
  history rows with timecreated strictly before the cutoff. Recent and boundary
  rows remain. Group, grouping and membership tables are never modified.
- Version 2026101700 registers the task at Moodle upgrade. The upgrade initializes
  an absent setting only; it does not purge or rewrite existing history.
- Purging history also removes its restore data. Changing retention shortens or
  extends that restore window; the admin description explicitly states this.
- core_userlist_provider now includes importer, rollback actor, students in
  desiredstate/addedmembers/removedmembers, and subjects of failed report rows.
  The matching helper is shared by discovery, export and redaction.
- Existing JSON is read portably in recordsets; no database-specific JSON operators
  or schema migration. Current email/username/idnumber identifies legacy rows
  without userid; identifiers bound to stored userids survive account renames.
  New imports bind resolved report rows to userid even when enrolment fails.
- Export contains only the subject's rows and their own actor metadata. Another
  student's rows and an unrelated importer's filename/hash are excluded.
- Single/bulk erasure is restricted to approved course/user contexts. It removes
  student rows while preserving peer rows and group structure, clears rollback
  attribution, and removes an importer's own whole record as before. Both declared
  preferences (motion/welcome) can be deleted in the approved user context.

## Validation performed

Commands from this branch, no runtime/bootstrap or database connections:

    php tools/release/fixtures/s2-privacy-isolated.php
    node tools/release/test-security-escaping.cjs
    node tools/release/test-filter-engine.cjs
    php -l <each of the 12 touched/new PHP files>

PASS: 43 isolated checks executing the real provider/helper/task against in-memory
Privacy/DB adapters. Includes legacy failed rows, case matching, stored old IDs,
explicit-id precedence, no third-party export, scoped single/bulk deletion,
preference scope, unchanged peer/course data, 365/custom/invalid retention,
strict expiry boundary, idempotence, closed recordsets and business-table isolation.
PASS: PHP syntax 12/12, security escaping, filter engine, git diff --check.
MoodleCS on provider/helper/task/registration/provider_test: 0 errors, 1 existing
MOODLE_INTERNAL warning in provider_test. No new styling, templates, AMD or builds.

Three Moodle provider_testcase scenarios added to tests/privacy/provider_test.php:
legacy discovery/export, approved erasure (single/bulk/foreign-course), retention.
The two existing preference tests remain. These PHPUnit integration tests were
NOT run: they require Moodle's isolated PHPUnit database, which this task did not
authorize touching. Run them on an owned test installation before integration
acceptance; no native 4.5/5.1/5.3 or production Privacy acceptance is claimed.

## Limits and next integration gate

Historical failed rows with no userid and an obsolete identifier no longer tied
to any account cannot be attributed retrospectively. They still expire through
retention; the new userid binding prevents this ambiguity for resolved future
rows. Malformed JSON is never exported raw; the importer can still delete its
record, and retention removes it. Privacy requests scan history (bounded memory,
linear traversal); this is not a schema/index performance optimization.

Claude integrates/upgrades and validates scheduling/settings/Privacy APIs on an
owned test database before publication. This branch is not served. No localhost,
8052/8054/8055, Apache, MariaDB, Penpot or other worktree was modified.