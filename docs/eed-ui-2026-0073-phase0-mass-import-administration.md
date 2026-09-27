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

```text
EasyEdu UI Kit SCSS <=> Penpot EasyEdu Foundations
          |
          +--> exact synchronized Phase 0 files in EasyStud
                         |
                         +--> Mass Import / Administration placement adapters
```

Penpot uses Inter as its visual proxy. Runtime uses the single
`--easyedu-font-family-ui` contract and inherits Moodle's active theme font.
All headings are mapped to the named Kit roles; no product page-title alias or
local weight scale remains for these two views.

## Implemented

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

The final responsive run is
`easystud-authenticated-20260927T155039667Z-37956`; it contains four external
review captures and completed with its credentials cleared, lease released and
profile cleanup complete. The older cumulative Platform-wave scenario stopped
before these pages because its unrelated Student Management fixture had no
bottom Group pagination; that failure is not counted as Phase 0 evidence and
was not retried unchanged.

This is Moodle 5.1 runtime and responsive evidence only. It does not establish
cross-version compatibility, accessibility completeness or human visual
acceptance.
