# Student modal footer correction - 2026-10-03

Batch: `EED-UI-2026-0073`. This candidate continues the entity-header tranche
in `student-entity-dialog-chrome-2026-10-02.md`; it does not certify body parity.

## Result and cause

Destination, entity-settings/detail and native Message action rows align to
the inline end (right in LTR). Each pair shares font, minimum height, padding
and radius; widths still follow the translated label. Primary/secondary paints
remain distinct. Regular is Inter 14.08px/600, 37.6px minimum height, 11.52px
radius. Message preserves its existing compact Inter 12px/700, 26px, 8px.
Readonly Participant keeps only its optional native-profile link, no Save.

The mismatch came from using the generic regular Primary with the intentionally
smaller generic Secondary. The Kit now owns `foundation-dialog-actions` and
an opt-in matched-size path, consumed by public dialog classes and the native
Message adapter. No consumer-only footer skin, inline paint, business command,
default card/inline control, PHP API, plugin version or Motion change was added.

## Penpot and source evidence

Machine-readable record: `testing/student-modal-footers-penpot-2026-10-03.json`.
Four existing Foundation Standard/Library pairs match visible recursive
geometry, typography and paint: Desktop/Narrow Destination and Message.
Product readback covers six Destination states (including two no-destination
disabled confirmations), two Message sizes and three entity hosts. All labels
are contained; right-inset and paired-height deltas are below 1px. Entity
icon/label box gaps remain 10.4px. Standard linked roots required a separate
absolute-label re-read: geometry propagated while old override coordinates did
not. Original body/option/command content and linked sources remain recoverable.

External artifacts: `%LOCALAPPDATA%/EasyEdu/artifacts/easystud/penpot/modal-footers-20261003/`.
Eight selected editor captures are inspected and pinned by manifest. Some
editor canvas paint is blurred; the API readback corroborates geometry and
containment, but is not a pixel-perfect native/Moodle proof. A direct PNG export
did not finish in the bounded wait; the orchestrator wait was terminated and
no export parity is claimed. No repeated export or bulk Library update ran.

The three canonical SCSS modules are byte-identical in the consumer; CSS is
rebuilt with `sass scss/easystud.scss styles.css --no-source-map`. The ledger
pins current source/CSS/scenarios and retains previous browser asset pins.
The old 2026-10-02 header record remains historical; its centred footer record
is superseded by this new record, not silently rewritten into a runtime PASS.

## Checks and pending gate

Kit `scripts/test-modal-footer-contract.ps1` compiles equal regular/compact
pairs, wrapping/right alignment and distinct palettes. The existing Foundation
focus contract also passes. Consumer footer and entity contracts validate the
canonical pins and saved Penpot evidence, not a fresh browser run.
Updated Move/entity/harmonisation browser candidates measure paired heights,
font and right edge without confirming, saving or sending. Those candidates
have not run against this source tranche. Normal Motion remains enabled.

The Sass mixed-declaration warning in `_layout.scss` is pre-existing. The older
Administration hint-location contract is separately known to fail; no unrelated
source/test was rewritten to disguise it. Full modal bodies, conditional states,
translations, RTL/forced colours and the global human checklist remain open.

Final source checks PASS: Kit footer/focus/compact-portal compile contracts;
consumer footer/entity, card-modal, live entity rehydration, inline feedback,
visual roles, message and workspace contracts; three candidate specs and AMD
source/build syntax; both `git diff --check`. The Administration hint-location
test was re-run and retains its separate known baseline failure. No browser
candidate was executed in this correction tranche.

Owned artifact lifecycle: `artifact-manifest.json`, status `incomplete`, ten
captures inventoried/eight selected evidence files pinned; scoped retention
`retention-reports/retention-20261003T004151Z.json`, dry-run, one protected manifest, zero eligible,
unmanaged, deleted or error entries. No Apply/deletion. Two raw intermediate
captures are retained by the manifest's incomplete-run policy, not treated as
current proof. Both source branches remain 0 ahead/0 behind their upstream
before dirty candidates; no cross-machine transferable handoff is claimed.

## Ownership, promotion and reversal

| Repository | Branch | Baseline / state |
| --- | --- | --- |
| Kit | `work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin` | `29e8d4f983308dd181375dbc8a0e2cf8fffec6df`, dirty owned source candidate; origin upstream |
| EasyStud source | `work/port4719pg3/easystud-foundations-student-management-20260928` | `3c5f9ebda69efd89bc13607d46b9918a381c1e73`, dirty owned source candidate; origin upstream |
| Moodle 5.1 runtime | `preview/moodle51/easystud-phase0-mass-admin` | `333b7539932749b354b1070350412cc33b6d29bb`, clean; no upstream by runtime design |

No new commit/push, runtime file copy, preview promotion, cache purge, credential
load, fixture or membership mutation occurred in this footer tranche. No pushed
handoff/snapshot is claimed. The named local-preview approval remains pending:
owned commit/push, ordered managed promotion/cache and exact existing-data
open/cancel proof. Do not bypass an ownership, conflict or source-base gate.
After publication, reversal is an owned review/revert, not a reset of dirty
worktrees. Existing Penpot mains/bodies remain retained.

Platform-owner proposal, not an edit to shared dirty files: update 0073,
source-component crosswalk, plan/state and scenario registry with the new footer
IDs/pins and pending runtime/human flags. Preserve the historical header/browser
records. Technical/modal contract, changelogs and AI rules are updated in the
two owned repositories; language strings, PHP/version and AMD changes are not
applicable to this SCSS-only correction (prior entity AMD candidate preserved).

## Authorised preview continuation

The user subsequently authorised publishing all owned prepared source and
the local preview, with the human checklist deferred. Kit commit
`cd9b56e6389c58e6bff609c0fad0fa2ad6825fe6` contains the canonical entity chrome
and footer source. Core static contracts and the CSS rebuild pass again.
The pre-promotion paragraphs above remain the historical correction checkpoint,
not the current permission state.

Focused immutable candidates cover entity, Move and native Message at
1600/768/390. The new Message scenario excludes drag; Move now includes the
tablet. Each uses existing data, open/cancel only and normal Motion. Current
scenario blobs are pinned in `consumerSync.studentModalFooters.browserCandidates`;
the original Penpot checkpoint retains its historical scenario revisions.
Runtime/browser outcomes will be recorded separately after managed promotion.

The initial promotion applied source `f938c9c38f176edda5162e145bcbf194d315118b`
at runtime `b6067f4f09521e285b7a0abbc81ce2a7329cdade`, cache purged. The first
entity test (`easystud-authenticated-20261003T010619880Z-13084`) passed desktop
Participant geometry/content checks but failed native return focus after Close.
Cleanup released the lease and cleared credentials; no Save/Send/fixtures ran.
Source inspection confirms Participant lacked a trigger/restore callback.
The bounded correction remembers the real trigger and restores it after the
existing exit completes, including backdrop Close. It changes no shared style
or animation and retains the failure/assertion. Fresh preview proof is pending.

## Efficiency

No per-task token/billing telemetry is available. Avoidable cost came from a
guessed Sass entry, mistaken read-directory, lost plugin-storage helpers after
file switching and a stalled export. Resolve source paths once, keep readback
helpers self-contained, wake the owned editor before MCP and inspect small
capture sets. API painted bounds plus scoped captures are the fallback, with
their limits stated. Retention is dry-run only; no file deletion or service
change is authorized or performed.
