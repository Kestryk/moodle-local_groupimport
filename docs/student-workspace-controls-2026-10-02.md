# Student workspace and compact portal continuation

Owner: isolated EasyStud Student-management worktree; batch EED-UI-2026-0073.
No shared Platform planning/index/crosswalk file is edited without its owner.
Kit `24d945e` owns the shared workspace controls; Kit `f0a25fd` (0.4.53)
also owns the current content-fit native message adapter. Embedded
modules are byte-identical; `fullTreeIdentical=false` remains intentional.
The whole legacy plugin has not yet been converted into class-only templates.
Kit documentation checkpoint `e8e2aab` maps the paired Penpot components;
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

Move's six linked specimens and native populated branches now have the later
proof below. Correct the Clipboard phone navigation/help overlap next, then
continue responsive routing and component-family parity from the unchecked
checklist. Product Create heads,
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

## Later checkpoint: native Move and Clipboard

This checkpoint changes Penpot, documentation and test source only. Kit SCSS
stays at `f0a25fd`, consumer visuals at `0deb382`, served by the unchanged
clean preview `a364b014`. No generated asset, PHP, AMD, template, cache or
business data changed. It supersedes the earlier pending Move anatomy and
Clipboard database-blocked statements for the bounded checks below, not the
remaining native-paint/human gates.

Move's existing desktop participants/groups specimens now use linked neutral
Foundation destination-action shells and regular Primary/Secondary actions.
Four narrow specimens cover participants, groups with an unchecked optional
Remove-from-origin checkbox, no groups and no groupings. Native title/help,
destination label/select and centred icon-free footer are represented. Empty
destinations hide label/select and use the exact linked Disabled Primary.
All subcomponents stay in their dedicated Foundation Library families; product
local mains remain zero. Existing whole desktop backups stay hidden/blocked
recoverably on page 04, not claimed moved to Archive.

Foundation Library 08.2.1 and Standard 08.2 have ten regular action states,
with intrinsic label widths, source-backed colours and palette references.
Ten fingerprints match; label centre error is <= .5 canvas unit. The two
neutral 09.2.1/09.2 shells and linked 09.2 specimens also match recursively.
The six product Move specimens have zero painted-text lane overflows and zero
visible top-level board overlap. All visible component IDs resolve to the
Foundation catalogue, including expanded Disabled variants. Source sizes and
explicit legacy-chrome differences are documented in the mirrored modal contract.

Paired readback and exact IDs:
`docs/testing/student-native-move-penpot-2026-10-02.json`.
Do not equate this structural proof with pixel-perfect code/Penpot parity.
Close chrome, legacy shell border/shadow and origin-checkbox paint still differ.
OS-open select decoration, plural actions, business submit/results, asynchronous
states, RTL, forced-colors and whole-view coverage are not certified.

### Native tests and limits

- `easystud-authenticated-20261002T183714504Z-31732`: PASS, six Move
  open/cancel cases at 1600/390, including an existing group in a grouping.
  Inspect `move-native.json`, `move-groups-in-grouping-1600.png` and
  `move-groups-390.png`. No move confirmed or empty course fixture created;
  empty destinations have source/static/Penpot proof only.
- `easystud-authenticated-20261002T185415434Z-42396`: PASS for Clipboard
  field/rest/hover/focus, recognised/unknown pills, containment and close/focus
  restoration at 1600/768/390. Inspect `clipboard-geometry.json` and the three
  `clipboard-<width>.png` captures. No Add/Save/send/OS-clipboard command.
  This is **not a whole-dialog visual pass**: the 390px capture shows a floating
  navigation trigger overlapping help. Do not hide the trigger to pass a capture.
  Modal source layer 1050 versus shared trigger 1064 is a source-backed stacking
  lead; computed stacking ancestors and help hit targets must confirm the cause
  before a shared Kit correction. Legacy danger-tinted Clipboard chrome also
  remains to reconcile with the neutral product specimen.

Both final `cleanup.json` records confirm credentials cleared, lease released,
owned child stopped and no fixture requested. The first Clipboard failure,
`easystud-authenticated-20261002T185205374Z-44280`, remains preserved: it sampled
the border midway through the normal-motion blur transition. The harness now
waits for the exact terminal rest/focus colour; motion is not disabled and
expected paint is not loosened.

Native run roots are below `easystud/authenticated/<run-id>` in the approved
local artifacts root. Final Penpot checkpoints are below
`easystud/penpot/student-compact-20261002`: the Library/Standard
`foundation-native-action-*-final.png`, regular-actions viewport checkpoints,
and `product-native-move-{desktop,narrow,empty}-final.png`. Full regular-family
PNG export was inspected through MCP; viewport files are focused checkpoints,
not a claim to show the complete five-state matrix simultaneously.
Registration pins final evidence alongside the earlier pins; retention is
dry-run only. No material was deleted.

The final namespaced retention report is `retention-20261002T200226Z.json`:
937 expired-media candidates across the broader namespace, zero deletions.
This is an inventory, not deletion authority. Twelve Penpot checkpoints,
two native Move captures and all three Clipboard captures are pinned; earlier
retained evidence stays pinned.

### Durable owner handoff and next step

Platform owner: add these exact source/readback/run IDs to 0073,
source-to-Penpot crosswalk, state and scenario registry without ticking human
acceptance. Register `student-move-dialog-audit.spec.js` as local-supervised,
EasyStud/QA, existing authenticated populated course/runtime lease required;
Docker/CI reuse needs deterministic non-production fixtures. Clipboard remains
local-supervised under the same restrictions. Shared dirty planning files are
preserved; this portable row proposal is not a claimed Platform registry update.

Next priority: measured mobile modal/navigation layering and neutral Clipboard
chrome, then Create heads and remaining unchecked families. Keep original card
and disclosure animations. Human checklist is still deferred; nothing must be
opened or answered now. Preview promotion is unnecessary for docs/test-only
changes; include their predecessors on the next visual promotion. Pushed source
does not constitute a verified workspace snapshot or production release.

Efficiency note: repeated wrong-workdir/path guesses and broad reads still cost
avoidable calls; use resolved worktree roots and exact `rg --files` matches.
Newly copied Penpot text can return the desired characters while painting an
old label; a measured resize/reflow restoring the original lane and growType
fixed the cache discrepancy, whereas repeated character toggles did not.
Verify painted bounds and captures after reflow. Nested product resets/swaps
can restore generic parent copy: replace only the exact linked action in an
ordinary host and preserve the whole superseded action. Per-task token/billing
telemetry is unavailable; no quota-saving figure is asserted.

## Source checkpoint: Clipboard layering and neutral chrome

P1 continuation of EED-UI-2026-0073: Kit owns the fixed-root layer and neutral
lookup composition; EasyStud only calls public classes in its existing
Clipboard template. Other dialogs, card Motion, business commands and shared
Platform planning files are excluded. Full-tree parity remains false.

Baseline `easystud-authenticated-20261002T201951972Z-46704` on clean preview
`a364b014` passes existing controls but records **three covered helper
characters at 390px**, zero at 768/1600. The fixed modal measures 1050; the
responsive trigger 1064. Recorded ancestors show no additional transform,
opacity or isolation on the modal path. Captured paint confirms the collision.
This is diagnostic evidence, not a post-fix PASS. Cleanup confirms credentials
cleared, lease released, owned child stopped and no fixture/business command.

Evidence under external `easystud/authenticated/<baseline run>/playwright-output/`
`student-clipboard-foundati-27ef9-ultiline-and-lookup-results/`:
`clipboard-geometry.json` and pinned `clipboard-390.png`. The candidate scenario
adds unobscured helper-character centres, root ordering, neutral border/header,
16px title and 13px help to existing field/result/close/focus checks. Its source
blob `f2fa0e3de81e2dcd5a2f1252781e669510a148a3` has not run on the candidate.

Kit WIP `df19d750abd4642cd40f896d83f1414dfaff1bcd` / 0.4.54 exposes
`easyedu-modal-layer` and `easyedu-lookup-dialog` with header/body/description
roles. The layer uses the navigation-panel token plus four (default 1070),
not an inner-dialog z-index patch. Chrome reuses modal-surface and white paint.
Native 34rem cap, six rows, parser, live results and focus/close/Motion remain.
No plugin-local skin or ordinary inline style added. Three canonical modules
are byte-identical; current hashes and historical pin updates are in the
consumer manifest. CSS is compiled, not hand-edited.

Static gates pass: Kit compact-portal compile contract; consumer Clipboard,
workspace, native Text-field and message-portal contracts; Node syntax and diff
checks. Sass reports the existing mixed-declarations warning in `_layout.scss:113`.
Moodle floor remains 5.1; no PHP/AMD/API change or cross-version certification.
References: [Moodle coding style](https://moodledev.io/general/development/policies/codingstyle)
and [MDN stacking contexts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context).

**Paired Penpot publication is pending.** No Penpot mutation ran in this
continuation. Last successful read confirmed desktop Clipboard host
`cef95197-06bc-809e-8008-aeffacefdf24` and linked textarea
`cef95197-06bc-809e-8008-aeffd025d4c6`. Dedicated CDP 9223 froze after switching
files. Its exact owned browser closed gracefully; the environment rejected
relaunch. No other profile closed, no profile replaced or bypass attempted.
User was asked to relaunch the existing profile and connect Foundations.

Resume with paired neutral lookup Library/Standard specimens, then linked
product Desktop/Narrow and painted readback. Only then run managed preview
promotion, including `60cbf72` and `66a5737` predecessors in order, candidate
commit and cache gate. Runtime stays clean at `a364b014`, with no cache/data
write here. Stronger assertions are candidate-only, not expected to pass on
this unchanged baseline. No release/deployment or human acceptance claimed.

Platform owner: record baseline, WIP and Penpot/preview boundary in
0073/crosswalk/state/registry. Shared dirty planning files are preserved;
this portable proposal is not a claimed registry update. Checklist remains
unchecked and pushed WIP is not a verified workspace snapshot.

Efficiency: wrong headings/roots and broad output caused avoidable retries;
use discovered paths/anchors, current-page Penpot lookup and wait for shell
completion before MCP. No billing/token measurement is available. Retention
is dry-run only; an expiry inventory does not authorise deletion.

Final retention inventory: `retention-20261002T203051Z.json`, dry-run, 937
candidates, zero deletions/errors. Baseline 390px defect capture is pinned;
earlier retained evidence remains unchanged. No workspace/runtime cleanup ran.

## Paired neutral-lookup checkpoint after reconnection

This supersedes the prior Penpot-reconnection blocker, not the baseline defect
or deferred human acceptance. Foundations 09.2.1 Library now publishes neutral
Desktop/Narrow lookup sources; 09.2 Standards consumes linked copies. Recursive
visible fingerprints match. The full Standard export was inspected and Library
caption paint was separately reflowed/read back. See the paired module contract.

EasyStud page 04 uses those sources for the existing Desktop Clipboard host
and a Narrow mobile composition at x3100/y80. Both have native business help,
linked Textarea M with three example values, linked Close and recognised/unknown
result tokens. The longer mobile helper uses a three-line lane with a 1rem gap
before the field; results wrap inside the neutral surface. No header icon,
eyebrow, Add/Save footer, local component main or competing shared library.
The whole former host is cloned, hidden and blocked; superseded children remain
hidden in place. Visible descendants and the new mobile board have no bounds
escape or page collision. These are measured specimens, not fixed runtime heights.

Readback: `docs/testing/student-neutral-lookup-penpot-2026-10-02.json`.
Readable Desktop/Narrow browser captures were inspected under external
`easystud/penpot/clipboard-neutral-20261002/`. The product MCP export timed out
once; no repeated export or ambiguous mutation. Native Close chrome, token-family
optical centring, full lookup states, RTL, forced-colors and human review remain
explicit gaps. Selecting the first provider/font-size match initially targeted
hidden legacy descendants; semantic effective-visibility selection and later
paint readback corrected the visible specimens. No business code changed here.

Managed preview remains the next gate: include source prerequisites `60cbf72`,
`66a5737`, `ce20e0f` and this documentation checkpoint in order, then purge and
run the immutable Clipboard candidate. Platform planning/crosswalk/registry
files retain their existing owner; this consumer document is the exact portable
handoff, not a claimed edit to those shared files. Checklist remains unchecked.

## Final neutral-lookup local preview proof

Managed promotion `20261002T205705Z.json` applies `60cbf72`, `66a5737`,
`ce20e0f` and `2f58db3` in order to a clean expected runtime and purges caches.
Preview `b8a3c0f74a942bc564722b7371d80691470a4a91` serves the candidate CSS blob
`16847d1a6e2268cab3dd52eb8966f9d0bf972ea7`. No manual runtime copy or reset.

Discovery selects exactly one candidate before authentication. Final run
`easystud-authenticated-20261002T205725336Z-32120` passes at 1600/768/390:
111 painted helper characters per width, all unobscured; modal root 1070 above
navigation trigger 1064; neutral border/header, 1rem title, .8125rem helper;
native six-row field rest/hover/keyboard focus, recognised/unknown live results,
close and return to the opener. Three PNGs were inspected and pinned. Cleanup
confirms credentials cleared, runtime lease released, owned child stopped and
no fixture/business mutation. This supersedes the earlier Clipboard collision,
not other modal/navigation interactions or full Student-view acceptance.

Review folder: external `easystud/authenticated/<final run>/playwright-output/`
`student-clipboard-foundati-27ef9-ultiline-and-lookup-results/`. Inspect
`clipboard-390.png`, `clipboard-768.png`, `clipboard-1600.png` and geometry JSON.
Penpot captures have their own manifest under
`easystud/penpot/clipboard-neutral-20261002/`. Earlier failure evidence remains.

Source gates rerun with explicit KitRoot: Clipboard and workspace contracts,
Node syntax and diff checks pass. Source/scenario/generated blobs are unchanged
during the run. Modal docs have the same normalized Git blob in Kit and consumer;
the AI contracts retain repository-specific guards intentionally. No new
SCSS/PHP/AMD or business logic changed in the publication/proof documentation.
Moodle 4.5/5.2/5.3, sending/moving/importing, RTL, forced-colors and all states
were not tested. No release/default-branch merge or human acceptance is claimed.

Platform-owner proposal: update 0073/crosswalk/state/registry with paired lookup
IDs, source `df19d75`, consumer `ce20e0f`/`2f58db3`, runtime `b8a3c0f`, final
run and deferred human status. Shared dirty Platform files remain untouched.
Next bounded visual slice: drag target Allowed/Denied/Danger, keeping original
card disclosure Motion and existing drag/drop commands unchanged.

Efficiency audit: no per-task token/billing telemetry is available. Avoidable
cost came from broad output, unqualified hidden-descendant selection, missing
test parameters and one slow MCP export. Prefer compact visible-anatomy reads,
documented parameter names, and captured paint/readback after reflow; do not
retry an unchanged timed-out export. Retention is inventory-only, no deletion.

### Continuation audit and operational boundary

The suggested drag-target implementation was stale: current canonical and
embedded `_overlays.scss` share blob `66208bc3618e3e002d33f9c3c7f907ecce155589`.
They already implement the 2.5rem flat allowed plus and refused xmark; the
consumer ledger also records earlier desktop Allowed/Denied proof. Do not
recreate these controls. The current candidate still hides its decorative
pointer-following preview for target-only captures; future paint certification
should additionally preserve realistic foreground visibility. Drag is suppressed
at <=1024px, coarse pointer or hover-none; audit mobile selection/action routes
instead of promising native mobile drag. No drag scenario ran in this tranche.

Next actual implementation slice: source-complete Participant detail and
Group/Grouping advanced dialogs. `manage.mustache` still uses `h5 mb-0` for
Participant and Delete; `openAdvancedSettingsModal` emits Group/Grouping title,
forms, lists/counts/CSV, group image/file selection/delete-picture option and
Save/Cancel/native-link footer with legacy classes. Audit both branches before
mapping public Kit roles; do not turn read-only Participant into an editing
dialog, lose conditional data or send Save/Delete. All original disclosures and
Motion remain excluded from rewrites. New runtime scenarios need the bounded
named preview/test gate; the Clipboard PASS does not certify these dialogs.

The local `easystud-moodle51` status profile still names an older preview branch,
so its helper classifies this clean active lane as `unmanaged-preview` despite
the recorded managed promotion and applied commits. No profile was changed;
report exact branch/HEAD/record, not a false profile-health certification.
Two focused retention dry runs cover the new authenticated and Penpot evidence:
`retention-20261002T210348Z.json` / `retention-20261002T210349Z.json` in their
respective run folders. Each has one protected manifest, zero candidates,
unmanaged files, deletions or errors. The over-broad global inventory completed
normally before the bounded stop guard matched; no process was stopped. Its
`retention-20261002T210408Z.json` reports 1432 manifests, 2504 candidates,
600 protected entries, 772 unmanaged media, zero deletions/errors. This is an
inventory, not deletion authority. Prefer run-scoped inventories for iteration.
No verified transfer snapshot was created; pushed clean branches are not a
claim of complete multi-machine transfer readiness.

### Entity dialog chrome continuation

The next slice is now implemented as an uncommitted canonical Kit 0.4.55
candidate and an identical embedded module, not a served Moodle change.
Participant remains read-only. Group image/enrolment key/delete-picture,
Grouping configuration, lists/counts/hidden CSV tables, native URLs and all
original Motion/focus commands are preserved. Duplicate local header/footer
skins were removed; title/eyebrow/tile/header palette and right-aligned matched regular
actions now consume opt-in Kit roles.

Foundations has paired Desktop/Narrow header-only Standard/Library sources;
the three desktop product headers and seven linked native actions were
re-read after text reflow. All six visible header texts use Inter, rows are
recorded in the historical centred-footer snapshot; current right-aligned
matched actions have their separate 2026-10-03 readback. Icon-box/label gaps are
10.4px and no visible descendants escape the
three existing hosts. Five final editor captures were inspected. A hidden
legacy body/footer remains recoverable; original Shell M and product business
contents are retained. Body styles, generic Close action and full responsive
product compositions still need their own parity pass.

Detailed source inventory, exact IDs, checks, known pre-existing Administration
contract failure, new named runtime gate and Platform-owner proposal are in
`docs/student-entity-dialog-chrome-2026-10-02.md`; machine-readable readback is
`docs/testing/student-entity-dialog-chrome-penpot-2026-10-02.json`.
Discovery selected exactly one scenario without authentication or a runtime
lease. New commit/push, preview/cache and 1600/768/390 open/cancel proof await
the named user approval. Runtime remains clean at `333b753`; the prior
Clipboard PASS is not proof for this new candidate. Human checklist is open.

The current footer continuation and served-versus-source inventory are in
`student-modal-footers-2026-10-03.md` and
`student-transposition-status-2026-10-03.md`. Historical browser pins remain
unchanged; source-module candidate pins are additive and not a runtime PASS.
