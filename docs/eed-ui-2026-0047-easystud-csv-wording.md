# EED-UI-2026-0047 - EasyStud Mass Import wording

## Scope

This source-only wording correction gives the user-facing Mass Import entry
points and administration notice a consistent EasyStud name. English and
French language strings are covered, including the course tour labels.

The Moodle component remains `local_groupimport`. URLs, database schema,
upgrade data, APIs and the CSV/Excel import behavior are unchanged.

## Validation contract

- Check that the English and French language files remain valid PHP.
- Confirm the changed strings contain EasyStud branding and no longer expose
  the old generic "Mass group import" wording in the targeted UI labels.
- Run the standard plugin static validation and `git diff --check`.

Preview, cache purge, browser checks, fixtures and runtime leases are outside
this source-only batch.
