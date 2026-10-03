# Shared modal Close — native and Penpot parity

## Outcome

Participant, Group and Grouping modal headers now consume the shared Kit
`close-button` recipe. The recipe is aligned with the existing linked
Foundation `Core action / Secondary / S` component: a compact `1.9rem`
(`30.4px`) square with centred glyph, neutral rest paint and semantic danger
hover/focus paint.

EasyStud no longer owns a second modal-close skin in `_tutorial.scss`.
Accessible labels and dismissal routing remain product-owned. The Group and
Grouping paths now restore focus to their real surviving opener after the
existing exit Motion completes, matching the Participant path.

## Evidence boundaries

The supervised Moodle 5.1 run
`easystud-authenticated-20261003T191545465Z-776` selected exactly one scenario
and passed nine cases: Participant, Group and Grouping at 1600, 768 and 390 px.
It measured a 30.4 px square, zero glyph-centre delta, the exact Kit danger
hover tokens, containment and desktop real-opener focus return. It did not
submit Save, upload, export or any business POST. Credential, lease and child
cleanup completed.

Three inspected captures are pinned until 2026-11-02. The immediately
preceding run is retained as runtime diagnosis: Moodle failed to write one
Boost Mustache cache file after cache purge. It was not a Close assertion or
product failure; the unchanged product candidate passed after the cache was
warmed.

Penpot page `04 — Dialogues et modales` already linked all three entity-header
Close controls to the same Foundation Secondary S provider. No product-local
component or new variant was added. This structural readback is not human
visual acceptance; the global EasyStud checklist remains open.

Machine-readable evidence:

- `docs/testing/student-modal-close-preview-2026-10-03.json`
- `docs/testing/student-modal-close-penpot-2026-10-03.json`

## Validation

- Kit close-button compile contract: passed.
- Kit public button focus contract: passed.
- Embedded Kit source/docs hash parity: passed for Buttons and Modal docs.
- EasyStud entity-modal rehydration contract: passed.
- EasyStud group-member focus containment contract: passed.
- Exact authenticated Moodle 5.1 browser run: passed.
- Human visual acceptance: pending.
