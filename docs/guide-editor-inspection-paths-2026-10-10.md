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

## Native diagnostic and bounded successor

Ordered promotion213d8df serves runtimef218221 with cache purge. Native run
46272 passes both desktop paths, then fails compact Group prior-field review:
the closed responsive Navigation drawer still has a layout rect and role=dialog.
The new editor opener treated it as an active foreign dialog. No errors, blocked
business calls, Save or fixtures; credential/child/lease cleanup is complete.
Preserve that strict native spec and failed evidence unchanged.

Successor checks native aria-hidden in addition to hidden/layout. Actual visible
foreign dialogs are still preserved; a correctly closed navigation drawer no
longer blocks editor review. Sixteen typed opener cases include aria-hidden and
hidden dialog branches. No shared Kit, Navigation code, CSS or Motion change.
Replay the unchanged strict six-case native scenario after ordered promotion.

## Residual locale and accessibility coverage

`tools/playwright/guide-editor-inspection-variants-native.spec.js` is a separate
local-supervised successor preserving the original target, real focus, review,
reopen and awaited Cancel assertions. It tests native French normal motion and
English reduced motion, both entities at all three widths (12 cases), and
asserts the actual document language. QA Guide storage is distinct per variant.
The original failed/strict scenario is not rewritten. No course commands, Save,
fixtures, UI force-click or private authentication persistence are introduced.
Native result is pending; this is not animated-scene or human certification.

Native replay8312 now passes both desktop contexts and768 Group, including
reopening Name. At768 Grouping its expanded checklist covers the non-current
Cancel control while reviewing Name. Preserve this second failure and original
spec. A separate strict review successor uses the actual Cancel checklist row,
requires native Cancel highlight alignment and still-uncompleted state, then
clicks Cancel normally. It does not hide/minimise the panel, force-click,
change Motion or certify arbitrary non-current controls beneath a floating panel.
The not-yet-run variants adopt the same explicit final-step navigation.
