# Guide10: bounded first-paint timing instead of a fixed611ms verdict

Claude's night diagnosis supersedes the earlier product-failure interpretation:
changing step deliberately clears the cue, then autoHighlightNext/openDelay
and frames paint the next cue. The old fixed606/611ms samples are retained as
observations during that transition, not evidence of a product defect.

The immutable successor starts a browser animation-frame observation at the
actual selector click. It requires a painted cue, cardDelta<=2 on QA Guided
One and active try-context within1500ms. A hard deadline fails rather than
extending the allowance. The first satisfying frame's latency is recorded;
the original1s/5s dragend identity/bounds checks remain unchanged. No product
Motion/source is changed and no completion is seeded.

Native run `easystud-authenticated-20261014T212355012Z-55636`, disposable
course99, FR1280/on-demand-only, complete PASS on the existing pinned8051
3cbb03cf+K21 copy, before64a9af53. Trusted native drag lasts854.30ms.
Both dragend samples pass; after selection the first correct cue is painted
at689.60ms, with cardDelta0. Native right-click/context menu completes the
third step; all3 painted ticks and the complete visible end panel pass.
pageErrors=0, blockedWrites=0, no business write command exercised.

Spec: `tools/playwright/guide-native-first-paint-successor.spec.js`.
Report/frames/PNG/context:
`C:/dev/artifacts/es-guide10-first-paint-native/easystud/authenticated/easystud-authenticated-20261014T212355012Z-55636/playwright-output/guide-native-first-paint-s-d7bda-in1500ms-complete-checklist/`.
The complete screenshot is inspected. Native acceptance is scoped to this
desktop path; the requested7-path/compact64a9af53 replay is a separate lot.
Human/Penpot/Moodle4.5 and two-account storage isolation remain separate.

Cleanup verified 2026-10-15: wrapper credentials/child/lease/fixture cleanup PASS; fresh read-only DB check confirms course99 absent and both synthetic users deleted. Evidence: C:/dev/artifacts/es-guide10-first-paint-cleanup-db.json. Artifact retention dry-run reports no errors; no deletion requested. Publication prerequisite64a9af53 is still absent from the principal runtime HEAD963d7d0a at handoff.
