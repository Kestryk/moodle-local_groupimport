# K21-32 — Participants, horizontal scrolling on Moodle 5.3

Native reproduction on the assigned `:8053` runtime: Participants focus view,
1280px, both Moodle drawers open, Full information, first card unfolded.
The list has `clientWidth=241`, `scrollWidth=276`, and accepts `scrollLeft=35`.
The metadata main is only 44px wide, but its rows retain the Kit's fixed
84px label track plus an 8.8px gap; values collapse to 0px and spill outside.
Ordinary full-view tests and document-level overflow checks do not reproduce it.

The existing PHP branch-503 guard remains unchanged. Within that guard,
the participant main becomes a named inline-size container. At 12rem or less
of actual main content, the consumer uses the existing stacked metadata
recipe with its new optional wrapping-label variant. No clipping or changes
to vertical overflow are introduced. Wide content keeps the original recipe.

Canonical Kit dependency: `4c7595d38d58321cf0c7a53848d7c3630922d61c`,
branch `work/codex2/easyedu-k21-32-20261021`. The embedded metadata module
matches it exactly. Its default output remains identical; the consumer pin
retains the original extraction provenance and records the new module blob.
The metadata contract now distinguishes text `overflow-wrap` from clipping
`overflow` properties and compiles both default and opt-in APIs.

Native verification: **40/40 PASS**, FR/EN × 1600/1280/390, full/compact cards,
folded/unfolded metadata and both desktop views. The narrow list is now
241/241px and `scrollLeft=0`; all final cases have zero horizontal overflow.
Every case verifies a real 50px movement of its vertical scrolling ancestor.
Page exceptions and console errors: 0. HTTP CSS SHA-256 matches the built file.
Temporarily removing the host guard in the test DOM restores 241/276px and
35px horizontal travel; restoring it gives 241/241px and zero travel.

Conservative Sass 1.79.1 build: only 8 added lines in Student Management CSS.
Removing that bounded, guarded addition yields the entire previous stylesheet
byte-for-byte. Global, Guide, Administration and Mass Import CSS are unchanged.
No 4.5/5.1 runtime deployment or PHP/AMD change was made.

Checks: security escaping, filter engine, canonical metadata contract, default
Sass output parity, Kit/consumer parity and `git diff --check` PASS.
The general workspace-controls pin test still fails on `_tokens.scss`;
the identical failure was reproduced on clean parent `9b10602b`, before this lot.
It is not repaired or suppressed here.

The extreme two-drawer 1280px layout also has pre-existing crowded pagination
controls and heavily ellipsized identity fields. They appear in the before
capture and are outside this horizontal-scroll correction.

Evidence directory:
`C:/dev/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/K21-32-CODEX2-20261021/`.
Use `bench.json`, `after-matrix-complete.json`, `checks.log`,
`metadata-contract.log`, `cleanup.json`, `overflow-before-1280.png` and
`final-fr-1280.png`. Preserve earlier failed harness attempts separately:
they concern missing/covered controls, the root scrollport or a label extending
into its reserved row gap; they are not final product failures.

Fixture cleanup: course 10 removed; zero groups, active users, enrolments or
role assignments remain. Fixture credentials were deleted. Only the assigned
runtime received the scoped CSS/SCSS files; no publication to `:80` or push.
