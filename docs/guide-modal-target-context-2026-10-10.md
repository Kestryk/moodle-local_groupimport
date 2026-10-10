# Guide modal target context - 10 October 2026

Programme: EED-UI-2026-0073, G11-E / remaining engineering lot2.
Existing Source worktree only; Kit and writer artifacts unchanged.
This is a product adapter correction, not a new visual recipe or guided path.

## Scope and actual native inventory

| Branch | Native control / command | Current Guide coverage |
| --- | --- | --- |
| Global Participants | Shared Move dialog, enhanced destination; `addusers` after explicit confirmation | Existing practice-membership destination/confirm steps |
| Members selected inside Groups | Same dialog with immutable Group/User pairs; guarded `movemembers` | No dedicated active path or member opener; remains open |
| Selected Groups | Same dialog, grouping destination and optional origin removal | Not certified by Participant practice proof |
| Group advanced editing | Dynamically generated advanced-settings form; read-only member and grouping lists, native editable name/description fields | No declared edit-field path; do not invent a member dropdown |
| Grouping advanced editing | Advanced-settings form with read-only group list and editable fields | No declared edit-field path; remains open |

The existing `tutorial:participant-move-dialog` previously accepted any already
open shared Move dialog. Its destination/confirm selectors also lacked native
context qualification. This could associate Participant guidance with a Member
or Group action. The correction exposes `data-easystud-move-context` at real
opening, qualifies both existing target selectors and requires Participant
context before acknowledging that opener. Cleanup uses the original completed
exit callback. No action is submitted and unrelated open dialogs are not closed.

## Preservation and validation

`node tools/release/test-guide-move-context.cjs` executes the actual production
opener in isolation: Participant/Member/Group/untyped existing dialogs, enabled
and disabled native opening, and foreign-root events. Six cases pass. Exact
reconstruction against f31fa994 preserves all other course-manager code and
all PHP configuration outside the two target selectors: paths, reading history,
labels, transaction handlers, selection and Motion are unchanged.

PHP lint and the existing Course Manager AMD/map builder pass. No shared CSS,
Mustache, Kit version, Penpot design, server endpoint or course data changes.
Declared Moodle floor remains5.1 (`2025100600`); no new version-sensitive API.
Native browser proof and human acceptance must be recorded separately.

## Next gates

1. Promote this bounded candidate with earlier documentation prerequisites,
   then rerun the existing three-width native Participant highlight/open/Cancel
   scenario without creating a group or confirming a transfer.
2. Prepare distinct member/edit target declarations and meaningful optional
   steps using the actual inventory above. Preserve existing path IDs and
   predicates; do not relabel Global Participant assignment as member transfer.
3. Test real modal fields and checklist stacking, search, prior-step review and
   Cancel at desktop/tablet/mobile. No fake native completion or fixture writes.

Rollback is the bounded context adapter/selector change plus its generated
AMD/map, not a stylesheet or progression reset. No cleanup of runtime data is
needed. Shared platform planning remains owned by its planning window; this
source ledger is the portable continuation record. The user checklist is open.

## Served successor and preserved diagnostic

Source b8cbb1a is pushed and served by clean preview7857a0f after ordered
documentation predecessors352afe3/f31fa99 and the managed cache purge.
Snapshot ws3-20261010T104135Z-port4719pg3-c1384f9c670d passes restore verification.
Earlier staging-only failed snapshots are preserved: Windows line-ending/index
stat mismatch, not lost source content. Normalize owned working-file endings
and refresh staging before retrying; do not weaken the snapshot verifier.

Native run20261010T104307686Z-26972 is retained as FAILED. Desktop completed
selection/Move/destination/confirmation highlight and context cleanup assertions,
then the harness attempted historical Organisation slide index2. The current
twelve-slide lesson has a different index; no matching context paragraph exists
there. There were no page errors or blocked writes. Credentials cleared, owned
child stopped and lease released. No course transactions or fixtures.

The immutable successor `guide-stable-slide-modal-targets-native.spec.js` locates
both creation and Organisation through current stable IDs. It preserves all
strict highlight, context, invitation and painted-copy assertions; no product
assets were modified to correct the harness. Classification: local-supervised,
not CI-ready (saved credentials, leased native Moodle and existing course needed).
Shared registry submission belongs to the Platform planning owner.

The stable-ID native successor43544 passes strict Participant destination/
confirmation and context cleanup at1280 and768, including Organisation paint.
At390, selection completes but the Open Move highlight disappears. Native
diagnostic records current target null, enabled hidden desktop source and the
real mobile action present. No page errors, blocked writes, fixtures or command
confirmation; credentials/child/lease cleanup complete. This is retained as a
product failure, not covered by the desktop/tablet passes.

The native mobile renderer rebuilds all proxy buttons on every selection/density
refresh. The Guide observes a particular DOM target and clears it when detached;
replacing proxies can therefore discard an otherwise valid cue. The bounded
successor keys proxies by their original native action selector, refreshes their
existing icon/label content, reorders retained buttons and removes stale actions.
`test-guide-mobile-action-identity.cjs` executes the production renderer and
compares the entire unrelated source against b8cbb1a. It also replays the immutable
six-case context guard against reconstructed source. All isolated checks pass.
Native replay is required to establish whether this repairs the observed failure.
No new CSS, shared Guide-engine change, action command or fabricated completion.
