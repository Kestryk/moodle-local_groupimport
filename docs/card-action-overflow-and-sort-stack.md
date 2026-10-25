# Card action overflow and Sort stacking

The shared utility-control typography in this integration is pinned to EasyEdu
UI Kit K3.2 commit `09019ad4e6f05e1683d7f32bae4afa11bb4647d6`.

Group and Grouping card headers use one local overflow trigger. At compact or
intermediate widths, the controller measures the rendered card and places only
actions which no longer fit in that local menu. The original controls remain
the action owners; menu items forward activation to them.

The trigger is also a responsive card-menu hook for compatibility, but its
click is exclusively owned by the local overflow controller. The global
context menu remains available through its context-menu interaction and must
not open from the same click.

Member-list Sort is independent of card actions. While its dropdown is open,
the owning card, pagination and paginated list receive `is-sort-menu-open`.
This keeps a global Groups Sort menu above its first card as well as keeping a
card-local Sort menu above neighbouring cards. The opened Sort dropdown itself
is the paint owner above intermediate-width card contexts; the state is removed
whenever the dropdown closes.

Invariants:

- no duplicate action windows from one activation;
- only actions which do not fit appear in the local overflow menu;
- actions return to the header when space becomes available;
- Sort stays above expanded members and neighbouring cards;
- a Grouping label is shown whole or recovered through More actions; it is never
  visually truncated inside a Group card header;
- Grouping-label recovery is recomputed after viewport and card-header width
  changes, so a previously fitting label cannot remain clipped after a resize;
- the recovered More trigger keeps the plain icon treatment of its sibling card
  actions rather than becoming a bordered pill;
- the recovered More trigger stays at the logical end of the header: card title
  first, More actions second in priority, then only lower-priority controls;
- at responsive and intermediate widths, the local Group/Grouping overflow
  trigger retains the generic touch target and focus path but explicitly keeps
  its borderless `0.4rem` icon treatment;
- across every EasyStud view and breakpoint, More filters, Sort and its selected
  value use the inherited Moodle family at regular weight, while result counts
  use the shared semibold token;
- More actions triggers and their visible action-list items are never
  underlined on hover, active or focus; the visible keyboard focus ring and
  touch target remain unchanged;
- no permission, data, selection or action route changes.
