# A-TEXTES — integration candidate, 13 October 2026

Owner: Codex n°1. Sources: PLAN-LOTS-AUDITS-2026-10-13.md (series A),
AUDIT-SLIDES-GUIDE-2026-10-13.md (GUIDE-TEXTES),
AUDIT-PARCOURS-CHECKLISTS-2026-10-13.md (button names, C2–C4 and path 11 copy).

## Implemented presentation

- FR/EN creation explanation says above and names the native inputs. The
  example grouping matches the Tutorials / Travaux dirigés explanation.
- FR inspection uses the translated entree-inconnue in both its label and
  textarea. Inspection captions share the safe-practice wording.
- The creation note precedes its path invitation; the unrelated Mass Import
  note is absent from the actions scene. All seven modern invitations use the
  accompanied-path eyebrow and one trailing arrow. Path 10's title loses its
  duplicate guided-path prefix.
- Checklist title punctuation is localized (French NBSP before the colon).
  Its progress counts completed steps independently of visited slides. The
  French hint uses ce parcours. Existing Agrandir copy is retained.
- Paths name the native +, Advanced settings, Participants & groups and
  Move members controls. Path 11 step 4 describes its optional checkbox and
  the singular/plural confirmation button. The already-served step 5 and path
  10 drag-start copy from 27fd0b8a are retained.

## Open prerequisite

Path 11 step 1 still says create or open. Its production validation currently
requires opening a grouping; changing only the copy would promise behaviour
that is not installed. Claude must make an existing destination count before
Codex changes this instruction to find or create, without unfolding it.
This remaining item keeps A-TEXTES partially open.

## Validation and publication

Kit 0.4.207 (a48e4ba) introduces optional guidedPathSeparator and completedSteps labels,
shared invitation markup and note order. The Source includes the localized
adapter and named Motion-dependent AMD build. No membership, dialog, path
progression, animation or POST/sesskey implementation is changed by A-TEXTES.

The full Guide sync surfaced pre-existing differences: Source's runtime
template already includes N2 T037/T038 additions absent from this Kit template,
and the Kit has dialog recipes not yet copied to Source. Those additions were
preserved; unrelated dialog SCSS copies were discarded. Only this lot's runtime
markup delta is applied. Whole-package synchronization is not claimed.
Use build-guide-amd.cjs; the older zero-dependency build script rejects the
current Motion-dependent wrapper.

Pure FR/EN production curriculum fixtures and PHP syntax are checked before
publication. The native recipe is series-a-textes-r10-23-native.spec.js:
FR 1280, Current and On demand, seven real invitation cards, inspection textarea,
creation-note order, checklist title/progress, actual mouse drags for groups and
participants, earlier scrolling, pointer-following ghost and stop after Escape.
Course membership writes are blocked and must remain absent. Artifacts live
outside Git. Native outcome and served hashes are recorded after publication.

Penpot and human acceptance remain open. No Penpot file is changed by this lot.
