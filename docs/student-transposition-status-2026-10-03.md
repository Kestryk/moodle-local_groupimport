# Penpot to EasyStud transposition status - 2026-10-03

Batch `EED-UI-2026-0073`. Verified against the serving Moodle 5.1 plugin's clean
branch `preview/moodle51/easystud-phase0-mass-admin`, HEAD
`333b7539932749b354b1070350412cc33b6d29bb`. This is a local preview, not production
or global human acceptance. Source worktrees and current footer gate are listed
in `student-modal-footers-2026-10-03.md`. The human checklist remains unchecked.

## Already applied to the local preview

| Family | Changes already present | Runtime commit/evidence anchor |
| --- | --- | --- |
| Mass Import / Administration | Phase 0 Foundation classes and responsive views | `75f8248`, `cf86ee0` |
| File deposit | Drop feedback, native upload/progress, typed removable file selection, field/title typography | `de410f6`, `19f16b9`, `3bbd07b`, `96f2f0b`, `671d0d2` |
| Import preview table | Canonical generic table, native Bootstrap table opt-out, header/icon spacing, centred/padded wrapped status pills | `81ff599`, `1bafdaf`, `dd65d48`, `bbb38dd` |
| CSV side column | Rail/layout repairs and progressive disclosure timing; separate closed/open content phases | `677f1b8`, `2e193cb`, `2fd3973`, `89becc8` |
| Workspace / filters / views | Header/navigation spacing, unified More filters, native search/create and real responsive view selector | `8a9edf2`, `a8f8aed`, `ec89431`, `a61373d` |
| Cards / actions | Header alignment, participant eye, direct action families, quieter identity roles, compact controls and narrower previews | `3f21e8c`, `10f3c86`, `04d8bcc`, `ae19922`, `2dc94de` |
| Sorting / pagination | Shared utility extraction, canonical sort and narrow pagination containment | `7049adc`, `c58f0d1`, `f25a7c4` |
| Context menus | Compact card overflow, responsive context sheet and real Rename/Unlink/search actions | `cf48444`, `f169de5`, `8da799c`, `7b4a592` |
| Drag/drop | Compact identity-only Participant/Group preview, flair, stack/count only for Multiple; allowed and danger/incompatible feedback | `819906f`, `099ff4f`, `726dcb0`, `e6a9c5d`, `023fbee` |
| Inline addition / recognition | Canonical create/Rename fields, multiline identifiers, Success/Error pills, Add/Cancel colours/spacing/focus | `6e80071`, `60850e7`, `6b8269b`, `c4adda4`, `0fe7e86`, `6cda39f` |
| Group-member names | Shared related-person typography role with original density/Motion preserved | `020cf4c`; technical source/native proof exists, Foundation density/export reconciliation remains |
| Native Message | Inherited Kit font/token bridge, canonical field/Cancel and content-fit phone body | `099ff4f`, `da77e61`, `a364b01`; the NEW right-aligned footer is not served yet |
| Move / Clipboard | Native destination controls/options and neutral lookup/layer above navigation; source-complete Penpot states | Prior Move proof `easystud-authenticated-20261002T183714504Z-31732`; Clipboard `2dc2725`, final recorded proof `cbcc372` / `easystud-authenticated-20261002T205725336Z-32120` |

The commits above are serving-history anchors, not one fresh test of every
family today. Saved browser runs certify their own asset revisions and limited
scenarios. Nine menu label/centre/focus cases passed, but the broader historical
suite failed a foreign CCB drawer icon occlusion at 390px; do not call that whole
suite green. Empty Move states have static/Penpot, not manufactured runtime,
coverage. Mobile commands preserve native routing and sticky actions.

## Prepared in source / Penpot, not yet served

- Participant/Group/Grouping entity chrome: shared title/eyebrow/icon/header,
  modal-root layer, class-only header/action adoption and duplicate local chrome
  removal. Conditional Group image/enrolment key/delete-picture, Grouping
  configuration, readonly Participant, counts/CSV/native URLs remain.
- Current modal footer correction: right-aligned, matching paired density for
  six Destination, two Message and three entity specimens; four Foundation
  Standard/Library pairs match. Source CSS is rebuilt; source and saved readback
  checks pass. Exact managed-preview/browser and human gates remain pending.
- Source-complete browser candidates for entity, Move and Message open/cancel;
  no Save, send, move confirmation, uploads or fixture changes are intended.

Current evidence: `testing/student-modal-footers-penpot-2026-10-03.json`.
Historical header evidence: `testing/student-entity-dialog-chrome-penpot-2026-10-02.json`.
Do not mistake a Penpot update, compiled CSS or source commit for served preview.

## Remaining work, not a complete class-only claim

- Apply the owned candidate through the authorised managed local-preview gate,
  then inspect actual native open/cancel geometry at desktop/tablet/phone.
- Continue full entity-modal bodies: settings fields, conditional image/help,
  metadata/list/counts/CSV and native Close anatomy; source completeness is not
  full Foundation style parity.
- Migrate the remaining legacy destructive-confirmation and Copy/Move-choice
  footer controls to the public recipe with their own semantic palette/Penpot
  evidence. They still use legacy Bootstrap classes, unlike this tranche's
  native Destination, Message and entity-settings pairs.
- Reconcile remaining Foundation member-row density/export gaps and propagate
  complete responsive product compositions without changing native behaviour.
- Complete all-state translation/RTL/forced-colours, stacking and error checks,
  then the deferred combined human checklist.
- Guided visits remain a separate shared project, not an invented EasyStud fork.

Shared migrated components come from the canonical Kit and are mirrored with
source pins; this is not proof that the whole plugin has only Kit classes.
Existing product-specific body/layout rules remain explicitly consumer-owned.
No new footer visual declarations or inline Mustache paint were added here.
The ledger deliberately states `fullTreeIdentical: false`.
