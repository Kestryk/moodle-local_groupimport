# EED-UI-2026-0073 - Phase 0, Mass Import and Administration

## Scope

This batch reconciles only the embedded Kit subset required by Mass Import and
Administration, then binds those views directly to the shared component API.
Student management, guided tours, source-hierarchy tables and their responsive
compositions are explicitly outside this batch.

Pinned canonical source: `09f04aa08300cf6da300ed8a7fd4941bdbba98ef`;
canonical `scss/easyedu` tree: `92df6338e9ac3f3c40cb64381bc9506d81f36484`.
The full embedded tree is deliberately not identical because deferred product
slices remain recorded in the canonical Phase 0 drift ledger.

## Lineage

### File-deposit typography alignment — 2026-09-28

Foundations Library and linked Standard instances now use `type-card-title`
(15.68px / 700 / 1.2) for the large file-deposit action title and
`type-caption` (12.16px / 400 / 1.2) for its explanatory sentence. Default,
Hover, Focus-visible, Drag-over, Danger, Disabled and Uploading share the same
roles. File names, progress and metadata remain distinct data roles.

Canonical Kit pin `9dce7ae8c8b8f906ec8c5d16701da79961a7c696` removes the
former hard-coded 17px/700 and 12px/500 pair from the Moodle adapter. EasyStud
embeds the exact changed SCSS modules; product-Penpot propagation, Sass/runtime
validation and human visual acceptance remain separate gates.

### Upload correction continuation — 2026-09-28

Kit pin `79d273b` corrects native progress containment, cloud glyph layout,
drop-state presentation and measured empty border dashes (11px/11px). Deposit
events use Moodle native upload handling rather than starting a second XHR
in the window-level route. Tests now hold the real draft request to inspect
progress; body-only uploads do not prove that state.

External-worktree AMD build: `node tools/release/build-csv-import-amd.js
<moodle-build-root>`, using Moodle's Babel plugins and Terser without editing
the shared build checkout. The direct Grunt invocation cannot resolve an
external worktree's component name; it was not counted as a passing build.

Foundations uploading component: `01e728c3-f1ef-80b3-8008-b455f30e0638`;
Library host `01e728c3-f1ef-80b3-8008-b455cd0657f5`, Standard host
`01e728c3-f1ef-80b3-8008-b45641fa2c5d`, linked Standard instance
`01e728c3-f1ef-80b3-8008-b45697d257bb`. Readback/export completed;
human acceptance and EasyStud project propagation remain pending.
Description-to-navigation exact measurement awaits the EasyStud project.

```text
EasyEdu UI Kit SCSS <=> Penpot EasyEdu Foundations
          |
          +--> exact synchronized Phase 0 files in EasyStud
                         |
                         +--> Mass Import / Administration placement adapters
```

Migrated surfaces use the Kit's bundled Inter through the single
`--easyedu-font-family-ui` contract. Legacy non-migrated surfaces still inherit
Moodle's active theme font.
All headings are mapped to the named Kit roles; no product page-title alias or
local weight scale remains for these two views.

## Implemented

### Selected-file and control-state continuation — 2026-09-28

Foundations `08.4.1` Library masters and their linked `08.4` Standard instances
now show M/L selected-file type icons and linked remove actions. Large multiple
states show one CSV/XLS/image type and remove action per row; compact multiple
states show the three types plus Remove all. Mass Import deliberately remains a
native Moodle single-file picker (`maxfiles = 1`), while the reusable family
documents explicit multi-file consumers without enabling them automatically.

The runtime decorates Moodle's selected filename without replacing its draft
ID, progress or validation lifecycle. Removal calls Moodle's authenticated
`draftfiles_ajax.php` delete action, then resets the native filepicker change
state. Upload-panel disclosure and Select/Deselect label changes consume the
shared Motion timings. Button icon slots/gaps, checkbox transition, preview
notice caption sizing and generic table-header alignment are Kit-owned.
Canonical Kit implementation pin: `0a121f0b7c729c6f688b3d04542739de7aa5ebc1`;
AI contract continuation: `b3e4d7dbe98be30371976da7ba885d7d18b5e3ed`;
canonical SCSS tree: `ad55b04be6b89485ca91c1e98c1d2b43daeacc19`.

- direct `type-page-title`, `type-section-title`, `type-control-label`,
  `type-body`, `type-caption` and `type-eyebrow` bindings;
- one shared square/centred `section-icon-tile` for Mass Import and
  Administration heading icons;
- canonical generic data-table typography and Mass Import table surface;
- centred import, report, modal and Administration completion action rows;
- canonical native select, multi-select and colour-control primitives;
- K3/K3.1 Skeleton section frames for Administration and the existing Mass
  Import skeleton consumers;
- removal of the late Mass Import/Administration typography override layer.

## Preserved product ownership

- Moodle form names, ids, submission and filepicker behavior;
- Mass Import grid collapse, upload lifecycle, preview data and report logic;
- Administration PHP settings definitions and persistence;
- loading readiness and fail-open JavaScript;
- routes, permissions, translations and responsive breakpoints.

## Validation boundary

### Visible convergence follow-up

#### Class-first correction following human rejection

The user rejected the visual approximation and local CSS approach. Initial
Mass Import now consumes canonical `.easyedu-*` classes from
`easyedu/_foundation-classes.scss` and `easyedu/adapters/_moodle-file-deposit.scss`.
381 lines were removed from the view partial. These two imported modules must
remain identical to Kit `a59a251b3529116ad306b66ba22c1cf2c7d06778`.
The third canonical module, `_data-classes.scss`, covers the preview table,
notice, choice controls, search toolbar and status labels.
The product entry point emits them without style declarations; PHP supplies
business content and preserves native form semantics. Inter is embedded from
the Kit; the earlier theme-font/proxy decision is superseded for migrated
Mass Import and Administration chrome, not authored user content.

**Still incomplete:** preview/report/history/dialogue visual recipes and the
rest of the legacy embedded Kit drift. Neither the whole plugin nor every
Penpot state is 100% migrated. The measured initial composition excludes
Penpot specimen headings and Moodle's own course header, which are not plugin
components. Full fidelity needs remaining state comparisons and human review.


The first pass was structural, not a complete Penpot visual migration. The
2026-09-27 follow-up uses the initial Desktop Mass Import board
`5daf2376-ada4-8014-8008-ad9c0e35b6c1` as measured evidence: 16px section
titles, 14.4px descriptions, 24px panel padding/gap, matching 40.8px icon tiles.
Kit `bba963c1dbd6b031871fb10b21f5319602a84986` adds the opt-in solid
`file-deposit` shell; the Moodle adapter preserves the native field, accessible
label, file list, progress and choose-file button. No import action is added.
Administration overview headings and descriptions use panel/body roles.

The updated local-supervised responsive spec adds 1024px and scrolls Boost's
actual scroll container for overlapping captures. Earlier `fullPage` captures
showed only the first viewport and must not be cited as full-page proof.
Selected-file/preview behavior and human visual acceptance require their own
results; compilation and geometry checks alone do not prove them.

### Native theme boundary correction

The 2026-09-27 browser check found that Boost's automatic table styling
overrode cell border widths despite the new Kit table classes. The recorded
matched cascade identified the four-`:not()` native selector, not a need for
another local CSS layer. The consumer now opts out with Moodle's `table-reboot`
class. The Kit Moodle adapter also suppresses the duplicated accepted-types
paragraph adjacent to `filepicker-wrapper-*`, retaining the accessible native
text and visible equivalent requirements strip. The responsive scenario saves
the matched cascade JSON and a close-up table image before border assertions.
The diagnostic run `easystud-authenticated-20260927T181328732Z-58172` failed
before this correction; it is not passing evidence.
After this correction, run `easystud-authenticated-20260927T181701424Z-27296`
passed upload/preview and Administration geometry at 1440, 1024 and 390px.
Screenshot inspection then found the missing icon-label gap on the import
action; it was fixed in the canonical button recipe and added to assertions.
Final focused run `easystud-authenticated-20260927T182100088Z-28420` passed
against runtime `dd65d48ecc2a447e793fead85018c788d50799b1` (source
`f880bcd1db4467d61e3852f07c203a2f582b3877`). The scenario checked actual
draft upload and preview, cell borders, 40px editable controls, 10.4px icon-label
gap, loaded Inter, responsive column counts and document containment for
Mass Import and Administration. Desktop preview and mobile preview captures
were inspected. No import, membership update or settings save was executed.
Credentials were cleared and the runtime lease released. Selected external
captures are retained in the run manifest; no evidence was deleted.

### Remaining visual migration (not human accepted)

- Replace the two wide preview summary strips with the measured Penpot
  summary composition; preserve live counts and translated business labels.
- Reconcile the collapsed upload rail, including its CSV caption, with the
  accepted component geometry rather than adding product-local decoration.
- Migrate report/history/rollback/modal recipes and verify their real populated
  states, not only empty examples.
- Finish Administration's public-class/native-form adapter: its current
  responsive checks prove containment, not complete Penpot visual parity.
- Recheck icon artwork, focus/disabled states and complete mobile table
  navigation. The legacy embedded Kit differences remain explicitly deferred.

Source/shared-module contracts and responsive geometry are separate from
human visual acceptance. The scope is not complete and must not be reported
as a 100% Penpot match based on this passing smoke scenario.


Static Sass compilation and contract tests remain required in this batch.
The authorized Moodle 5.1 preview applied consumer commit
`c8322c8323f01c6a95f858428c8137fdf1ba127d` as preview commit
`75f8248824b01eb7b312c1baaeee5b1980e5fd4b` and purged caches.

Focused authenticated browser evidence then passed:

- Mass Import narrow containment at 390 px;
- Administration real-content keyboard focus at desktop width;
- `phase0-mass-admin-responsive.spec.js`, which compares Mass Import and
  Administration at 1440 x 1000 and 390 x 844, requires the expected two-to-one
  column recomposition, rejects horizontal overflow and checks square centred
  section-icon tiles.

The earlier structural responsive run was
`easystud-authenticated-20260927T155039667Z-37956`; it contains four external
review captures and completed with its credentials cleared, lease released and
profile cleanup complete. The older cumulative Platform-wave scenario stopped
before these pages because its unrelated Student Management fixture had no
bottom Group pagination; that failure is not counted as Phase 0 evidence and
was not retried unchanged.

This is Moodle 5.1 runtime and responsive evidence only. It does not establish
cross-version compatibility, accessibility completeness or human visual
acceptance.
