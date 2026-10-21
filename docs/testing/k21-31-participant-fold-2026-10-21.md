# K21-31 — Participant fold footer containment

**Superseded 21/10/2026 by K21-37**: the participant card's fold chevron (K21-16),
whose footer this lot fixed the overflow of, was removed entirely. Selecting a
card now expands it and deselecting it collapses it again, with no dedicated
fold control; `person-card-fold-content` and its `&-user` call site became
dead code (the selector they contained can no longer match) and were removed.
This report is kept for history.

Base: `168dbba0`, including K21-16 (`49fd12f4`, `ccfae488`).
Allocated native test copy: `http://localhost:8054`, course 71.

## Cause

K21-16 appended the shared Kit fold-chevron footer after the participant's
metadata, but compact person cards retained their historical `max-height: 3.3rem`.
The footer stayed in normal flow: its content exceeded that cap and painted
19.09375 px below the desktop card, into the gap before the next card.
It was neither an absolute-positioning error nor a duplicated button.

The same native test found a second legacy compact rule: `display: none` kept
metadata hidden after the per-card click had set `aria-expanded="true"` and
removed `hidden`. The global compact-density rule still overruled that opening.

## Correction

The additive Kit `person-card-fold-content` recipe opts in only cards containing
`.easyedu-person-card__fold-toggle`. It removes the legacy height cap and restores
the normal grid for explicitly open metadata. Existing responsive composition
rules keep their flex layout. The template marks its existing fold button with
that class; the person-card host consumes the mixin.

The shared `card-fold-chevron` footer recipe, group/grouping templates, JavaScript,
Motion and global density commands are unchanged. The footer stays at the foot
of the card, as documented by the Kit; it is now inside its actual card bounds.

## Native evidence

| Case | Before overflow | After overflow | Collapsed height before → after |
| --- | ---: | ---: | ---: |
| EN / 1600 | 19.09375 px | 0 px | 52.796875 → 78.96875 px |
| FR / 1600 | 19.09375 px | 0 px | 52.796875 → 78.96875 px |
| EN / 390 tactile | 0 px | 0 px | 102.875 → 102.875 px |
| FR / 390 tactile | 0 px | 0 px | 102.875 → 102.875 px |

Four participant cards per case were measured. Every card has one toggle;
its icon centre differs from the button centre by 0 px. The first card in each
case completes the real click cycle: closed → open with visible metadata → closed.
All four cases have zero JavaScript page errors.

Group/grouping fold-control fingerprints (size, colour, border, padding, position
and margins) are identical before/after. The original global audit passes 88 checks
with zero failures in FR and EN, covering 1600/768/390. The EN audit changes only
the language query and browser locale; no assertion is relaxed.

## Static checks

- Pinned Node 22.11.0 / Sass 1.79.1 per-page CSS build: PASS. No AMD source changed.
- The full ordered CSS is byte-identical after removing the two announced new rules.
- Isolated compilation of the canonical Kit and consumer mixins is identical.
- Official `local_codechecker` other-file checks: 0 errors / 0 warnings.
- Security escaping, filter engine, build-version contracts: PASS.
- Kit single-source report: 29 existing candidates, 0 read errors.

Reproduction, JSON measurements, before/after captures, immutable first-candidate
failure and audits are in `C:/dev/artifacts/k21-31-native-20261021/`.
Detailed delivery report: `RAPPORT-K21-31-NATIF-20261021.md` in the review folder.
