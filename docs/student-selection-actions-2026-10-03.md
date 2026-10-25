# Compact selection actions — 2026-10-03

Batch: EED-UI-2026-0073. Kit checkpoint: 0.4.63, commit
`2612e0d54f8797d604433054a37c0af9b51adcdc`.

## Scope and ownership

The canonical Kit `selection-action` recipe owns compact font, radius, semantic
palette, icon gap and states. EasyStud adds its public class in the two native
Mustache action loops and the existing mobile action-bar adapter. It removes
that class from overflow menu clones. Product SCSS keeps layout only; duplicate
button and disabled paint is removed. No inline Mustache style is introduced.

0.78rem Inter/600, 1.9rem compact and 2.35rem tray minimum height, 0.35rem icon
gap and the existing control radius apply to all four roles. The danger role
stays red on hover and becomes neutral when disabled. Native focus keeps rest
paint; keyboard focus uses the shared blue border and semantic ring.

Business commands, endpoint/service, card Motion and disclosure transitions are
unchanged. The successor gate reconstructs the entire prior controller and
template after removing the exact class adapters, then compares them to
`efbad079a4f9595fd15db6153e7bca5a62b05781`. It verifies canonical Kit module
identity and 254 changed compiled selector/property sequences, with no unrelated
paint drift. CRLF/LF normalization fixes a cross-platform test discrepancy;
it does not relax declaration, order or semantic colour checks.

## Penpot publication

Foundations has four roles x Default/Hover/Focus-visible/Pressed/Disabled in
paired Standard/Library hosts, plus one shared linked four-action tray. Twenty
recursive fingerprints match; painted label/icon containment passes. See
`testing/student-selection-actions-foundations-2026-10-03.json`.

EasyStud page 03 consumes forty new shared action instances across the focused
selected-member composition, four structural toolbars and two participant
toolbars. Sixteen structural toolbar controls are visible; the existing More
trigger represents the remaining commands, without wrapping or changing column
heights/pagination. Member Move/Remove remain disabled in group-only snapshots;
the focused member snapshot enables both. Superseded controls are hidden
recoverably. All forty labels/icons pass painted containment and centring;
the focused tray retains the source two-column density. Readback:
`testing/student-selection-actions-product-2026-10-03.json`.

The agent inspected the paired catalogue and focused product composition.
Private captures are manifested under
`EasyEdu/artifacts/penpot/selection-actions-20261003`; no media is versioned.
This is not human acceptance, all-view parity or a real membership transfer.
Other selection-owned mobile/tablet snapshots remain separately auditable.

## Reproduce and preview

Run `tools/release/test-selection-action-contract.ps1 -KitRoot <Kit-root>
-BaselineCssPath <immutable-efbad-styles.css>` before promotion. Build AMD from
its versioned builder, and CSS from actual Sass, never hand-edit generated files.

`student-selection-action-style-preview.spec.js` is a local-supervised candidate
in the existing student-modal-footers family. Discovery selects exactly one
test. Its six desktop/tablet/mobile toolbar/context cases use existing members,
open/search/Cancel only and block all plugin POST. It checks actual typography,
semantic hover/focus, icon/text centring, matched destination-modal footers,
focus restoration and unchanged membership rows. Native execution remains a
separate gate until a served preview record and cleanup evidence are recorded.

### Native typography proof and tray-height successor

Source `dbd4e04` is served at clean runtime `3bb9884`, with cache refresh.
Run `easystud-authenticated-20261003T151653229Z-45412` passes the six native
toolbar/context cases: actual Inter/600/12.48px, radius/gap, icon/text centres,
danger hover, keyboard focus, chooser/search/Cancel and matching modal footers.
No business POST or fixture; credentials, runtime lease and child cleanup pass.
Evidence: `testing/student-selection-actions-preview-2026-10-03.json`.

The post-run geometry audit found a separate 30.4px mobile tray height gap.
The initial candidate did not assert its intended 37.6px height; its PASS is
not complete density parity. Kit 0.4.64 raises only the tray modifier's selector
specificity to match the semantic roles. Penpot already shows the correct
37.6px density, so its source providers are not redrawn. The successor browser
candidate adds an explicit 30.4px desktop / 37.6px tray assertion. Historical
assets/evidence stay immutable; new served height proof is a separate gate.

The successor is served at clean runtime `9bb9119`. Run
`easystud-authenticated-20261003T160255517Z-43276` passes all six cases,
including actual 30.390625px desktop / 37.59375px tray heights. The native
per-page readiness assertions remain 60s. An earlier run exhausted its global
180s budget after the desktop cases, before four readiness polls on the next
page; preserve it as a failed run, not a measured 60s readiness failure.
The successor records navigation/readiness/completion timings and uses a
bounded 240s total budget under the unchanged 300s runner watchdog. It completed
in 68s; no UI lifecycle or assertion was bypassed. Cleanup and the blocked-POST
guard pass. Proof: `testing/student-selection-tray-preview-2026-10-03.json`.

## Platform-owner proposal and remaining gates

The source-backed conditional tray continuation, paired 2/3/4-action usage
and fourteen product consumers are recorded in
`student-selection-tray-routing-2026-10-03.md`. Its long-label successor is
separate from the historical height/typography runs.

Reconcile these provider IDs, source pins and paired/product readbacks into the
shared source/Penpot crosswalk and EED-UI-2026-0073 history. Register this native
candidate as local-supervised; the declaration/controller successor is static
and CI-reusable. Shared dirty Platform plan/state/registry files are not edited
by this source window. Human global checklist stays open. Actual transfer DB
integration and complete loading/view compositions retain their own gates.

## Iteration-cost audit

The avoidable work here was stale Penpot text bounds after overrides, main
variant cloning versus instance cloning, and UI calls made after a suspended
tab. Keep exact IDs, wake only the owned tab, batch compatible writes and read
back after settling. Normalize CRLF/LF in paint gates; use exact repository
roots rather than guessing document paths. No reliable token counter is
available, so no numeric consumption or savings is claimed.
