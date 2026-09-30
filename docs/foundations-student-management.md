# Foundations Student Management migration

## Scope and evidence boundary — 2026-09-28

User authorized starting Student Management after the CSV disclosure correction.
This isolated first slice migrates workspace identity, typography and large
panel chrome to the canonical Kit class API. It preserves native title menu,
navigation, all card contents, data attributes, forms, membership actions,
mobile overflow menus and existing panel-height/scroll behavior.

Source of presentation: EasyStud Penpot page
`92c1c225-95fb-802e-8008-ae9f13d0b0b9`; desktop Complete view
`92c1c225-95fb-802e-8008-ae9f13f14484`, mobile Participants
`cef95197-06bc-809e-8008-aeeaa9e3ad0d`. Live readback measured desktop title
30px, description 16px, column title 22px; mobile title 23px, description 13px.
The shared `workspace-classes` module owns these rem-based responsive recipes.

Old local title-dropdown decoration and panel paint were removed, not patched
with another product stylesheet. Existing panel behavior remains local.
Default desktop columns become equal-width with the measured 32px gutter.
Navigation and layout-toggle spacing no longer accumulates three margins.

## Remaining slices

2026-09-30: the user accepted the Penpot controls and requested resuming the
Student Management implementation. This is not blanket acceptance of every
composition or a completed runtime migration.

The first card slice now consumes canonical `person-card-headline` and
`selectable-card-header` recipes in all five existing header contexts:
detailed, compact and selected-compact participants, groups, and groupings.
Selector specificity, DOM, content, action slots and responsive overrides are
unchanged. No JavaScript, animation, template or business behavior was edited.
The previous embedded 1.35 card-title line-height fix is promoted to canonical
Kit rather than lost during synchronization.

Canonical candidate: `scss/easyedu/components/_cards.scss`, Git blob
`886821d943874bfd9a0dcfa604650853c39dea72`, based on Kit `ce8a701`.
Both source worktrees remain uncommitted; the manifest records the candidate
separately from the last committed synchronization, without inventing a SHA.

Validation: the Kit's five-variant compilation contract, consumer adapter and
canonical-hash contract, and both Phase 0 regression contracts pass. Full CSS
compiled before/after has identical SHA256
`D8A3B655C053D97CCEC50CE3964DC886601C11AA2B3B4D501171AA83C935DC25`.
Rebuilding `styles.css` produces no tracked asset change. This proves a
source-preserving extraction, not a new visual or accessibility acceptance.
Existing Sass `mixed-decls` deprecation in the loading/layout integration is
unchanged. Moodle floor remains 5.1 (`2025100600`); no runtime, browser session,
cache, lease, database or other Moodle version was exercised in this slice.

Reproduce using the local paths supplied as parameters, not stored in source:

```powershell
./tools/release/test-student-card-header-contract.ps1 -KitRoot <canonical-checkout> -BaselineCss <before.css>
./tools/release/test-phase0-mass-admin-contract.ps1
sass scss/easystud.scss styles.css --no-source-map
```

Baseline and after artifacts are under the workstation-local EasyEdu artifact
root, folder `student-header-extraction-33e5ac766cd24738991979df45aee947`.
Omit `-BaselineCss` for the normal source contract; the full extraction parity
check requires the preserved baseline from the same compiler version.

The next implementation slice is the card action/control styling and metadata
contents against the accepted Foundations variants, retaining this geometry.
Header extraction alone must not be described as complete card styling.

### Action and metadata preflight after header extraction

Source inspection found explicit migration targets, not yet changed:

- Participant details action still defines a circular local border and a
  1.7rem desktop control, overridden to 1.85rem on mobile. Its grid placement
  is independent of that paint and must remain intact.
- Group search, mail, duplication, settings and unlink actions still have
  multiple local border/colour/focus recipes. Preserve each selector and
  semantic action while reconciling their appearance with the accepted linked
  Foundations controls; do not normalize colours by guesswork.
- Responsive workspace rules intentionally hide the desktop action family
  and retain the existing overflow menu. A shared recipe must not override
  this visibility or introduce duplicate mobile actions.
- Participant metadata labels still use local 0.67rem/700 typography,
  0.06em tracking and an uppercase treatment. Measure the accepted label role
  before replacing it. The metadata grid currently reserves 5.25rem for labels
  and wraps tags in a separate flexible lane; preserve contents and overflow.
- `templates/manage.mustache` renders the native details button and repeated
  metadata sections. Existing controls and labels are not empty decorative
  placeholders and must survive this migration.

Penpot read-only connection identified `EasyStud — Product views`. The next
shape inspection was rejected because the browser tab had no heartbeat for
45 seconds. No component values were returned, no Penpot mutation occurred,
and no new action/metadata styling was implemented. Resume from the linked
action instances once the user focuses the tab; do not substitute the older
source colours for the approved Foundation values.

- Layout-mode and mobile entity selectors; source-backed active/disabled states.
- Filters, quick creation, participant compact/expanded metadata and actions.
- Group/grouping contents, overflow, inline search/add-by-identifier, drag/drop.
- Context menus, populated modals and keyboard/reduced-motion coverage.

No assertion of complete Student Management migration follows from this slice.
Browser checks must inspect desktop, tablet and phone using real populated
cards without submitting imports, memberships, messages or settings.

## Verified first-slice evidence

### Direct-action continuation — 2026-09-30

Penpot reconnected successfully to EasyStud. Read-only inspection through its
connected Foundations Library returned the Direct icon main
`10fc9fee-0b8e-807e-8008-98ead919bfd2` and all five sibling states. The main is
29.6px square (1.85rem), with a 15.2px icon slot (0.95rem), transparent rest
surface and no visible border. Hover #f7fbff/#bdd0e5; pressed #eaf4ff/#b8d5ef;
focus #8abce3 plus 2.88px primary-22% ring; disabled
#f0f4f8/#d7e1ea/#9aa9b8 without reduced root opacity. Product eye instances
use #0b5ea8 glyph overrides; this implementation follows the canonical
#0f6cbf primary instead. That known product override is not silently claimed
as pixel parity.

New canonical `_card-actions.scss` is mirrored exactly in the consumer, blob
`8eb641a622b1ec1ab48abcea0c8e71773cd9e211`. Five families consume the mixin:
participant details and group mail/identifier-add, duplicate, member-search and
settings controls. Existing selector/event ownership remains unchanged.
Participant details now use the measured 1.85rem size rather than the older
1.7rem desktop override. Group controls retain their 1.85rem size. Metadata,
unlink, rename, container-search and responsive overflow remain separate work.

Sass build, Phase 0 contract, header source contract and the new action contract
pass. `test-student-card-actions-contract.ps1 -KitRoot <canonical-checkout>
-BaselineCss <before.css>` checks source equality, all five states/families
and unchanged compiled CSS outside these actions. The earlier full-stylesheet
equality applies only to the header extraction, not this intentional paint
change. No AMD/template/responsive source was edited. No Penpot mutation,
runtime deployment, cache change or browser visual validation was performed.
Both source worktrees remain uncommitted. The earlier Sass deprecation remains.

Next: managed preview and desktop/tablet/mobile action-state verification,
then metadata and remaining card controls. Do not claim full-view completion.

Preview preparation: the user explicitly authorized the bounded Kit/consumer
commit and push, local Moodle 5.1 preview apply, cache purge and focused card
test. Canonical Kit source is now pushed at
`d9e7a6ac425c2f3c9b5066bdfb00b44f94400e25`. The earlier uncommitted status is a
historical checkpoint, superseded for Kit by this SHA. Runtime preflight found
a clean `preview/moodle51/easystud-phase0-mass-admin` at `8a9edf2`, no active
runtime lease. The new one-test scenario is documented in `tools/playwright/README.md`;
syntax checks pass. Runtime execution results will be recorded separately.

### Earlier workspace-shell evidence

Canonical Kit `ce8a701`, consumer `374f88c`, Moodle 5.1 preview `8a9edf2`.
Sass compilation and the pinned embedded-module contract passed. Authenticated
run `easystud-authenticated-20260928T201728645Z-51068` passed at 1600, 768
and 390px: Inter, 30px/23px title, no horizontal document overflow, equal
desktop columns and no panel shadows. Desktop/mobile viewport captures were
inspected; the earlier root capture clipped content because Moodle scrolls
its page wrapper, so the preserved test now captures the actual viewport.
Cleanup confirms cleared credentials and released runtime lease. No membership,
message, import or settings mutation occurred. Human acceptance is pending.

The cards and filters in these captures still use their existing implementation;
the test proves only this shell slice. In particular compact participant names,
filter density, mobile sorting and card action alignment need their own pass.

## Execution-efficiency note

Most avoidable work in this continuation came from the disclosure harness:
viewport-relative measurements misread scroll anchoring, and repository form
replacement required awaiting Moodle's URL `action=list` response. Preserve
the corrected small test instead of repeating broad page audits. No reliable
per-task token counter was available, so no token savings are claimed.
