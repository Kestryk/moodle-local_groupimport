# Mass Import semantic palette: bounded diagnosis (SM-64)

Batch EED-UI-2026-0073. Diagnostic source/isolated evidence, **not a repair**,
native browser result, design publication or human acceptance. SM-01..73 and
the combined user checklist remain OPEN. Guide stays separately owned.

## What was actually measured

`tools/release/audit-mass-import-semantic-palette.cjs` uses the actual compiled
consumer `styles.css`, actual `lib.php` colour/role functions with process-local
configuration stubs, and representative HTML using the classes in `index.php`.
It never loads Moodle config or accesses a session/database. External browser
requests are aborted. Five palettes (official, independent purple Primary,
independent brown Accent, both, restored official) at1600/768/390 yield288
diagnostic assertions. Geometry/type/Motion remain identical within each width.

The export rest-paint check intentionally uses a distinct Bootstrap **sentinel**
before the real consumer CSS. Its unchanged paint proves this consumer does not
override the rest state; it does not prove the real Moodle theme's RGB values,
Bootstrap behavior, font raster or native focus cascade. Do not turn this audit
into a passing implementation test by labelling the reproduced gaps as fixed.

Command: `node tools/release/audit-mass-import-semantic-palette.cjs <node-modules>`.
Syntax check and diagnostic288 PASS on Source6cfe2a7 implementation. No screenshots
or media were generated; the owned isolated browser exits in finally.

## Crosswalk before a canonical correction

| Existing surface | Source / shared provider | Verified current behavior | Next correction boundary |
| --- | --- | --- | --- |
| Large Primary/Success panel rails | `easyedu-panel`, `easyedu-panel--success`; Foundations classes + `panels.custom-semantic-rail` | Both independently follow chosen Primary/Accent through existing role flags. | Preserve the already served SM-57 mapping, geometry and defaults. |
| Primary/Success icon tiles | `easyedu-icon-tile` / `--success`; section-icon-tile + Foundations classes | Foreground and soft surface follow their independent validated role. | Do not enlarge Compact glyphs or change accepted centering. |
| Preview notice | `easyedu-notice` / data-classes | Primary surface/glyph mapping already works; its published border remains the fixed semantic token. | Audit border separately; no wholesale replacement of notice geometry. |
| Ready status | `easyedu-status` / data-classes | Accent ink/soft background already work; fixed semantic border remains. | Preserve multiline centered layout and current status semantics. |
| Warning status / error summary | `easyedu-status--warning`; summary error arguments | Stay semantically warning/error when Primary or Accent changes. | Never recolor these as brand success. |
| Preview and completed success summaries | `local-groupimport-import-summary__item--success`; `_mass-import.scss` -> `tables.report-summary-item` | Background#eef8f2, border#cfe7d9 and ink#1f6748 are fixed. | Shared public summary role with exact published default fallback, custom Accent chosen surface/readable ink, no private product Hex. |
| Success report heading / check glyph | report title/list modifiers; `tables.report-title` / `report-list` | Heading#1f6748 and glyph#e4f5eb/#1f6748 stay fixed independently of Accent. | Shared report semantic role; preserve typography, line/icon geometry and danger list. |
| Completed annotated report Export | native `btn-outline-primary` + `easyedu-action-with-icon`; `buttons.action-button` | Shared action owns geometry, spacing and interactive states, not rest paint. Sentinel at rest stays unchanged. | Reuse/extend canonical outlined action paint without replacing its Regular geometry or icon-gap rule; test actual native rest/hover/focus/disabled. |
| Rolled-back history label | `modals.history-state(success)` | Source already consumes Accent soft/ink/border variables. | Native all-history lifecycle remains separate; not covered by the twelve-surface fixture. |
| History and other modal headers | SM-59 public header opt-in | Served SM-59 native60 has its own proof, not a Mass-all-lifecycle proof. | Keep native portals/default fallback; do not duplicate the relay. |

Primary submit actions already consume `foundation-button`'s validated
`--easyedu-primary` / strong / soft tokens. The diagnostic does not claim their
entire upload/import lifecycle, rollback command or native menu coverage.
Information/deposit surfaces, subtle borders, report row backgrounds and other
controls still need a complete role/state inventory; table warnings and neutral
surfaces must not be blindly branded.

## Ordered continuation and design gate

1. Restore this implementation window's **hosted** Penpot connection. Its own
   plugin modal is currently configured to localhost:4400, the independent
   Guide lane. Do not change the Guide server, token, manifest or browser.
2. Read back Product page04 before replaying the previous timed-out header
   comparison write; server readback found no saved host, but live unsaved state
   must still be checked. Complete the linked SM-59 comparison first.
3. Read actual accepted Mass report/summary/Export providers and compositions;
   add canonical default/custom specimens source-preservingly, paired Library/
   Standard, with product instances. No new guessed typography or dimensions.
4. Implement the missing paint in the canonical Kit, sync only scoped modules,
   opt in through public classes. Preserve full unrelated CSS, chosen versus
   readable roles, official default paint and CSV disclosure Motion.
5. Isolated actual full-cascade test followed by one approved served-native
   non-destructive scenario; no Save/import/rollback/Send to obtain a screenshot.
   Settings persistence and final human acceptance remain separate gates.

## Served predecessor and continuity

Source proof-doc commit6cfe2a78755b83e1d45e7b6c3e3225e8bb9be1ef was promoted by
request20261006T103632Z-f4b19b2e97 / record20261006T103658Z to runtime
dcc71d6dbb9618b84ab07071c54d7c34c5ea9b17. Runtime clean, managed preview active.
No cache purge or new native test was required for that documentation-only
promotion. Exact tested CSS53d0ad7bf4cabd095bb29675978b3789913a1ea4 and
AMDbc5cec771d2a60367a76c62558a114cb3efb9f25 stayed identical to native60's
bb15f557 runtime. This newer documentation revision is not relabelled as the
native test's loaded revision.

Kit documentation successorf857231d5f1e80de0c4799c7d36de9b49dcf2ad4 is pushed,
version0.4.121 unchanged; the exact scoped consumer source pin remains5891d8c.
Shared Platform planning is preserved with its owner; this is a portable
versioned batch backlink. Existing palette AI contract still governs this
diagnostic, so no new public Kit/AI/runtime behavior is introduced.

Efficiency: this audit uses the existing worktree and complete compiled CSS,
one isolated browser and actual PHP adapter, without another authenticated
matrix or lease. Avoid guessed partial paths/PowerShell glob arguments to rg;
discover exact files first and quote Git upstream expressions. The known
localhost:4400 mismatch is a coordination gate, not a reason to repeat120-second
SDK writes. No numeric token accounting is available.
