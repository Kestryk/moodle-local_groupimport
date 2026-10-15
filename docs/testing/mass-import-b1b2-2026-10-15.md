# Mass Import B1/B2

B1: previews stay server-owned in the session, scoped to course and token, TTL1hour/5previews. Confirmation sends changed editable rows and excluded indexes in one bounded JSON field; filename/hash come from saved preview. No-JS fallback validates all cell arrays and trailing row-count sentinel. Tokens consumed after successful execution, foreign/expired/truncated submissions refused. Files5MB, previews5000rows; synchronous B2 cap follows separately.

Isolated PHP17 checks PASS:1500rows edited last cell, exclusions, missing fields, malformed/count mismatch/duplicates/out-of-range, no-JS complete and truncated, token/course/expiry/consume. Built AMD real Chrome isolated fixture PASS:1500rows,3posted fields,1499filtered rows still included; changed last cell and exclusion intact,0pageerrors. This fixture is transport proof, not native Moodle import/rollback or human validation. No reserved Claude module modified.

B2 interim synchronous solution:1000rows/5MB, displayed on native picker. Larger previews rejected before validation/application; confirmation rechecks cap before transaction. Raise time allowance120s. Membership mutations and history share a delegated transaction; Throwable or missing history ID rolls back, clears success and displays a localized failure. Preview token consumed only after commit. History JSON encoding throws on failure. Per-row lookup optimization/background queue remains future work; the explicit cap is the audit-authorized interim solution.

Isolated execution checks PASS: commit follows memberships+history; callback failure and missing history roll back;1001rows never start transaction. Real DB/browser proof follows publication; this fake DB test does not certify database engine rollback. Initial test double had wrong Exception constructor signature; fixed harness only.

## Served verification
Runtime72225abc, purgePASS; Sourcef0984fc3/72e18d5a plusrecipe453d2955. Native easystud-authenticated-20261015T165404469Z-50652 PASS: real existing drop-upload path, two-row Moodle editable preview, changed last group name with accented/HTML-sensitive text, first row unchecked; valid confirmation intercepted, nine bounded fields and exact JSON captured. Deliberate count mismatch POST refused before application. CLI real DB injected failure rolls back raw temporary group AND history, baseline history count preserved, zero persistent fixture rows. Zero page errors. No successful business import applied and no complete restore-path/human acceptance claimed. Draft upload is temporary; session preview expires normally.

Earlier164934172Z-37008 and165211252Z-23640 retain picker harness failures (upload input not attached, first without repository tab, second after tab at5s); no import applied. The drop successor tests the existing supported upload path, without changing product picker behavior. Full picker interaction/latency is not certified by this lot.

Visual impact for Claude/Penpot: native Mass Import picker requirements, added1000rows/5MB limit copy, resting FR desktop. No existing card, palette, layout or Motion changed.
