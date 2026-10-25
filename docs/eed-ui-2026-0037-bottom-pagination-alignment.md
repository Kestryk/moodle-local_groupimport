# EED-UI-2026-0037 - EasyStud bottom pagination alignment

## Scope

This correction applies only to the Groups and Groupings columns in the
Simplified Student Management Structure workspace. Both columns now share the
remaining height of their existing panel block.

The dynamic pagination already remains the final child of each list and uses
`margin-top: auto`. Giving each column the available height makes that existing
rule useful for short lists, while long lists keep their normal scrollable
content flow.

## Preserved behaviour

- Pagination remains in its list and is never viewport-fixed.
- DOM order and keyboard order are unchanged.
- No list limits, sorting, filters, menus, cards, identity styles or mobile
  layout are changed.
- Participants and the Complete workspace are excluded from this correction.

## Validation boundary

`tools/release/test-bottom-pagination-alignment-contract.ps1` checks the
source and generated CSS geometry. A human preview review remains separately
authorised and should inspect short and long Groups/Groupings lists.
