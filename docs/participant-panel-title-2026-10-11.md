# R10-21 — Participants & groups panel title

User explicitly requests the main Participant workspace block to use the same
Participants & groups name as the view switcher, parallel to Groups & groupings.
The server view-model now supplies its existing localized layoutmodeparticipants
string to participantstitle, used by the existing h3 and column-heading slots.
No new string family, type size, colour, alignment or stylesheet is introduced.

Native compact view navigation deliberately remains Participants, Groups and
Groupings: this lot changes the block heading, not navigation semantics. Count,
filters, course command targets, membership density, Guide, Motion and payloads
are unchanged. English Participants & groups / French Participants & groupes
already exist and match the selector labels.

Static successor reconstructs exactly the one view-model field against the
previous source, lints PHP and validates both translated label mappings. Native
desktop/phone heading/compact-nav paint requires ordered preview. Product Penpot
correlated heading copy must be reconciled when the EasyStud project is on the
owned design channel; no Foundation typography change is applicable. Pending
copy propagation is explicitly not a whole-board or human acceptance claim.

Product page03 now retains the existing four desktop/tablet/phone title shapes,
their lanes, Inter font, original weights/sizes/colours, and existing navigation
copy. API characters initially changed while cached SVG text stayed Participants.
Re-measuring auto-width then restoring fixed growType and exact original lanes
resolved stale text bounds (209.75px at20 / 220.2375px at21). Native sidebar size
reapplication alone had not refreshed paint. Saved Transit and actual SVG text
are checked separately; no Foundation typography family change is applicable.

The local-supervised participant-panel-title-native scenario checks actual EN/FR
heading paint at390/768/1280 with native loading and unchanged compact navigation.
It blocks course/settings commands and does not fabricate data or progression.

Saved GET/decoded Transit confirms all four exact title IDs, full copy, fixed
growType and original rectangle/font. The first visible SVG reads the full
209.75px label. Offscreen shapes are culled by the editor; each remaining title
is framed individually before checking its SVG text rather than pretending
absent DOM or old cached bounds are paint proof. Whole-board review stays open.

All four SVG copies now read Participants & groups. The existing documentation
contract already covers stale API characters versus painted text; this copy-only
lot introduces no new AI rule or reusable Kit styling. Earlier failed paint
probes are preserved externally and no source snapshot/test oracle is weakened.

All older lots and human checklist remain retained. This copy adapter does not
rename the Moodle component, participant data or other references to Participants.
