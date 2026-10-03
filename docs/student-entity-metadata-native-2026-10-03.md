# Native entity metadata catalogue — continuation

Owner proposal under EED-UI-2026-0073; source-preserving extraction is recorded
in `student-entity-metadata-extraction-2026-10-03.md`. This increment inventories
actual lists/counts/chips before catalogue publication; no new private paint,
business controller or Motion changes.

`tools/playwright/student-entity-metadata-preview.spec.js` has one
local-supervised test with nine native/resized cases at 1600/768/390.
Use the saved-credential wrapper and exact test title
"Entity metadata preserves native count list and chip geometry".
It uses existing entities, opens every existing list normally, audits native
visible entries/empty state and hidden CSV table, observes normal-motion
`is-easyedu-disclosing`, and closes without Save/export/upload. Every plugin
POST is blocked. Group/Grouping use native desktop open then resize, not an
invented mobile settings entry.

Planned shared publication: detail semantic count capsules (Roles/Groups/
Groupings), neutral detail count, settings count, metadata chips and source-backed
list shells. Existing card count/metadata tokens have different API densities
and palettes; they are not silently rewritten to pretend they match native
modal metadata. Reuse source recipes and linked glyphs, with paired Standard/
Library hosts, then update consuming product modals. Do not create a second
source family or weaken the original hidden CSV/data predicates.

The extraction deliberately retains legacy 650/720/760 weights. Penpot only
accepts standard font weights, so its catalogue maps source 650 to 600 while
the canonical SCSS and native browser rendering stay unchanged.

## Verified native result

Run `easystud-authenticated-20261003T173718909Z-36552` passes the exact single
test and all nine Participant/Group/Grouping cases at 1600/768/390. Participant
lists contain 1 Role, 6 Groups and 4 Groupings; Group contains 1 Member and the
native zero-Grouping empty state; Grouping contains 1 Group. Counts, chips,
clipped list content, hidden CSV tables and normal disclosure timing pass.
There was no plugin business POST, fixture, Save, export, upload or transfer.
Credential, child and lease cleanup are complete. The nine captures are pinned
in the external artifact manifest through 2026-11-02. Concise proof:
`testing/student-entity-metadata-preview-2026-10-03.json`.

## Shared and product publication

Foundation Library host `37222e98-689a-801a-8008-bbfd3b2f8022` owns nine
canonical components across Count, Chip and Disclosure paths. Standard host
`79c98099-5199-8000-8008-bbff04d6f95e` contains ordinary linked instances,
not competing masters. Detail counts keep their measured 22.33px density;
Settings keeps 25.82px. The existing canonical Chevron is reused.

EasyStud page 04 board `e38279dc-cd7d-80fa-8008-bc000f020794` composes
Participant, Group and Grouping metadata with the connected Foundations
components. Its four cards have no child overflow after the containment pass;
the product file still has zero local component masters. Exact IDs and geometry:
`testing/student-entity-metadata-penpot-2026-10-03.json`.

This is not a global typography normalization or human acceptance. The global
human checklist remains open. A post-correction Penpot export timed out, so the
fresh settled geometry readback is recorded separately from the earlier visual
inspection; it is not presented as a completed human visual gate.
