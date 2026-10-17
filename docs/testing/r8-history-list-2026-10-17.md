# R8 ? lightweight recent import history

Base 4110785e; branch work/codex1/easystud-r8-20261017.
The recent-list query returns seven displayed scalar columns and a `haschanges`
bit computed using Moodle sql_length + CASE (NULL/empty = unavailable).
The renderer reads that bit. It no longer fetches JSON/details/hashes/policies
for the twenty recent entries. Restore, matching-import and export detail paths
are untouched. No template/JS/CSS/build changes or new visual decision.

PASS: 68 isolated assertions execute the production function and its real SELECT
against a private SQLite :memory: database, adapted only for Moodle table braces.
25 course rows plus a foreign row, NULL/empty/512KiB detail payloads, rolled-back
states, ordering/default/custom limits and display fields are covered.
Twenty result rows serialize to 4405 bytes with eight columns and no detail blobs.
The computed availability matches the previous test for valid/legacy fixture rows.
Source checks preserve restore/hash paths and bind the renderer to haschanges.
PHP lint, security escaping and filter-engine PASS. No Moodle bootstrap, runtime,
MariaDB, HTTP or native authorization test; SQL is expressed through Moodle DML.
