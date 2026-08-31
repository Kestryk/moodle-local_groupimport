# EED-UI-2026-0071 - Additive Copy and Paste memberships

## Failure

The context-menu Copy/Paste flow for a Group used the same server cleanup and
client-side movement helpers as an explicit Move. Pasting a Group into a new
Grouping therefore removed its other Grouping assignments and moved the live
card instead of rendering an additional membership copy.

Participant Paste already called an additive endpoint, but its mutation is now
routed through the same explicit additive service contract so both supported
entity types have regression coverage.

## Repair contract

- Pasting a Participant into a Group adds only the destination membership.
- Pasting a Group into a Grouping adds only the destination assignment.
- Existing memberships and assignments of the same type remain untouched.
- Pasting into a destination that already contains the entity is idempotent and
  reported as already existing.
- The explicit Move action retains its current removal options and continues to
  own every destructive origin cleanup.
- The live DOM creates an additional Group card in the destination Grouping;
  it does not remove the card from another Grouping.

The server keeps the existing course login, `moodle/course:managegroups`
capability, sesskey and course ownership checks. Mutations use Moodle's core
`groups_add_member()` and `groups_assign_grouping()` APIs through
`membership_assignment`.

## Validation protocol

1. Give one Participant memberships in Group A and Group B.
2. Copy that Participant, then paste into Group C through the context menu.
3. Confirm A, B and C remain present immediately and after reopening details.
4. Paste the same Participant into Group C again and confirm no duplicate.
5. Give one Group assignments in Grouping A and Grouping B.
6. Copy that Group, then paste into Grouping C through the context menu.
7. Confirm A, B and C remain present immediately and after reopening details.
8. Paste the same Group into Grouping C again and confirm no duplicate.
9. Run the explicit Move flow separately and confirm its remove-origin choice
   still behaves as labelled.

The PHPUnit service tests prove preservation and idempotence with isolated
synthetic courses. The managed Moodle preview remains the human interaction
gate for clipboard permissions, live DOM rendering, modal rehydration and
toasts.
