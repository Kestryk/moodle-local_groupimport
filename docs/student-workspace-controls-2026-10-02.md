# Student workspace and compact portal continuation

Owner: isolated EasyStud Student-management worktree; batch EED-UI-2026-0073.
No shared Platform planning/index/crosswalk file is edited without its owner.
Kit `24d945e` owns the shared workspace controls; Kit `f0a25fd` (0.4.53)
also owns the current content-fit native message adapter. Embedded
modules are byte-identical; `fullTreeIdentical=false` remains intentional.
The whole legacy plugin has not yet been converted into class-only templates.
Kit documentation checkpoint `690ba3f` maps the paired Penpot components;
it does not change the pinned SCSS or generated assets.

## Implemented source

- Workspace title 28px desktop/tablet, 22px narrow; panel 20px; view labels
  12px. Body/description are not blanket-shrunk. Card/member title role is
  the softer existing #264861, retaining 14px/700 and 13px/600 respectively.
- Public Search label + native input and matching Create icon control replace
  the two consumer-local skins. Fields share M height/radius/14px Inter;
  responsive hit geometry is retained. Plus uses the existing Foundation path
  as a transparent centred mask, without font-baseline or background square.
- Previous compact drag/message correction: Kit `0a93cdf`, source `4f1077b`
  plus native Cancel fix `4441379`. Drag summary has identity/name only,
  bounded at 288px; Single has no rear/count, Multiple has two rear layers and
  an extra-item badge. Native source cards, selection, drag commands and Motion
  are intact. Message relays resolved theme/font outside the workspace root,
  uses canonical Textarea/actions and preserves Moodle recipients/events.
- No message sent, move confirmed, drop performed, import applied or fixture
  mutated by the focused audits. Existing profile-badge user colour bindings
  and remaining legacy consumer SCSS are not misrepresented as kit-only code.

## Native proof before this control slice

Preview `72dfb5f6f6ff34a0bf1bde44cca99e7750306531`, source through `673db26`:
`easystud-authenticated-20261002T140133462Z-24044` passes native Move,
desktop/mobile Message and compact Participant/Group anatomy; the newer source
test commit `c42ffa1` opens the real populated Group section before measuring.
`easystud-authenticated-20261002T140455069Z-13268` passes four Single/Multiple
drag and allowed/refused target cases. Captures and JSON remain in the approved
external EasyEdu authenticated artifact root. No drop occurs.

The earlier mobile-locator, rotated-AABB width and collapsed-Group harness
failures remain preserved. Native Cancel's blue primary paint was a real
integration defect, fixed by recognising the actual native cancel role.
These runs do NOT prove the newer typography/Search/Create slice.

## Penpot scope and pending checks

Foundations existing Object-card identity titles (three families, five states),
Member-row and populated Detailed member names use #264861. Existing Search
M/Responsive masters use 14px; M becomes 38px, Responsive keeps 42.4px.
Layout-mode S/M/Mobile labels use 12px and retain their icon/hit geometry.
Compact drag mains retain provider/component IDs, 288x96 hosts and 288x72
summaries; movement badge radius is 8px. Standards linked roots were reset to
288x96. Recoverable hidden pre-compact backups remain on their Library hosts,
not claimed moved to the Archive page. Static Penpot previews are upright;
the native existing -1deg movement rotation is unchanged.

Product 03 typography was propagated across all 11 active boards, with 16
linked Search heads. Their durable readback is
`docs/testing/student-workspace-penpot-readback-2026-10-02.json`.
Foundation Standard Search M/Responsive has ten linked states at 14px,
38/42.4px; four mobile layout-mode specimens have centred 12px labels.
Eight old-colour member-name overrides in Card Standards were corrected;
generic identity/member roles no longer retain #16324f on that page.

Compact drag titles now use #264861 in Library and the three linked Standard
instances. Verified cardinality: Participant Single 0 rear / 0 count;
Group Single 0 / 0; Group Multiple 2 / 1. The count is extra items (`+1`
for two), not the total. Native -1deg rotation remains unchanged.

The shared native-message adapter now has its own source-preserving
Foundation Library Desktop/Narrow specimens and linked 09.2 examples. The
compact action density has paired 08.2/08.2.1 state families. Product 04's two
existing message examples use these linked sources; old loose labels, patches,
textarea and M actions are hidden recoverably, not deleted. Whole pre-change
product backups are hidden/blocked on page 04 under IDs recorded in the new
readback; they are not claimed moved to Archive. Message examples have no
extra To/Message/EASYSTUD labels. Both title roles are 16px/700, footer actions
12px/700 and 26px high; the narrow shell is 374 x 395px with a 340 x 256px field.
The larger desktop specimen was reflowed with 60px gutters; the eight visible
dialogue tiles have zero rectangle overlap. Product text containment passes.

New paired evidence: `docs/testing/student-native-message-penpot-2026-10-02.json`.
Native-close chrome, exact radial header highlight and all-state paint parity
are not certified. Move participants/groups Penpot bodies/select/footer still
need native-anatomy reconciliation; the runtime Move check alone does not
complete this gate. Human checklist remains unchecked. Do not claim all
views/components, all paint bounds, forced-colors/RTL or cross-version proof.

## Final focused native proof for this slice

Source tested through `0deb3825efd44e4c354d527f28456a0ae41011c3`, served by
managed runtime `a364b0142ef4335eda5de110630499fa86477b28`, Kit `f0a25fd`.
`easystud-authenticated-20261002T171159560Z-11724` PASSED the single supervised
audit at 1600/768/390: title/control roles, Search wrapper focus, centred plus
mask with no font glyph/background square, Move open/cancel, native Message
desktop/mobile, and compact Participant/Group drag start/end. No data command
was confirmed and no fixture was requested. Native phone message content is
394.78125px high, field 256px, header 52.1875px, footer 52.59375px: the unexplained
fixed-shell remainder is gone. Credentials cleared, lease released and owned
child stopped are all true in `cleanup.json`.

The first responsive harness failure
`easystud-authenticated-20261002T165849627Z-4968` remains preserved. It searched
for the desktop switcher on responsive, which uses a separate native switcher.
The source also repaired a genuine Search class cascade/visibility collision;
Complete-view's structure-only Search remains hidden. Intermediate PASS
`easystud-authenticated-20261002T170350309Z-39176` exposed the mobile message
blank gap during capture inspection; it is superseded by the final PASS.

Final native media root, resolved below the approved local artifact root:
`easystud/authenticated/easystud-authenticated-20261002T171159560Z-11724`.
Inspected/pinned: `message-390.png`, `message-1600.png`,
`move-participants-desktop.png`, `drag-group.png` in its named Playwright case
folder. Penpot checkpoints are in `easystud/penpot/student-compact-20261002`.
Registration/retention is non-destructive: dry-run, zero candidates/deletions;
no unmanifested captures or another window's artifacts were removed.

## Remaining implementation and rollback

Continue Move dialogs, then Clipboard/native responsive routing and remaining
component-family parity from the unchecked checklist. Product Create heads,
all source composition overrides, asynchronous message failure/sending and
whole-view cross-version/mobile/RTL/forced-colors checks are not closed by this
lot. Original card/disclosure Motion is unchanged. Full-tree parity is still
false: scoped shared modules are byte-identical, but legacy consumer SCSS and
existing user-data colour bindings remain; this is not a fully class-only
plugin certification.

No reset/clean/stash or shared planning takeover occurred. Preserve the runtime
promotion record and use a separately authorised managed rollback if needed;
do not reset the shared Moodle checkout. Penpot pre-change hidden backups remain
recoverable. These pushed source checkpoints are not a formal machine transfer:
the verified EasyStud workspace snapshot profile remains a separate gate.

## Planning-owner handoff

Record scoped module pins and final native/Penpot evidence in the canonical
0073 batch and source/Penpot/refactor crosswalk. Shared planning/state/index
files are owned by another window and are deliberately preserved here.
Owner update to request for 0073/crosswalk/state: record the tested source and
runtime, 11 product role boards, paired native-message/action components,
compact cardinality, final run/captures and open Move/paint/human gates. The
portable readbacks/checklist are the proposed update; the shared dirty Platform
files are not silently overwritten. AI-contract entry: no new ordinary inline
paint, do not equate linked bounds with painted/human acceptance, and use the
native responsive switcher rather than inferring it from desktop markup.

## Execution efficiency

No billing or per-task token telemetry is available; no usage/saving numbers
are asserted. Avoidable overhead: broad/truncated reads and guessed filenames
needed repeat queries, missing mandatory script arguments needed corrected
launches, and stale Penpot main-clone proxies required source-preserving
`instance()` then detach instead. Re-read newly created state fonts: an invalid
font variant silently fell back to regular; numeric Inter `700` was verified
after correction before propagation. Family-filtered current-page IDs, actual
script param blocks and bounded readbacks are cheaper and clearer. Wake the
owned Penpot tab before heartbeat-gated calls, and wait for a switched Library
to refresh before concluding a newly published component is missing.
Preserve one focused native audit for the changed
roles, with discovery before loading credentials. No agents were spawned in
this continuation and no shared worktree/runtime ownership was expanded.
