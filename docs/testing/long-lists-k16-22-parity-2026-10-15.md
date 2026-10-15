# K16-01 / K16-22 - served parity

Only 56ba011f was integrated from the long-lists branch, via resolved 0379cf41. The two additional candidates were copied after exact SHA-256 verification; the original proofs remain unchanged. Integration fedda1eb and follow-ups 15f9719a / f66a1bea preserve the current K16-22 partial classes.

## One renderer

`long_lists.syncTagWindow` now returns payload/window policy only. It performs no token rendering, styling or overflow measurement. `normaliseTagValue` is shared by payload and legacy rows. `cards.syncParticipantTagOverflow` supplies the sole materialisation/sanitising/title/toggle/measurement path, excludes disclosure buttons and sentinel values, preserves the first real token, uses the localised collapse label and calculates +N against the full normalised total. The incoming compact clipping override was removed; both paths use the existing Kit 22px recipes.

## Evidence

- Shared actual-consumer harness: 20 payload/legacy equivalence cases PASS, including empty values and three sentinel forms. Earlier missing-scope harness retained without weakening its oracle.
- Native run `easystud-authenticated-20261015T195132397Z-42928`: PASS, 32 states (FR/EN x 1600/1280/768/390 x two actual density states x collapsed/expanded), 96 card samples, 1042 painted pills, 914 real pills, 76 exact +N counters. Every pill is 22px; maximum glyph centre delta x/y = 0/0px. No empty, sentinel or truncated pills. Minimum checkbox/name gap 12.796875px; maximum checkbox vertical delta 0px.
- Disposable fixture: dense participant has 37 groups, eleven groupings, three roles and three cohorts; ordinary participant also measured. Rendered dense totals 3/37/11 verified. Eight real group-detail requests held while the visible dialog was busy, released, then checked ready with Member59, open Members section and focus return.
- Native run `easystud-authenticated-20261015T195622852Z-20632`: PASS, dense participant View all FR1600/EN390; real get_details held/released, then all 37 group pills revealed (22px, no clipping), Close returns focus to the original disclosure.
- Both fixtures cleaned completely; pre-existing relationship fingerprints and the original showcompleteview setting restored. No business writes or page errors in the matrix.
- Kevin's unmodified `audit-preview.cjs` executed on course5: 18 FAIL, all group-card alignment checks; zero other FAIL. These are the explicitly deferred group-card lot, not acceptance for that lot.
- SM/CM builds and conservative CSS PASS; list policy 56 cases including an off-window query PASS. No Kit source change required.

Failed native runs remain immutable: initial lazy-parent selector, then default-5s deferred-response assertion. Strict successors preserve the complete measurement criteria and use actual readiness. Reviewed audit captures FR1600 full-info and FR390 participants are pinned until 2026-11-14; retention was inspected dry-run only.

Visual inventory for Claude: participant metadata/overflow recipe, Student Management participant cards, collapsed/expanded and compact/full-info, 1600/1280/768/390; deferred group and participant sheets, FR/EN. No Penpot write. Human approval remains open.
