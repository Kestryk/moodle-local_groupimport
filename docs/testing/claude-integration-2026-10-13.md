# Claude integration — T058, counts and guided paths

Source integration, in order: a667f7df -> d53925a8; 9dd156b4 -> 4f6e58d2;
6ddcd146 -> c7afb652. No conflicts; superseded 332e47a5/5e27b71b not applied.
Preview: f38a914a, cf82bbf1, 2d5bbba3, aaf3a24d (copy/test commit 27fd0b8a).

All requested AMD families rebuilt: course_manager, local/sm (four modules),
searchable_choices, csv_import. Rebuilt files match Claude's committed bytes.
PHP lint passes for lib/manage/ajax/settings and both language files.
Thirteen isolated focus checks pass; generated choice exports execute.
The historical scope test pins cbccc7e and is not an oracle for combined
SM-RENDU/plural changes, so it is not reused as a combined scope claim.

A-TEXTES: FR/EN path 11 step 5 describes immediate verification of an open
destination; path 10 step 1 and its feedback explain starting a drag and
releasing outside a group without a data change. No Kit/design modification.

Native protocol: one 1280px scenario, FR then EN, each in legacy/reactive.
The supervised fixture creates a disposable course with Alpha (one member),
Beta (empty) and four destination groupings initially containing only Beta.
The test reads real badges, checks Move Tab/Shift+Tab/Escape/return focus,
then starts path 11 with isolated Guide storage and confirms Alpha into the
scenario's destination. Step 5 must complete with no close/reopen operation.
The wrapper removes the exact fixture course and its groups/groupings;
the spec restores the original rendering configuration in finally.
The full accessibility inventory and human acceptance remain open.

Predecessors retained externally:
- 20261013T200733633Z-6328: authentication navigation exceeded the original
  15s timeout. Mode restored. Course 68 cleanup initially hit recycle-bin
  backup logging; exact-course cleanup completed separately under fixture lease.
- 20261013T201019545Z-23352: FR/legacy copy, real count badges and Move focus
  passed. Broad grouping text matched another header via nested membership
  tags; destination assertion stopped before confirmation. Course 69 cleanup,
  credentials, child and lease cleanup all passed.

The exact-destination successor matches only the grouping header's exact name.
It retains every count, focus and real-confirmation assertion. The fixture
helper skips recycling only its disposable course through process-local forced
settings; site recycle-bin configuration is not modified. No product fix was
made in response to either harness failure.

## Native result

PASS: easystud-authenticated-20261013T202507953Z-35148, principal preview
aaf3a24d. Four cases in order FR/legacy, FR/reactive, EN/legacy, EN/reactive.
Each passes real `1 groupe / 0 membre` or `1 group / 0 members` badges,
Move initial focus, Tab/Shift+Tab containment, Escape and return focus,
then real path 11 confirmation and step 5 without closing/reopening.
Each reads the served A-TEXTES descriptions; zero unexpected page errors.
External artifact-manifest.json and claude-integration.json preserve evidence.
The disposable fixture cleanup, child stop, credentials clearing and lease
release all pass. Rendering mode restored by finally; legacy read back.

This is bounded N1 acceptance evidence, not a complete T058 modal/accessibility
audit, a native undrawn-destination transfer test, or Moodle 4.5 runtime proof.
No new Moodle API/PHP feature was added by the integration follow-up.
No AGENTS/Kit contract edit: existing focus, native and isolated-proof rules apply.
