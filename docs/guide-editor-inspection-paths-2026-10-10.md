# Native editor inspection paths - 10 October 2026

## Scope and ownership

G11-E adds two optional paths to the existing Group and Grouping card lessons:
`inspect-group-settings` and `inspect-grouping-settings`. Each teaches opening
the real editor, focusing Name, focusing Description, and Cancel. No Save,
course transaction, fixture mutation or new persistence format is required.
Member/group lists remain read-only information, not selection controls.

The product adapter supplies native context, targets and completion signals.
The canonical embedded Kit invitation, checklist, highlighting, modal styles
and Motion are reused unchanged. No new shared visual family, Penpot drawing,
consumer stylesheet or Mustache exception is introduced by this lot.
All twelve reading IDs, historical reading maps, previous paths and command
implementations are preserved. EN/FR copy explains that fields need not change.

## Native signal contract

- `open-editor` follows the actual editor append, not a fabricated Guide event.
- `inspect-name` and `inspect-description` follow native focusin on their
  typed editor fields. Guide highlighting alone never completes them.
- `cancel-editor` follows the original modal exit/removal and focus return.
- Reviewing the first step awaits the same exit with completion suppressed.
- Reviewing a field reopens only its actual Group/Grouping editor. A foreign
  editor or other visible native dialog is not replaced or closed.
- Existing visible, unfinished, unlocked path guards reject unrelated signals.

Desktop uses the real cog; compact layouts use the restored single-card menu
entry. Workspace switching is avoided when the desktop structure view is
already active. Existing selection, native form values and save code are not
changed by the inspection adapter.

## Verification boundaries

`tools/release/test-guide-editor-inspection.cjs` passes EN/FR fixture checks,
12 typed opener cases, awaited exit/Cancel review semantics, and exact
reconstruction against source9288b66 of unrelated native commands, existing
language strings, reading/path definitions, CSS, Mustache and shared Guide AMD.

`tools/release/test-guide-editor-inspection-layout.cjs` passes24 actual
EN/FR invitation cases at1280/768/390 in normal/reduced motion. All eight title,
description, four step labels and action text nodes are measured for paint
containment. This isolated rendering is not Moodle or human acceptance.

AMD/map rebuilt with the official course-manager builder. PHP lint and JS
syntax pass. The native scenario is classified **local-supervised**:
`tools/playwright/guide-editor-inspection-native.spec.js`, exact test
`Editor guide highlights native fields and reviews without completing Cancel`.
It denies business writes, uses isolated QA Guide storage and tests both types
at three widths, real field clicks, prior-step review, reopen and native Cancel.
It never presses Save. Served/native result remains pending until promotion
and the supervised run finish; native FR/reduced motion and human acceptance
remain separate gates. Future CI needs deterministic non-secret fixtures.

## Recovery and next step

Promote pushed documentary predecessor9288b66 and this source successor in
order onto the clean local preview, then purge caches under the managed lease.
Preserve any failed test/spec and its diagnostics rather than hiding overlays
or weakening field/paint checks. A follow-up source commit handles a real defect.
No database rollback is needed for this no-Save inspection lot.

Shared Platform planning/registry files are not written by this product window;
this ledger and local scenario classification provide the bounded owner handoff.
Older SM, Mass Import, admin and final human checklist lots remain open.
