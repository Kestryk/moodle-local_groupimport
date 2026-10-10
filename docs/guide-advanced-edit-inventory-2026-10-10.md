# Advanced editor Guide inventory - 10 October 2026

Programme EED-UI-2026-0073, G11-E; existing Source worktree from e42f76d.
Bounded audit, not a new curriculum or a claim of guided-field implementation.

## Actual source contracts

Group and Grouping both use `openAdvancedSettingsModal`, dynamically appended
under the native workspace. Hidden `action` is respectively `updategroupadvanced`
or `updategroupingadvanced`; `groupid` and `groupingid` distinguish the entity.
Both edit `name`, `idnumber`, `description`. Group additionally exposes enrolment
key, image upload and deletion; these must not be exercised in presentation tests.

Members/groupings on a Group and groups on a Grouping are readonly `details`
lists with CSV export, not searchable membership selectors. Do not invent an
edit dropdown or present a source-member transfer as an editor operation.
Existing Cancel removes the dialog only after native exit Motion and restores
focus to a surviving visible opener. Submission persists native settings and
is outside this non-mutating inspection gate.

Current twelve-slide Guide has card Show targets, not advanced editor field
paths/openers. Real editor visibility alone does not implement those targets.
Potential targets must qualify native entity identity, e.g. editor root
`:has([name="groupid"]) [name="name"]`, never match a Grouping field or a
rename input outside the modal. Preserve current paths/history/reading IDs.

## Native protocol

`guide-advanced-edit-inventory-native.spec.js` is local-supervised, not CI-ready.
It requires an existing populated course, saved process credentials and the
runtime lease. For1280/768/390 it enters actual Groups/Groupings at that width,
then uses a visible direct editor control or an available real card-menu action.
An absent action is recorded explicitly: no desktop open then resize, no forced
hidden click, no invented menu item. Inspect native form identity, three editable
fields and readonly lists; open disclosures, Cancel and verify opener focus.
Only font metadata and semantic selector strings are recorded, not field values.
All business writes are denied; Save, CSV, upload and fixtures are never invoked.

Registry/planning submission stays with the shared Platform owner. Run44372
finishes with no errors/writes and complete credential/child/lease cleanup.
Both desktop editors pass identity, readonly lists, Inter13.76px fields and
Cancel/focus. Four compact entries at768/390 are actually absent, not certified
by the inventory's successful completion. Evidence:
`testing/guide-advanced-edit-inventory-native-2026-10-10.json`.

## Bounded native entry correction

The responsive Group fallback previously checked whether the direct cog existed,
not whether it was displayed. A hidden direct cog therefore suppressed the menu
fallback. Grouping had no analogous context command. The successor reuses the
same menu item recipe/icon/label and original advanced editor. It permits only
one metadata-complete Group/Grouping in compact mode when no direct cog is visible.
Multi-selection and incomplete metadata remain rejected. Return focus uses the
actual card-menu trigger, not its hidden action. No saved field, transaction,
Guide history, CSS, template, shared Kit version or Motion change.

`test-guide-advanced-edit-entry.cjs` passes15 production guard cases and exact
unrelated source/PHP/CSS/Guide preservation. PHP lint and official AMD/map build
pass. Strict native successor `guide-advanced-edit-entry-native.spec.js` now
requires all six current-width entries; its served proof remains pending.
Existing menu primitives are reused, so no new Penpot style family is required.
Human acceptance, guided field integration and French/reduced native coverage
remain separate. Rollback removes this audit source/document only; no runtime
data cleanup or user progress reset is required.

## Served successor and navigation diagnostic

Ordered preview applies18679de/e42f76d/62ee50f, including documentary
predecessors. Clean runtime de3eb6d serves the entry correction; cache purge
passes. Run29996 stops on first course navigation at its inherited15s deadline,
before any field/entry assertion; records are empty, not an editor failure or
PASS. Credentials/child/lease cleanup succeeds, with no writes or fixtures.
Preserve its source and run. `guide-advanced-edit-readiness-native.spec.js`
separates a bounded60s navigation deadline from unchanged15s widget checks and
60s workspace readiness. No product or strict entry/focus assertion changed.
Run41824 now passes all six actual current-width entries: direct controls at
1280, existing context-menu recipe at768/390 for both Group and Grouping.
Native fields use EasyEdu Inter13.76px; exact form identity, readonly lists,
Cancel removal and original card-trigger focus pass. No errors, writes, Save
or fixtures; complete credential/child/lease cleanup. Retention dry-run protects
the run with zero candidates/deletions. Proof:
`testing/guide-advanced-edit-entry-native-2026-10-10.json`. This does not establish
startup performance, native advanced-field Guide targets or human acceptance.

## Next bounded integration

Now that actual mobile entry exists, integrate explicit Group and Grouping
editor targets independently. Preserve card Show targets and old path IDs;
do not reinterpret readonly members as a dropdown. Opening/highlight review
must use native entry and completed native exit; never auto-submit, fabricate
Save completion or force a hidden desktop cog. A source adapter must precede
its own canonical checklist/highlight browser proof. Shared styles remain Kit
owned; no new recipe is required merely to identify existing fields.
