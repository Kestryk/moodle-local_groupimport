# Mass Import semantic palette: bounded diagnosis (SM-64)

Batch EED-UI-2026-0073. Palette diagnosis, **not a CSS palette repair** or native
browser/human result. The bounded Product design reconciliation below is now
saved, independently of the palette/code gate. SM-01..73 and
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

1. Hosted implementation connection restored; Guide server/token/profile untouched.
2. SM-59 linked Product comparison saved after live-state reconciliation. Four
   exact paint/type/content fingerprints and contained export inspected; see
   `dialog-semantic-palette-2026-10-06.md`. Human/full raster gates remain open.
3. Read actual accepted Mass report/summary/Export providers and compositions;
   add canonical default/custom specimens source-preservingly, paired Library/
   Standard, with product instances. No new guessed typography or dimensions.
4. Implement the missing paint in the canonical Kit, sync only scoped modules,
   opt in through public classes. Preserve full unrelated CSS, chosen versus
   readable roles, official default paint and CSV disclosure Motion.
5. Isolated actual full-cascade test followed by one approved served-native
   non-destructive scenario; no Save/import/rollback/Send to obtain a screenshot.
   Settings persistence and final human acceptance remain separate gates.

## Actual design providers and bounded lane reconciliation

Product page01 `220f6449-533e-815b-8008-ad9958d032a2` has12 effectively visible
report/summary instances across Desktop,1024Tablet and390Mobile. One bounded
page traversal found them; later checks use exact IDs rather than repeating a
global document scan. All four desktop roots have clipContent=true: the oversized
formal lanes did **not** prove painted copy overflow for their current short text.
The problem is their inherited wrapping/containment contract for future copy.

| Desktop root | Previous visible text lanes | Saved correction |
| --- | --- | --- |
| Success summary `01e728c3-f1ef-80b3-8008-b2b5b5c6be2d` | two610px lanes inside328px root | two288px lanes, same20px inset |
| Warning summary `01e728c3-f1ef-80b3-8008-b2b5b5e2d6fe` | two610px lanes inside328px root | two288px lanes, same20px inset |
| Success line `01e728c3-f1ef-80b3-8008-b2b5b6005ce3` | two1160px lanes inside676px root; clipped Close at1282px | two602px lanes, same56px start/18px end; Close hidden |
| Danger line `01e728c3-f1ef-80b3-8008-b2b5b620e4bb` | same inherited lane/Close defect | same602px lanes and Close hidden |

Eight responsive roots already had contained text lanes and no visible Close,
so were not modified. All12 now pass settled text-lane **and actual textBounds**
containment, preserve linked providers, Inter12/14/32 typography and roots:
summary328/416/326x116, report676/864x72 or326x104. No palette/font/copy/root
resize, new control or Motion change. The Success/Danger Close is absent from
the actual `index.php` li renderer (glyph plus one message only), so hiding the
inherited notification Close is source-backed, not a new behavior. Existing
hidden legacy children are retained. Agent inspected the desktop report export;
this is not full plugin visual acceptance or long-localized-copy proof.

SDK validate[] after own-window reload. The after-write snapshot request returned
Cloudflare504 on `create-file-snapshot`; **do not call that a saved version**.
Independent authenticated get-file?id200 was decoded using Transit-js0.8.874:
all four exact root/provider IDs, eight new widths and two hidden Close children
are present in saved data. Only then was the owned browser reloaded. Its SDK
read/validate succeeded again; Guide/browser/server/token untouched. A failed
width-setter attempt was checked as unchanged before using Shape.resize.

Repeatable read-only helper:

```text
node tools/penpot/audit-saved-mass-report-lanes.cjs <playwright-node-modules> <transit-node-modules> <owned-local-cdp-url>
```

The helper reads only the saved Product file, prints bounded assertions and
disconnects only its own CDP connection. No screenshot/profile/auth export,
settings/DB/fixture/lease or editor write. This is local-supervised, not CI or
native Moodle proof. Auxiliary Transit-js was installed outside all worktrees.
Node syntax and84 saved-file assertions PASS across all12 recorded instances.

### Remaining canonical discrepancy, not a silent fix

Actual Foundations sources differ from native report recipes: the report-summary
Success provider `5866ed4a-7d30-8093-8008-ac7b918b1f89` is650x150 with stacked
Inter12/32/12 and#e8f6ef/#79c59d/#166b3b. Native report-summary-item is an inline
count/label recipe with1.18rem count and#eef8f2/#cfe7d9/#1f6748. Neither formal
lane containment nor the existing linked provider proves native parity.

Report lines link generic Inline notification Success/Danger rather than the
native report-list anatomy. Native report has no Close and a20px glyph role;
the preserved Product examples use24px linked glyph and two-line message.
Export links **Core action / Secondary / M**, provider
`761eab91-8390-80e8-8008-98c36f424ad4`, main69x37.6, resized Product292x40.
It has no Excel glyph, while native Export is `btn-outline-primary` plus the
canonical action-content gap and a file-excel glyph. The missing provider in the
first component listing was a variant-index issue, not a broken link:
instance.component().mainInstance() resolves the actual M member.

Do not blindly repaint these generic Foundation families or replace accepted
dimensions to repair SM-64. Next: reconcile canonical native-shaped Summary/
Report/outlined-icon action usages in paired Library/Standard and Product,
then implement paint-only opt-ins with published default/native-cascade proof.
Report/danger semantic meanings, original CSV disclosure Motion and user
checklist remain open. This turn introduces no Kit style/version or native
asset change; existing palette/lane/unknown-write AI contracts cover it.

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
