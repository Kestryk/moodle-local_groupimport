# K17-11 — preserve institution user tours during upgrades

Decision: `RETOURS-KEVIN-2026-10-17.md`, K17-11; continuity audit
`CONTINUITE-V1-V2-2026-10-17.md`, risk 1. Source base `bc3f48f8`.

Never change an institution-created tour or an EasyStud tour which the
institution modified. A single old selector, a name/path match, or matching
text does not prove that a tour belongs to the plugin.

## Upgrade policy

`classes/local/tour_preservation.php` records provenance only immediately after
the plugin itself imports a new tour. `tourbaseline_teacher` and
`tourbaseline_coursehome` in `local_groupimport` configuration bind the imported
database ID, an exact database-state fingerprint, and the shipped JSON digest.
Existing tours skipped by installation/import do not receive a baseline.

The state fingerprint includes every database column of the tour and every
step, including IDs, text, content format, selectors, ordering and raw JSON
configuration. It also includes every attachment metadata column, including
content hashes. Driver integers/strings normalize to strings; null stays null.
JSON whitespace/key-order changes count as modifications. Added or removed
steps/files and newly introduced database columns fail closed. Progress is not
configuration and is preserved independently.

Before an update, both provenance and the entire current fingerprint must
match. A missing/corrupt baseline, missing tables/API, missing tour, or invalid
destination definition causes no update. A destination already installed is
inert. Unchanged proven imports update within a delegated DB transaction,
keeping the tour ID, its sort order and all user preferences. Only that tour's
steps are replaced through native APIs. `tour::remove()` is deliberately not
used: it renumbers unrelated tours and deletes progress preferences.

Both dangerous historical operations are replaced by this guard:

- `2026071300`: no replacement based on one old Mass Import target.
- `2026101500`: no unconditional course-home role-filter rewrite.
- New savepoint `2026101701`: guarded refresh of both shipped definitions.

There is no automatic adoption of old unmarked tours. The historical installer
saved neither origin nor installed-state snapshot. A byte-identical
institution-created copy is indistinguishable from an old plugin import.
Preservation takes priority: these tours, including their old targets/role
filters, remain unchanged. Future baseline capture cannot reconstruct whether
an administrator edited an older tour. This fix cannot recover modifications
lost during a migration already run by an earlier package.

The shipped JSON definitions themselves remain unchanged. Historical fixtures
are byte-exact Git blobs from stable tag `v1.0-groupimport-csv`, commit
`741a3e66`: teacher `51949e9b57419585b2ee8f10ea7e714546d43cb1`, course-home
`f413a07e5c51b4b010cd13ba06f877c013cb8ed0`. They are test data only and never
provide automatic production ownership inference.

## Isolated native protocol

`tools/release/test-tour-preservation-native.php` accepts only the three
authorized pool roots and verifies their wwwroot. Acquire that pool's atomic
lease first. Invoke the file directly from this worktree; no deployment,
browser, cache purge, real-tour edit or real user action is required:

```powershell
& '<workspace>/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe' `
  '<workspace>/worktrees/easystud-codex1-tour-preservation-20261017/tools/release/test-tour-preservation-native.php' `
  '<workspace>/Moodle 51 Claude/moodle' `
  '<workspace>/artifacts/easystud-tour-preservation-20261017/native-8052-run001.json'
```

All fixture imports, edits and preferences live inside one transaction which
always rolls back. Existing tours are only read. The final report requires
exact before/after row hashes for all tours, steps and user preferences, all
user-tour attachments, and all plugin configuration. Config/tour caches are
invalidated after rollback, and the owned pool lease is released separately.
Auto-increment counters may advance despite rollback; no fixture rows remain.

For EN and FR, the matrix verifies both intact proven historical definitions
update to an independently imported current definition, with the same tour ID,
sort order, completed/requested progress and repeat-run inertia. Independent
mutations cover tour name/description/path/enabled/order/config/end label/step
numbering; step title/content/format/type/target/order/config; added/removed
steps; corrupt baseline; unmarked identical/copy/third-party tours. Every
preserved case compares its complete native database state, independently of
the production fingerprint.

The fixture models a prior package's saved definition digest after a real
native import; it never adopts a real existing tour. This is a transactional
test of real user-tour APIs and the production guard, not a full historical
plugin upgrade, browser proof or human acceptance.

## Evidence and integration

External evidence directory:
`<workspace>/artifacts/easystud-tour-preservation-20261017/`.

Native result: **PASS, 46 cases**, Moodle 5.1 (`501`), PHP 8.2.4, on the
leased 8052 pool. `native-8052-run001.json` records exact before/after equality
for all five state families and successful fixture rollback. The lease was
released after verification. No existing tour or progress row was written.

PHP 8.1.10 syntax checks cover all five touched PHP files. MoodleCS uses the
existing `<workspace>/tools/moodle-codechecker` installation without exemptions.
`test-security-escaping.cjs` and `test-filter-engine.cjs` use Node 22.11.0.
`api-source-compatibility.json` records signatures/hashes of the core tour/step
APIs read from local Moodle 4.5, 5.1 and 5.3 sources. Source agreement alone
does not certify native 4.5/5.3 execution; the native pool is 5.1/PHP 8.2.4.
The plugin minimum remains unchanged by this lot.

Reserved integration version: `2026101701`. The independent background-import
lot reserves `2026101702`; retain both savepoints when integrating and use the
highest integrated version in `version.php`. No AMD or CSS build is necessary.
Rollback is a source revert before deployment; never downgrade a live site's
savepoint or delete its baseline manually as a repair. Baseline data contain
only an ID and hashes, and no credentials or tour text.

Native matrix results and cleanup are recorded in the external JSON report
and summarized in the lot's intake. The shared ETAT/PASSATION files and the
platform's separately owned plan/state files are outside this lot's allowlist.
