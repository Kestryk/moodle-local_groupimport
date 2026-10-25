# EED-UI-2026-0036 - Complete-view ungrouped card identity

## Phase 1 scope

This phase changes only the **Groups without grouping** disclosure in EasyStud
Complete view and the visible focus treatment of expanded Grouping cards.

- The ungrouped disclosure uses a restrained plum rail, border and formatted
  card title. Its rail uses the Kit's separate-node `ungrouped` icon, so it is
  visibly distinct from participant, Group and Grouping cards without becoming
  a loud secondary panel. It remains a Group disclosure: its markup, list,
  keyboard behaviour and actions are untouched.
- An open ungrouped disclosure retains its inner focus edge.
- An expanded Grouping card also retains the same full inner focus edge as its
  closed state, including when selected.

## Excluded

Pagination, modal disclosures, navigation, filters, Filepicker, markup and
the shared UI Kit are deliberately excluded from this phase.

## Validation boundary

`tools/release/test-complete-view-ungrouped-card-contract.ps1` verifies source
and generated CSS. Human preview review remains separately authorised.
