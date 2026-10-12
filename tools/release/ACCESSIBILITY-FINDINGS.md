# T058 — read-only accessibility audit (13 October 2026)

Audit/tooling only; corrections belong to Claude/Codex1. No JS/AMD, template,
SCSS, settings, memberships, messages, fixtures or principal runtime changed.
Copy :8051 remains the prior43b5b4b SM-RENDU1 measurement deployment: results
do not certify the more recent Codex1 preview or future SM-RENDU renderer.

## Proven observations

- Source inventory27 attribute candidates/references, not27 unique overlays:
  some are triggers, ordinary columns, legacy/conditional Guide panels.
- Primary FR1280 normal-motion run18 cases,17 available.11 modal contexts
  (Participant, Group/Grouping, three Move contexts, Message, Delete Group,
  Clipboard, Guide, History); six ordinary disclosures also examined.
- Participant/Message/Guide kept sampled Tab focus inside, closed on Escape
  and restored native opener focus. Message content never typed or sent.
- Group/Grouping editors, Move Participants/Groups/Members, Clipboard and
  History allowed sequential Tab to leave the aria-modal region. This is the
  primary finding; tests did not change tabindex, blur/focus or accepted Motion.
- Escape after escaped Tab focus failed on several custom dialogs; Group
  editor direct Escape while focus inside PASSED in the supplemental run.
  Do not describe every inner-focus Escape as broken.
- Delete Group confirmation: initial focus outside, no sampled confinement,
  Escape after Tab failed, original Delete trigger not focused after fallback
  Close. Only populated Group entry; Delete never submitted, guard retained.
- History initial focus/ordinary Escape/return passed, confinement failed.
- Rollback existing-history open/Escape passed; original Restore button not
  focused afterward. Whether History simultaneously closes and a visible
  fallback receives focus must be qualified, not called lost-focus without proof.
- Three searchable filter catalogues: native search focus, Escape closure and
  trigger return all passed without changing selected values.
- Group member Search / identifiers / adding Groups / grouping Search:
  focused field on open; ordinary nonmodal panel stayed open on Escape;
  native toggle closed it and returned focus. No modal trap is required here.
- Three context menus required native preselection + settled header target,
  per the existing scenario. Menu focus/ArrowDown/Escape passed; mouse-source
  card did not contain focus after Escape. Keyboard entry/visible fallback
  needs qualification; no menu business item activated.
- Compact navigation: desktop load then390px resize, opaque white background,
 20 Tab samples inside, Escape closure and opener focus PASS. Not cold mobile
  readiness, tablet, full responsive or human acceptance.
- Sort-list popup: no automatic menu focus, no role, Escape did not close;
  native toggle closed and regained focus. No sort option selected.

## Labels and contrast (axe4.12.1 / actual browser palette)

Primary occurrence counts (not deduplicated WCAG defects): button-name3,
color-contrast7, scrollable-region-focusable3, label1, nested-interactive2.
Worst reported ratio2.84. Node selectors/check data in external raw JSON.
Column headings, member fold buttons and conditional Group form metadata are
among the targets. Gradients/incomplete checks need human judgement; disabled
controls and every possible custom palette are not certified from this run.
Expanded-filter scan repeats page findings; four Search/Add panels, Rollback,
Message and Administration returned no automatic axe violations in their scope.
That is not complete keyboard/screen-reader acceptance or successful Save.

## Coverage gaps and instrumentation boundaries

- Desktop Grouping More Filters entry intentionally unavailable/hidden: retain
  the existing visibility policy, do not invent a feature to pass an audit.
- Delete Member/Grouping branches, nested Move-choice Escape, legacy Guide
  panels/checklists and all compact card-action/menu variants not certified.
- Reduced motion and sequential keyboard selection/drag alternative not run;
  existing Move dialogs alone do not prove keyboard entry to checkboxes.
- Panel/member overflow-menu coverage is conditional; see final raw report.
  A visible layout rect in an off-canvas/inert column is not native availability.
  Never force-click or hide the intercepting ancestor.
- Final paint-qualified pass: Sort audited; Panel overflow trigger had a layout
  rect but no centre hit, Member overflow had no enabled painted trigger.
  These two menus remain unverified, not classified as broken from a forced click.
- A preselection-free context click and an open-qualified navigation locator
  both had harness failures. Their immutable generated contexts/raw/cleanup
  are retained. Stable navigation-ID successor provides actual closure proof.
- Accessibility audit runners can exit0 with completed=true and passed=false.
  Completion only means the diagnosis ran, not WCAG/visual/human PASS.

## Prioritised correction handoff (not implemented)

1. Shared custom-modal focus entry/confinement/return: fix through the canonical
   Kit lifecycle, preserve nested handled Escape and native Move/Save commands.
2. Delete confirmation and contextual/rollback return-focus qualification.
3. Member-fold button labels, conditional field labels and nested interactive
   controls; preserve authoritative language strings and actual role semantics.
4. Contrast of configured column titles/form metadata and keyboard-scrollable
   detail lists; do not force all semantic text to black or remove state colour.
5. Sort-popup keyboard contract; then remaining conditional/compact/reduced
   branches after stable integration. Keep audit gaps and human review open.

Raw results indexed externally by ROADMAP-RAW-INDEX.json; no media/auth state
committed. Credentials cleared, dedicated leases released, no new fixture.
