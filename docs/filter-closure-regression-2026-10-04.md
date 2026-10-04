# More filters delivered-module regression

## Cause and scope

The source exports `closeChoicesWithin`; the custom AMD builder returned only
`enhanceSelect` and `enhanceMultipleSelect`. Minification removed the unused
closure helper. The course manager updates the button's ARIA state, then calls
the missing helper before changing panel accessibility or starting collapse.
Thus a collapsed button could accompany a still-expanded, interactive panel.

The repair derives the AMD return surface from the public `export const`
declarations. No course-manager event timing, selection, CSS or Motion changes.
The new Node gate evaluates the actual built module, compares its callable
exports and invokes the empty-container closure path.

## Evidence

- Native baseline `easystud-authenticated-20261004T095920415Z-20524`: FAIL,
  parent inert false after the button became collapsed.
- Diagnostic `easystud-authenticated-20261004T100239079Z-34580`: FAIL even
  without a nested dropdown. Event trace proves no panel-state mutation on
  the second click; button ARIA changed while the panel stayed expanded.
- Built-module gate before rebuilding: FAIL, `closeChoicesWithin` missing.
- Same gate after rebuilding: PASS, all three public functions callable.
- Native successor and local preview promotion: pending.

Artifacts are under the external EasyEdu `artifacts/easystud/authenticated`
root in the named run folders. Both native checks are read-only UI operations;
no Send, Save, membership move, fixture or import was performed.

## Remaining user corrections

See R01–R09 in `student-management-completion-queue-2026-10-03.md`. Appearance
changes require live Penpot and preview, including the sticky inner button,
admin type/pickers/default reset, searches and Mass Import empty text.
The group-image board was exported and visibly overflows. Subsequent Penpot
reads and CDP reconnect timed out; activating its existing target succeeded
but did not restore its heartbeat. No Penpot write was attempted.
