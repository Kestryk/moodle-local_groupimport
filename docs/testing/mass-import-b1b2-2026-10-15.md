# Mass Import B1/B2

B1: previews stay server-owned in the session, scoped to course and token, TTL1hour/5previews. Confirmation sends changed editable rows and excluded indexes in one bounded JSON field; filename/hash come from saved preview. No-JS fallback validates all cell arrays and trailing row-count sentinel. Tokens consumed after successful execution, foreign/expired/truncated submissions refused. Files5MB, previews5000rows; synchronous B2 cap follows separately.

Isolated PHP17 checks PASS:1500rows edited last cell, exclusions, missing fields, malformed/count mismatch/duplicates/out-of-range, no-JS complete and truncated, token/course/expiry/consume. Built AMD real Chrome isolated fixture PASS:1500rows,3posted fields,1499filtered rows still included; changed last cell and exclusion intact,0pageerrors. This fixture is transport proof, not native Moodle import/rollback or human validation. No reserved Claude module modified.
