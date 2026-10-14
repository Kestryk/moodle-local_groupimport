# Student Management component frame, 14 October 2026

Claude0df9010c removes the Student Management page skeleton and paints the real
server frame at bootstrap installation. Lists retain their component skeletons;
busy/inert and native ready remain the interaction gate. Mass Import/admin page
skeletons are separate and unchanged by this QA lot.

## Dedicated copy preparation

Base2f860875 contains our approved K21/Mass Import/K16 lots. An external source
stage applied only Claude's0df9010c product patch, the already published progress
bootstrape552cb05 and published A-CHECKLIST1fb3206a Guide src/AMD/map/SCSS. Nine
files were copied to8051 under runtime/cache leases with hashes, backups and a
successful purge. No reserved source was edited or other worktree switched.
Manifest: `C:/dev/artifacts/es-component-loading-deploy/manifest.json`.

CSS was generated with the required pinned compiler and conservative recipe:

```
node tools/release/build-styles.cjs "%LOCALAPPDATA%\EasyEdu\tooling\sass-1.79.1\node_modules\sass" styles.css conservative
```

Compared with the same base compiled by that command, the two updated SCSS
partials produce29 added/5 removed CSS lines; no @charset/BOM. CSS stays outside
this proof commit. The expanded CSS in6a905703 is not reused as a merge patch;
Codex1 integrates its approved SCSS and regenerates CSS. Compiler JSON and
before/after conservative CSS: `C:/dev/artifacts/es-component-loading-stage`.

## Targeted native proof on8051, one mode

| Spec | Run | Result | manager-frame | amd-timeout |
| --- | --- | --- | --- | --- |
| student-card-checkbox-owned-component-loading-successor | 20261014T162015371Z-34404 | PASS |31ms|8058ms|
| student-card-checkbox-late-component-loading-successor | 20261014T162409930Z-3972 | PASS |22ms|8036ms|
| student-component-frame-native | 20261014T162702242Z-27080 | PASS |47/54/23ms|state held, then released|

Runs have the `easystud-authenticated-` prefix. Owned/late retain the real AMD
route holds and every preceding fail-open, ARIA/inert, late-ready and Tab/Space
selection oracle at390/768/320. They require no page-skeleton element rather
than dereferencing its removed node, retain component nodes, and require a
native manager-frame diagnostic within250ms. Stalls now degrade8s after the
immediate frame; observed8.036/8.058s satisfies the expected approximate8.7s
contract (measured independently of the older late frame delay).

The held-state spec atFR1600/1280/390 (reduced motion390) proves no page skeleton,
painted component skeletons2/2/1, zero participant cards before state arrives,
correct responsive class, busy/inert until native ready, then real participant
cards. Component-frame timings are47/54/23ms. Every run has zero pageerrors and
zero attempted business writes. PNG/JSON/logs remain externally manifested in
`es-component-owned-loading`, `es-component-late-loading`, `es-component-frame`.

Historical page-skeleton specs remain immutable predecessors. Active SM loading
coverage now uses these successors, not navigation-skeleton/soft-page fixtures;
page-skeleton checks for Mass Import/admin must remain. Shared proof reports must
not infer ready from skeleton disappearance or require delayed manager-frame.
No UI source changed in this QA lot; human/Penpot and Moodle4.5 gates stay open.

AI contract impact: QA successors preserve the existing ready interaction gate;
no reusable component/API contract added. This document records the changed SM
test contract without changing the separately owned Kit or AGENTS.md.
