# Grouping summary recovery in Group More actions

## Scope

EED-UI-2026-0029 applies only above the EasyStud responsive breakpoint. It
covers the Participant catalogue, Structure catalogue, ungrouped and
Grouping-nested Group card renderings. It keeps the Group card title, member
count, direct actions, permissions and Advanced settings route unchanged.

## Capacity rule

The inline Grouping summary is measured after EasyStud has rendered its full
text. If either the summary or one of its Grouping tokens would be clipped,
the whole inline container is hidden. A hidden summary is not keyboard
focusable and no partial text is shown.

When the hidden summary is an existing interactive disclosure, the Group card
More actions menu receives exactly one recovery action before the normal
context actions. Its visible label is the existing summary and its accessible
name includes every Grouping name. Invoking it runs the existing disclosure;
the menu closes and focus returns to its More actions trigger. Because every
Group context menu retains clear-selection at minimum, the recovery cannot
produce an empty menu.

Only while this recovery is needed, the existing More actions trigger moves
into the released Group header slot and becomes visible as a desktop header
action. It returns to its normal card placement as soon as the complete
Grouping summary fits again; no permanent desktop menu is introduced.
Opening the context menu transfers focus without scrolling, so that focus
management cannot invoke the existing desktop rule that closes a menu after a
real user scroll.

For a non-interactive single Grouping token, the token is hidden rather than
ellipsed and a non-focusable screen-reader description retains the membership
information. No artificial menu action is created for an operation that did
not previously exist.

## Responsive boundary

At or below 1024 px, the existing responsive rule continues to suppress inline
Grouping membership. This lot does not change responsive card geometry,
Navigation, the Grouping rail or compact action placement.

## Validation protocol

`tools/playwright/grouping-summary-more-actions.spec.js` is a
`local-supervised` candidate. It uses temporary in-memory capacity probes for
all four Group renderings; it does not change course data or create a Moodle
fixture. Each probe fixes its flex basis and width so the test exercises a
measured capacity boundary rather than an expandable header. The probes stay
fixed below the Moodle top bar so opening their menu cannot trigger the
product's intentional desktop scroll-to-close behavior or have its trigger
covered by that bar. The menu's initial focus also
uses `preventScroll`, preserving user-scroll closure while avoiding a
focus-induced close. A future leased run must verify the recovered menu action
at desktop width, its accessible name, the opened details disclosure and focus
restoration to More actions. It
also verifies that Participant and Grouping More menus do not receive this
Group-only recovery action.

The shared scenario registry is Platform-owned and frozen for this source
batch; submit this document and the scenario path to Platform for registry
registration after the generated AMD build is available.
