# More Filters hover and Motion successor — SM-54

EED-UI-2026-0073. Intake audit after SM-58 served PASS; implementation and
human acceptance OPEN. SM-43A underline-only proposal was explicitly rejected.
Do not close this successor from the old native test PASS.

## Implemented source successor

Kit 0.4.113 opt-in `filter-disclosure-capsule` paints only the intrinsic content
surface: primary-soft hover/expanded fill, quiet control-border, canonical
radius; default compatibility recipe remains unchanged. Four Mustache buttons
add a public modifier/content span; their existing label/Chevron/controller
selectors remain intact. No private declarations, inline styles or JS changes.

Source gate `test-filter-disclosure-capsule-source.js` reconstructs the exact
predecessor template and compares all unrelated CSS selector/declaration/order
records, controller/commands/arrow Motion and card Show-all. PASS.
Six isolated width/density cases (`sm54-capsule-20261005-a`) and twelve legacy
default/footer cases (`sm54-compact-regression-20261005-a`) PASS. These are not
native-font, runtime Motion or human acceptance proof.

Existing ten Foundations mains/Standard states updated; original root targets,
labels, type, icons and focus strokes preserved. Twenty current Product copies
inherit the source via one shared-library update. The click timed out after
performing the update; settled API readback confirmed all inherited children,
so no second click was issued. Composition width overrides initially retained
the provider's capsule offset; adjusted only existing inherited child centres,
without inserting new children into linked copies. Final settled/export gate
and native height sampling remain pending until recorded below.

Rollback: predecessor Git heads Kit `8149ce5`, consumer `d38a11e`; Penpot
`SM54-before` plugin data on owned mains/copies and existing ID crosswalk.
Guide project, memberships, test roles and native data are untouched.

Final settled Product readback: all twenty capsule centres match their actual
lane; canonical Inter 12.16 label paint is contained; original roots/providers
and business copy preserved. Desktop Foundations Hover and Product Touch
Expanded exports inspected. Existing ten Standard copies inherit the paired
source state/focus paint. IDs and rollback records retained under docs/testing.
Publication is a proposal, not human acceptance or an animation fix.

Native local-supervised candidate `student-filter-disclosure-capsule.spec.js`
samples actual heights/opacity during both normal disclosure directions, nine
available routes at three widths plus intentionally absent desktop Groupings.
It also closes one real nested choice through one parent click at each width.
Plugin interaction POST is denied; native bootstrap getter for a consuming
message draft is mocked without altering a real draft. No fixture/business
writes or settings Save. Served result remains pending until appended.

## First native palette oracle failure

Managed promotion `20261005T162915Z-d750ba1ed2` serves `3c962c9` on clean
runtime `e1df4df`. Discovery selects exactly one test. Native run
`easystud-authenticated-20261005T163012635Z-40084` fails its first hover-colour
expectation: saved primary is orange, so the correct canonical primary-soft
paint is `color(srgb 1 0.968235 0.9)`, not the default-blue RGB hardcoded by
the test. No production defect or animation result is inferred from this stop.
All cleanup flags true; no fixture request. Failure/source pins preserved.

Immutable palette successor decodes actual painted RGBA and independently
computes the native adapter's 10%-chosen/90%-white RGB channels. It still checks
opaque paint, canonical type/gap/centres, full lane, both Motion phases and
nested closure. No production change, settings write or relaxed geometry gate.

## Verified current state

Canonical Kit `_forms.scss` `filter-disclosure-trigger` uses transparent paint,
primary-strong text and label underline on hover. Wide/Touch fill the available
lane; Compact is natural width. `filter-disclosure-row` reserves 16px padding.
Source SM-43A native record proves both transitional phases and nested closure,
but predates the user's later report of perceived roughness and rejected hover.

Product file `220f6449-533e-815b-8008-ad9958d032a1`, Student page
`92c1c225-95fb-802e-8008-ae9f13d0b0b9` live audit counts 20 effective-visible
More Filters copies, Wide/Touch, four current providers:

- Wide Collapsed: `2a31d374-d2a1-80fd-8008-ac60c5933349`.
- Wide Expanded: `2a31d374-d2a1-80fd-8008-ac60c650268e`.
- Touch Collapsed: `a301101d-ddc2-807b-8008-bbb661c14700`.
- Touch Expanded: `a301101d-ddc2-807b-8008-bbb661e42659`.

Foundations Standard/Library pages and ten main/Standard state IDs are retained
in `docs/testing/filter-footer-foundations-2026-10-05.json`. Use those existing
providers, not a second family. Product narrow lanes differ by composition;
preserve their width overrides and actual painted label/chevron centres.

Mustache currently renders a direct label span and decorative Chevron span.
The consumer `_layout.scss` delegates Wide paint to the canonical recipe, but
`_structure.scss` also consumes Compact for Group member Show-all controls.
Therefore a blind global repaint of that shared mixin can alter unrelated
accepted card controls. Preserve those by a documented opt-in composition or
explicit compatibility path, not private consumer declarations.

## Next bounded implementation

Propose a quiet localized shared hover capsule around label/chevron, rather
than a full-width filled footer or underline-only response. Keep full available
hit lane, existing canonical type, icon ratio/gap and keyboard-focus ring.
Publish desktop/mobile source and all twenty consuming copies, read back and
inspect meaningful exports before promotion. Proposal is not human-approved.

Audit actual opening/closing padding/height and reversals before attributing
roughness to CSS. Preserve original card Show-all/expand Motion, one-click
nested closure, inert/ARIA, focus and reduced/disabled policies. Native proof
must sample both transitional phases, not merely the endpoint. No filtering,
roles, memberships or Guide writes belong to this lot. Existing footer gap
and per-view availability rules remain in force.

## Native scoped results and open reduced-policy sequence

Palette successor `easystud-authenticated-20261005T163425874Z-25040` certifies
nine available native width/routes: exact chosen-colour RGBA, type/gap/full
lane, centred paint, footer clearance, both normal height/opacity phases
(7–10 transitional samples per direction). Actual sampled spans 117–203ms.
One parent click closes the nested choice at desktop and tablet. The overall
test is FAILED, not PASS: after that tablet closure and a live reduced-policy
change, the next click leaves the parent closed. Desktop same sequence passes.
Preserve this unresolved pointer/terminal-layout case rather than weaken the
assertion or claim the entire SM54 Motion fixed.

The strict bootstrap also denied `core_courseformat_get_state`. Local Moodle
`course/format/classes/external/get_state.php` confirms it exports visible
course/section/module state only. A diagnostic allowlists precisely that read
and records document-level pointer/click targets plus keyboard recovery; it
does not mutate source presentation or native data. Other POSTs remain denied.
All runner cleanup true, source spec preserved; no fixtures or settings Save.

## Reproduced cause and bounded pointer cleanup successor

Diagnostic `easystud-authenticated-20261005T164207075Z-33388` reproduces the
tablet lost click with no denied requests/errors. During nested closure,
pointerdown targets the button, but pointerup/click target a DIV outside the
workspace after its geometry moves. The old root-only cleanup misses the
release and retains the suppression marker. Next genuine pointer click is
swallowed; keyboard recovery immediately works. Desktop/phone reopen normally.
Diagnostic PASS means causal observations recorded, NOT the behavior fixed.

Successor moves only the two owned pointerup/pointercancel cleanup listeners
to document capture, still keyed by this workspace's handled pointer IDs.
Deferred cleanup retains same-pointer click suppression; outside releases and
cancel now clear stale state. No filter/selection semantics, card animation,
duration/easing, typography, DOM or CSS change. Unit handler tests cover inside
release, outside release and outside cancellation; exact source reconstruction
checks both listeners and all unrelated controllers/CSS/Motion. AMD rebuilt.
Native end-to-end successor remains pending until a result is appended.

## Pointer cleanup served PASS and real mobile label discrepancy

Native `easystud-authenticated-20261005T164746591Z-43468` passes all 16
records: nine real animated routes, one intentionally unavailable desktop
Grouping route, three nested one-click closures and three live reduced-policy
reopen/close sequences. No page errors/denied requests; all cleanup complete.
Runtime `3dfd459` serves source `e05ca6c`; CSS remains exactly the capsule
candidate. Failed predecessors/diagnostic retained. No fixtures/data writes.

Measured native capsule width is 107.046875px desktop/tablet but 98.40625px
phone. This is not a provider centring error: obsolete consumer mobile
`advanced-filters__more {font-size:0.66rem}` reduces actual label to 10.56px
while the button correctly remains 12.16px. Remove that private legacy rule,
rather than add another style override. Shared Foundation type is already
12.16px. Extend native successor to assert actual label size at each width;
exact source/CSS gate allows only that obsolete declaration's removal.
Canonical-label served result pending; human checklist and reversal/perceived
duration review remain OPEN. Original card Motion is never rewritten.

## Canonical label served successor

Native `easystud-authenticated-20261005T165634447Z-30452` PASS, source
`9e80745` served by clean runtime `324bd396`: nine available animated routes,
one deliberately unavailable desktop Grouping route, three nested one-click
closures and three live reduced-policy reopen/close sequences. Actual label
and button both measure 12.16px at 1600/768/390; shared gap is 6.72px, capsule
paint follows the saved custom palette, and all available hit lanes retain
their full width. Both transitional directions have distinct sampled heights.
No page errors/denied requests, fixtures or settings Save; cleanup complete.
Representative mobile capture inspected; manifested retention dry-run has
zero candidates/deletions. Failed predecessors remain intact. Reversals,
perceived smoothness and human acceptance are still OPEN, not implied by PASS.
Next owned lot: SM-51 native Participant/Grouping body typography and layout.
