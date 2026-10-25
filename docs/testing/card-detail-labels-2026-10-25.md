# Localized card detail actions

Card commands name the entity they open. Existing `groupdetails` and
`groupingdetails` language strings are shared by the direct cog buttons,
context-menu entries and modal headings. `viewparticipantdetails` labels both
the participant eye button (ARIA/help) and its context-menu entry.

| Context | EN | FR |
| --- | --- | --- |
| Group | Group details | Détails du groupe |
| Grouping | Grouping details | Détails du groupement |
| Participant | Participant details | Détails du participant |

The original action IDs and handlers remain stable. No new language key or
component is introduced. The legacy `advancedsettings` string stays available
for compatibility but no card button/menu consumes it. Guide anatomy captions,
participant illustrations and editor instructions use the current action names.

Run `node tools/release/test-card-detail-labels.cjs <php-executable>` to execute
the actual PHP menu builder with both language files and exercise the shared
button ARIA/help path. The focused `card-detail-labels-served-native.spec.js` scenario
covers EN/FR at 1600/390, three entity families, menu labels, direct labels,
modal headings and painted-text containment.

The local 8054 attempt was blocked by an HTTP 500 database-connection failure.
No runtime source or course data was modified. The served-source scenario is
ready to replay after the test environment is available; responsive clipping
has not been certified for this delivery.

Historical snapshot tests tied to retired monolithic controllers retain their
original provenance; the current-label successor above checks current modules.