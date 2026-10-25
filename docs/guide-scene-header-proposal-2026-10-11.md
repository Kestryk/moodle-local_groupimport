# T007 — demonstration header proposal

Program: EED-UI-2026-0073. Date: 2026-10-11. Status: design proposal saved;
Kevin review remains required before implementation, as requested in T007.
This record supplements the immutable Claude plan and the selector preflight.
It does not close T008–T012 or the combined human checklist.

## Review location and composition

Penpot file `b564c72c-f31f-81ec-8008-ad9958b272bd`, page
`b564c72c-f31f-81ec-8008-ad9958b272be` (`Guide easystud`). New ordinary boards
are to the right of the existing work, beginning at x4800. No new Library
master or Foundation family was published.

| Board | Width | Root |
| --- | ---: | --- |
| 86 / Organisation / Desktop / Before demonstration | 1220 | 8601d28d-87e6-80cf-8008-c66b6ec35d87 |
| 86 / Organisation / Tablet / Before demonstration | 768 | 8601d28d-87e6-80cf-8008-c66c28f57c50 |
| 86 / Organisation / Phone / Before demonstration | 390 | 8601d28d-87e6-80cf-8008-c66c31c24085 |

Below these are five header states per width: ready Add, ready Move, playing,
paused and finished. The shared header contains mode choice, manual Start,
current status/instruction and existing Pause/Resume/Next controls. At rest it
explains the resulting memberships; playback controls appear only during play
or pause. Mode selection remains locked while playing/paused. Mobile stacks
Start beneath the two mode buttons; tablet/phone instructions use card actions,
while desktop describes dragging. These are static state specimens, not a new
animation or interaction implementation.

The heading uses the current linked Introduction source's Inter16/600/#0b5ea8
role. Buttons use existing Small30.4px providers; caption/instruction/completion
paint comes from the existing Introduction/Reading sources. Dots retain4px
diameter and3px gap. Existing source/destination cards are cloned without paint,
typography or geometry redesign. The original Organisation board, dedicated
Show-in-interface row, historical slide IDs, native paths and Motion remain.

Expected membership differences are expressed in text in this proposal.
T010's richer membership previews, full-slide recap/path order and bilingual
runtime behavior remain their own implementation work after review.

## Verification and limits

External run: `scene-header-proposal-20261011-a` below the local EasyEdu
artifact root for `easystud`; generated media stays outside Git.

- `final-proposal-verification.json`:18 active headers,3 context boards,
  no painted-text overflow or button-label/glyph centering issue (1px tolerance).
- `final-preservation.json`: all48 original root geometries and the complete
  accepted Organisation fingerprint remain unchanged;954 Foundation provider
  IDs remain unchanged. One first isolated specimen is hidden recoverably.
- `card-copy-diagnostic.json`: six source-preserving card copies. The first
  strict equality check reported floating-point differences in sizes; the
  successor compares all paint/text fields exactly and geometry at1e-8px.
  Maximum difference is4.547473508864641e-13px; no design correction was needed.
- `saved-proposal-readback.json`: normal authenticated Penpot get-file confirms
  all306 created IDs,19 saved headers including the archived specimen and48
  original roots. This is saved-presence evidence; painted geometry was checked
  separately in the live editor and paired exported rasters.
- Final desktop/tablet/phone context rasters plus phone playing/paused/finished
  states are retained. A tablet matrix write timed out but exact readback found
  all five completed states; it was not replayed. Initial connection/export
  failures are retained alongside the successful successors.

No plugin/Kit source, generated CSS/AMD, runtime, cache or course data changed.
No native Moodle test was needed for this design-only proposal. Human visual
acceptance and future responsive/localized native proof remain open.

## Integration boundary and recovery

After Kevin reviews this concrete proposal, use the original canonical scene
commands/live-region/playback contracts from the preflight. Keep manual Start,
remaining-time Pause, single-phase Next and exact mode selection semantics.
Do not replace the Guide engine or move the dedicated interface cue.

The existing shared primitives are sufficient for this proposal; no Kit version
or shared component contract changes yet. If accepted, document its composition
recipe and appropriate Foundation specimen before activating the consumer.
Archive only the owned proposal roots if it is rejected; no original board was
overwritten. Platform's separately owned roadmap files remain untouched; this
consumer's additive intake record is the current bounded progress projection.
