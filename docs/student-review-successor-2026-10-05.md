# EasyStud review successor - 5 October 2026

Portable backlog under Platform batch EED-UI-2026-0073. This document supplements
SM-01..47 and the completion queue; it does not replace unfinished requests or
close the combined human checklist. Repeated pasted requests are deduplicated.

## Scope card and coordination

- Owner: existing EasyStud/Kit implementation window and its existing branches.
- Includes: shared Kit recipes, native EasyStud adapters, paired Foundations
  and EasyStud compositions, scoped static/isolated/native verification.
- Excludes: real Send/Save/move/drop, production, unrelated shared Platform
  edits, the parallel Guide window's project/component/source ownership.
- Runtime: exclusive managed promotion/browser lease, never simultaneous writes.
- Penpot: this window owns the bounded Foundations card/header publication.
  The user clarifies that Guide is NOT using Penpot yet; it awaits a concurrent
  connection solution. Do not attribute editor ownership/blockage to Guide.
  Current exposed tools have no explicit session-ID argument. Keep their hosted
  connection unchanged; propose a separately named local MCP for Guide. Verify
  both file identities before enabling two writers. Shared Foundations writes
  stay serialized. See penpot-parallel-guide-handoff-2026-10-05.md.
- Guide status correction: user confirms the Guide refactor is already started
  in a parallel window, not an unstarted lot owned by this window. Its exact
  progress is not inspected or certified here. Its Penpot work has not begun;
  source-only work can continue while an independent connection is prepared.
- Approval: user authorizes recovery of the owned metadata documentation conflict
  followed by continuation. Preserve snapshots, current Kit pins and all history.

## Ordered accepted lots

All entries below are accepted requirements, not implementation PASS. P1 fixes
are scheduled after documentation recovery; P2 interaction/design changes follow
their source audit and explicit Penpot ownership. No extra worktrees are created.

| Lot | Priority / owner | User-facing requirement | Required checks / limits |
| --- | --- | --- | --- |
| SM-48 | P1 / Kit + EasyStud | Mobile card checkboxes overlap titles. Desktop Participant checkbox shifts down when expanded. Keep the checkbox on a stable header track with protected title space in both states. | Participants/Groups/Groupings at mobile widths; desktop Participant collapsed/expanded, long names, checked/focus and no action overlap. Preserve original Show-all/card Motion. |
| SM-49 | P1 / navigation Kit + consumer | Mobile navigation uses an incorrect font. Use the canonical Kit font family, size/weight and line-height, without adding another font. | Computed paint after fonts settle, open/closed/active menu states at 390/768, actual Moodle destinations and opaque surface. |
| SM-50 | P2 / EasyStud selection + Kit composition | Mobile Participants should hide Groups/Groupings memberships by default. Add a compact/full control whose extra content is only those memberships. First sole participant selection expands; selecting a second collapses, like desktop. | Zero/one/two selections, deselection and filtering, manual toggle versus automatic rule, mobile labels/focus/ARIA and native containment. Do not extend this new mode to Grouping cards. |
| SM-51 | P1 / shared modal metadata + EasyStud | Participant details values (Username, City, Country, Language: e.g. Paris/FR/en) must use paragraph typography, not a divergent font. Harmonize Grouping modal body typography and arrangement with Student Management. | Inventory each semantic label/value/list role on all widths, optional/empty fields and existing URLs; preserve contents, hidden CSV, commands, supported native weight distinctions and proper headers. |
| SM-52 | P2 / Kit selection surface | Sticky Clear selection inner button is too strong: two prominent nested borders. Propose a quieter canonical button within the tray and propagate both design and code. | Desktop sticky tray, long labels, hover/focus/disabled/keyboard, no list/pagination overlap. No new Grouping-specific sticky treatment in this lot. Prior proposal is not human-approved. |
| SM-53 | P1 / filepicker Kit | Mass Import Drop your file here cloud glyph is not visually centred in its square. Normalize actual painted glyph bounds, not only the icon slot. | Paired Foundations sizes/states and product copies plus native font/icon-ready paint at three widths. Keep icon proportions/transparency; no consumer offset workaround. |
| SM-54 | P2 / More Filters Kit + consumer | Underline-only hover is rejected. Propose a distinct Kit-consistent hover for desktop/mobile. Opening/closing appears less fluid and must be audited. | Unified block and consistent width, last-filter/footer clearance, both transitional directions, nested dropdown one-click closure, reduced motion and reversal. Do not rewrite unrelated accepted card Motion. |
| SM-55 | P1 / searchable-choice Kit | After dropdown exit, surrounding text jumps back abruptly. User observes this in Administration and modal choices, potentially all instances. | Measure height/margins/paint through opening/closing and terminal cleanup; no terminal jump, held-pointer dismissal, keyboard, focus/ARIA, reduced motion and single/multiple/empty variants. Shared controller fix before consumer sync. |
| SM-56 | P1 / shared admin actions + wording | Restore EasyEdu colours must read Restore EasyEdu colors in English, and must not touch the explanatory copy below. | Preserve locale semantics elsewhere; canonical action/help clearance across widths, defaults draft/reset unchanged; no actual settings Save in visual test. |
| SM-57 | P1 / semantic palette Kit + native config | Top accents of both main columns do not follow Administration colour settings. Map both accents to the intended live semantic palette. | Audit header/accent token ownership, original/default/custom colours, actual soft-surface contrast, no hard-coded alternate paint; persistence gate separate. User sentence 'Et je trouve pas le' is unfinished: retain it as unresolved, do not invent the missing control. |
| SM-58 | P2 / shared colour picker | Popup needs a larger preview of the colour being selected and light click/selection animations. | S/M/L paired Foundation and product/native states; HSV/Hex/swatch draft preview, Apply/Cancel/reset, keyboard/focus, reduced motion, viewport containment and no settings POST. Reuse standard Motion, preserve named Hex and native fallback. |

## Execution and proof gates

SM-55 source successor includes canonical Kit 0.4.107 margin collapse and
0.4.108 native-inline baseline and 0.4.109 intrinsic-width correction, with
isolated regressions; see
student-choice-terminal-spacing-2026-10-05.md. Native Administration 15-endpoint
gate passes without terminal jump; other modal/filter native journeys and paired
Penpot/human gates remain OPEN. SM-48 source audit identifies competing
overlay offsets and card-height centring; no speculative checkbox fix is served.
Its native diagnostic protocol is student-card-selection-track-2026-10-05.md.
Native baseline now reproduces the desktop shift. Kit 0.4.110's fixed-anchor
source candidate passes six isolated cases. Paired Foundations/Standard and
Product publication has readback and inspected checkpoints. Managed served
strict successor passes sixteen native records with zero desktop top shift.
Other mobile states and human acceptance remain OPEN; see the SM-48 native record.

SM-56 source uses the existing Kit form-note spacing and requested English
action wording. Three Penpot Restore instances now contain their French labels
and retain 20px helper clearance. Static/isolated checks and managed native
Administration proof at 1600/768/390 pass: exact wording, 20px helper gap,
draft-only reset and no settings POST. Human checklist stays OPEN. See
admin-restore-clearance-2026-10-05.md; preserve the four failed prior harness runs.

SM-57 source audit confirms literal canonical semantic gradients are not
connected to the configured primary/accent palette. Preserve panel geometry
and introduce the mapping in the Kit, not private consumer paint; see
workspace-accent-palette-audit-2026-10-05.md. Implementation remains OPEN.

SM-51 source and live Product readback find the four active Participant
metadata fields already using canonical Inter/regular values; hidden legacy
Open Sans descendants are not current fields. No blind font override applied.
Fresh native/full Grouping-body proof remains OPEN; see
entity-field-typography-audit-2026-10-05.md.

1. Finish the authorized docs-only recovery, retain omitted 35813f2 prerequisite
   before 0e60a8c successor, and certify clean runtime/unchanged rendered assets.
2. Inspect SM-48 and SM-55 source and actual painted geometry. The existing
   Foundations connection is available to this window; no blind design write
   or 100% parity claim. Preserve original card Motion.
3. Publish source component and all scoped consumers through that connection.
   Prepare Guide's independent connection separately; do not regenerate the
   shared remote token or stop this browser to configure the other window.
4. Promote only pushed owned commits with prerequisite ordering and scoped
   native checks; do not mutate real entities solely to make evidence.
5. Continue every earlier unfinished lot. Keep rename/migration separate and
   Guide implementation with its parallel owner. Complete cost/efficiency audit
   at closure without inventing token-accounting data.

For each lot record source/static, Penpot linkage/readback/export, served preview,
native behavior and human acceptance separately. None of the newly registered
lots is certified fixed by this intake document.
