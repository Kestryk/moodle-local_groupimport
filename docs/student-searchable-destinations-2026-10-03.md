# Searchable Move destinations — EED-UI-2026-0073 / SM-12

Owner: existing EasyStud/Kit window and its dedicated worktrees. Scope: the
native participant and Group Move destination chooser, not membership-command
semantics, selected-member Move, filters or loading. No business mutation.

## Implementation and lineage

Kit 0.4.59 owns `_searchable-choices.scss` and `choices/searchable_choices.js`.
EasyStud imports the byte-identical controller/recipe. No Mustache style or
consumer-local chooser paint is introduced. Native select options/value/data
hooks remain authoritative, with no-JS fallback. Move's native confirmation
handler, AJAX, template and Motion remain byte-identical to the predecessor.

Search preserves selected values, includes accent-insensitive matching and an
empty state. Real buttons expose pressed state, native disabled options and
normal Tab flow; Escape closes only the choice panel, then returns focus. This
uses [WAI disclosure semantics](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/),
not an incomplete custom combobox/listbox. The in-flow panel fits the existing
scrolling dialog instead of creating a clipped floating list.

Foundations 08.4.1 publishes Closed/Open/No-results/Responsive-open; 08.4 has
four linked matching copies. The readback records provider, recursive visual
fingerprints, font and painted text containment. All-state and human acceptance
are explicitly false. Canvas pixels are illustrative 16px/rem equivalents.

EasyStud page 04 replaces four visible fields with linked choices in ordinary
composition hosts, preserving old fields hidden. Four separate open-search
compositions are below the existing page, not overlapping older specimens.
Group origin checkbox/copy and native footer remain; two no-destination states
are unchanged. Open/closed fields and matched footer heights are recorded.

## Checks and remaining gates

- Canonical Sass and native Text-field contracts pass.
- Consumer exact module/controller and unchanged native command/Motion/template
  contract passes; PHP lint passes for changed strings and render context.
- Isolated 1600/768/390 HTML interaction gate passes with active Kit token scope.
  Keep earlier failed/candidate runs: the label-click assertion was corrected
  to native activation, missing token scope was detected, then the colliding
  segmented-choice class was renamed. Isolated captures do not prove native
  Moodle icons, theme cascade or full dialog layout.
- Native candidate discovery selects one test. Use the runtime wrapper (its
  installed toolchain), not a source checkout missing node_modules. Promotion
  and fresh runtime proof remain to be recorded, not inferred.
- SM-11/14/15/16/17 remain in the completion queue. No fixture role, removal,
  movement or send has been executed by this tranche. Combined checklist open.

## Evidence

- `docs/testing/student-searchable-destinations-foundations-2026-10-03.json`
- `docs/testing/student-searchable-destinations-product-2026-10-03.json`
- External Kit run `EasyEdu/artifacts/kit/searchable-choice-20261003-d`.
- Successor isolated run `EasyEdu/artifacts/kit/searchable-choice-20261003-f`
  additionally checks the accessible trigger name includes the selected value.
- `docs/testing/student-searchable-destinations-foundations-revision-2026-10-03.json`
- `docs/testing/student-searchable-destinations-paint-revision-2026-10-03.json`
  supersede earlier layer-order readbacks. Refreshing a linked provider resets
  icon/label geometry: restore adaptive text lanes and right-aligned glyphs,
  then re-read all four copies. Check centre delta is 0, right inset 14px.
  Open specimen frames are ordinary page-root children, not clipped by an older
  board. Earlier blank captures and pre-correction glyphs are retained, not PASS.
- External Penpot checkpoint `EasyEdu/artifacts/penpot/searchable-choice-20261003`.

## Portable Platform-owner proposal

Register SM-11–17 as accepted P1 continuations of existing batch 0073, with the
exact queue scope. Classify `searchable-choice-kit-contract.cjs` as ci-reusable
isolated HTML (Chrome/toolchain adapter required) and the successor Move modal
scenario as local-supervised/non-mutating. Shared registry/state ownership has
not been taken by this implementation window. Human acceptance stays deferred.
