# Guided-path prerequisites in delivered assets

The initial course model must publish its prerequisite facts before the workspace
signals readiness. The source entry already did this, but its delivered AMD build
omitted the `guide_hooks` dependency and call. Rebuilding the entry restores the
existing contract, including an empty course and a portalled responsive Guide.
The refresh path already published updated facts and remains unchanged.

The successor based on `4c910dd8` retains the integrated rebuild, which already
contains that call. It carries only the regression gate and its smoke registration,
this note, and the whitespace-only correction to the prerequisite label call.
Do not replay the older rebuilt entry over this newer integration.

Run `node tools/release/test-guide-path-facts-delivery.cjs`. It executes the actual
built entry, facade and hooks, verifies initial publication, and checks subsequent
model changes. It fails against the previous delivered entry. The isolated release
smoke now includes this gate. No participant cache, Guide engine, Motion or
navigation behaviour is changed.

The current 4.5 rail passed 32 hover/focus probes in both languages at 1280, 1180
and 1100 pixels, including intermediate animation frames. The earlier rail overlap
was not reproduced with the currently served assets; this lot does not change its
layout or infer a missing browser API. Cross-version native evidence and runtime
availability and the subsequent cross-version rerun are recorded in the review report.

The successor's native rerun on 4.5 and 5.1 verifies 112 path-card outcomes
across empty/populated courses, both languages and desktop/mobile widths. Sixty
rail hover/focus probes have no overlap. A transient 4.5 navigation failure is
retained separately and its exact case passes on replay. Missing local theme
images on 4.5 and the three pre-existing isolated-smoke failures remain reported;
these results do not certify a completely clean environment or full release gate.
