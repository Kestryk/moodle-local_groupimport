# Five historical tests — 17 October 2026

Base: 8129aef7. Tests only; no production source, generated asset or runtime changed.

All five input readers already normalized CRLF. The failures came from assertions against the former monolithic controller and whole-file snapshots predating intentional changes. Normalization remains on every production input; reads were additionally forced to LF and CRLF using an external preload (10 successful runs).

| Test | Current authority and assertions |
| --- | --- |
| folded-group-member-selection | group_card_controls + selection/shared: 18 scoped clearing/idempotence cases; actual common setGroupMembersExpanded function and click binding, three opening/folding/reopening directions, Motion and ARIA preserved. |
| guide-move-context | guide + move_modal: six real target-opener cases, foreign Guide rejection, participant-only context, PHP typed targets and completed-exit cleanup. |
| mobile-move-availability-source | navigation: 24 responsive view/desktop preference/hidden-action combinations; Move available, panels and selection refresh correct. |
| mobile-participant-memberships | workspace: 32 density states, no redundant remeasure/reanimation, desktop preference, generated modular AMD entrypoint. Profile now follows memberships (intentional current contract); roles stay visible. |
| guide-source-member-path | guide_hooks: real ordered completion guard, four native milestones, FR/EN production curriculum, all 13 current slide IDs. Retired numeric tutorial paths are no longer required. |

Replaced obsolete assertions: exact equality to old entire controller/PHP/CSS/language files; old three-dependency AMD factory; historical Penpot snapshot as current acceptance; twelve slides; retired legacy paths. These are release-specific historical proofs, not valid invariants after modularization, retirement and later deliveries. Behavioral assertions now execute the current functions, including negative guards. No assertion was bypassed with a catch or unconditional success.

Evidence: C:/dev/artifacts/tests-crlf-20261017/results.txt and eol-preload.cjs. Standalone VM/PHP checks only; no native Moodle/browser acceptance claimed.
