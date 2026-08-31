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

## Validation

Run from the plugin root:

```powershell
.\tools\release\test-nested-search-focus-contract.ps1
.\tools\release\test-amd-runtime-format-contract.ps1
```

The focused static contract locks the input-event pagination bypass and the
canonical generated AMD format. JavaScript syntax, the standard release
validation and `git diff --check` remain required source gates. Runtime,
cache, fixtures, preview and browser review are owned by the separate managed
preview lane.
