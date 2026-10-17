# R6 — bounded server group actions

Base 4110785e; branch work/codex1/easystud-r6-20261017. Scope from server audit R6:
addusers, addemails, removemembers and deletegroups in ajax.php.

Maximum 500 submitted IDs/tokens before writes (raw ID duplicates count). Each
batch raises the PHP time limit to 180 seconds, uses native APIs inside a delegated
DB transaction, commits only on completion and rolls back/rethrows on failure.
addusers reads enrolment once with batch_reader; deletegroups reads course-owned
groups together. Existing missing/existing rules remain. Add responses now include
skipped counts and an explicit localized partial-match summary. Oversize requests
fail explicitly with no mutations. No new UI component, style or JS behavior.

PASS: 34 isolated assertions execute the actual four endpoint branch bodies,
real batch_reader, membership_assignment and ajax_security; only native bootstrap
is stripped. Fake DB/transaction/native mutation adapters model enrolled/existing/
foreign/missing/managed cases, cap 500/501, duplicate input, partial summaries and
failure injection/rollback for all four handlers. Exact new French strings and no replacement characters are asserted. No Moodle bootstrap/DB/runtime.
Helper MoodleCS 0/0; PHP lint; security escaping, filter engine and B2 transaction test PASS.

LIMIT: browser chunking/progress belongs to Claude (local/cm reserved) and is not
implemented. Until that integration, selections >500 are rejected with the new
message. This is the complete server portion, not end-to-end R6 completion.
Native group deletion file/plugin side effects cannot be rolled back by a database
transaction; isolated rollback evidence covers DB rows and transaction-buffered events.
Native concurrency/event/file behavior still requires Claude's authorized recipe.
