# EED-UI-2026-0072 - Nested card search focus

## Failure

Typing in the Participant search inside a Group card or the Group search
inside a Grouping card filtered the expected results, but focus left the field
after each character. The shared responsive refresh also ran pagination.
Pagination sorts by reinserting every top-level card into its list, including
the card that owns the active nested search field. Moving that focused ancestor
in the DOM discards the browser focus and caret.

## Repair contract

- Nested `input` events continue to update matching rows, visible-result
  counts, disclosure geometry and filtered empty states immediately.
- The responsive refresh skips only pagination for that input event, so the
  active Group or Grouping card is not reinserted while the user types.
- Consecutive characters, Backspace, Paste and the native search clear action
  retain the same input node and caret.
- Initialisation, Cancel and structural mutations keep the normal pagination
  refresh. Search semantics, membership data, sort choice and persisted state
  are unchanged.

This is a consumer-local lifecycle correction. It introduces no reusable
component, visual token or UI Kit change, so the embedded component contracts
remain unchanged.

## RF1 - Mouse text selection inside nested Group cards

Human Wave 8 review accepted continuous typing, Backspace, Paste, clear,
focus/caret retention and live result updates. It also found that a search field
inside a Group already placed in a Grouping could not select its typed text by
double-click or mouse drag, although the same gestures worked in the Grouping
search and in Groups without a Grouping.

The nested Group card remains a draggable object. Responsive refresh was
restoring `draggable="true"` even while a descendant input held focus, allowing
the card drag contract to compete with native text selection. RF1 keeps a card
non-draggable while any interactive descendant is focused or receives the
initial pointer/touch gesture, then restores normal card drag availability
after focus leaves. Dragging from the non-interactive card surface, responsive
drag suppression, search filtering and membership behavior are unchanged.

## Validation

Run from the plugin root:

```powershell
.\tools\release\test-nested-search-focus-contract.ps1
.\tools\release\test-amd-runtime-format-contract.ps1
```

The focused static contract locks the input-event pagination bypass and the
interactive-control drag guard as well as the canonical generated AMD format.
JavaScript syntax, the standard release
validation and `git diff --check` remain required source gates. Runtime,
cache, fixtures, preview and browser review are owned by the separate managed
preview lane.
