# T053 — measured CSS reduction plan (13 October 2026)

Analysis only. Implementation belongs to Codex1 / canonical Kit owner.
No SCSS, styles.css, JS, template or version.php change in this lot.

## Baseline

- `styles.css`:1,362,946 bytes; gzip128,080 (Node zlib default, not HTTP transfer).
- SHA256 `a4ed55bc26eb1a87f2ef88c393ee225721e80563203fc4a816e8a4b5a6d3121d`.
- Source and :8051 CSS hash identical.3979 declaration blocks parsed, including
  keyframe/font blocks; nested media/support context preserved.
- CSS-only compression using Sass1.79.1, external output, changes no SCSS/source:
  1,223,558 bytes / gzip121,342. Gain139,388 bytes raw (10.23%), gzip6,738 (5.26%).
- Three exact duplicate selector/declaration/context groups, maximum1,426
  source bytes removable; actual cascade ordering must be checked first.
-96 repeated declaration groups (>2 repetitions, >60chars).
- Four largest repeated-block candidates:20,916 /10,320 /7,884 /6,272 bytes,
  total45,392 upper bound. Top20:98,596 upper bound. Not additive with minification
  or exact-duplicate savings; merged selector/list overhead reduces the gain.
- Longest selector lists:4269bytes/45 branches,2756/24,2190/32. This measures
  encoded weight, NOT browser selector-matching CPU or exact specificity.
- Guide559,781 / Student420,298 / common195,525 / import124,010 / navigation53,010
  bytes, heuristic selector buckets only; remaining bytes are context/formatting.

## Ordered proposal (not permission to delete)

| Priority | Action | Quantified gain / gate |
| --- | --- | --- |
|1| Serve/build compressed CSS only after semantic equivalence and Moodle cache-bundle check | measured139,388raw /6,738gzip; source measurement, not transfer promise |
|2| Audit three exact repeats (Group title, Grouping title, Admin loading surface) | upper bound1,426raw (<0.11%); preserve cascade |
|3| Factor common focus/icon/Guide button declarations through Kit classes or shared selector groups | four largest ≤45,392raw; top20 ≤98,596 (7.23%); prove order/specificity/state identity |
|4| Inspect88 rules without literal class references |18,527raw upper bound only; dynamic/core/upstream consumers may use them;0 proven dead |
|5| If still needed, split Guide and route-specific CSS delivery | Guide≈559,781raw, no transfer saving quantified; shared Guide/motion/modal ownership prerequisite |

Do not drop canonical Kit families simply because one consumer did not render
them. Do not collapse selector scopes or :focus-visible/disabled/media states
to obtain a byte target. Preserve normal/reduced motion and custom palettes.
Recommended first bounded code lot is compression/equivalence, not risky purge.

## Native coverage limitation

Two :8051 Chromium CSSCoverage attempts retained: readiness stays `loading`
at60s, no UI state coverage certified. First starts after a second GET; successor
starts on initial entry. No routing/expiry deadline or product corrected.
The association with instrumentation is NOT established causally; code/source
hashes and failures are retained. CSS source analysis is N0; browser attempts N1.
No unused-byte percentage or "dead rule" claim is fabricated from these failures.
Revisit conditional coverage after the separately-owned SM-RENDU3b milestone.

Raw JSON: external `easystud-roadmap-codex2-20261013/T053-static.json`,
`T053-minified.json`, and the two `T053` / `T053-entry` authenticated runs.
