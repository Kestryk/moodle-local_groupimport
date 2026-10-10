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
