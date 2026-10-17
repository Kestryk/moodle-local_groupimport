# Membership transfer test harness — 17 October 2026

Base108f0b2c reproducible fatal: class local_groupimport\local\batch_reader not found at service line64. The standalone harness loaded the service directly without Moodle autoload and its database mock predated batched reads.

Fix is test-only: explicitly include the real batch_reader and extend the database double for enrolled-ID and relationship recordsets, with course filtering and deterministic close. No service or native command changed. The real transfer method and real batch_reader execute together; no replacement reader class or skipped guard.

PASS: duplicate origin pairs, existing destination, same-origin no-op, unrelated memberships preserved, managed removal denied, non-enrolled denied, late add/remove failures roll back the whole transaction; both relationship recordsets closed. PHP lint PASS. This is isolated native-API/transaction simulation, not a database integration claim.
