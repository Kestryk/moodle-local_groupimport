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
