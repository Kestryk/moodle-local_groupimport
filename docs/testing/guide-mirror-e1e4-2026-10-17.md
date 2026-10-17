# Guide mirror E1–E4 — 2026-10-17

Consumer baseline: `abf3c636`; canonical Kit starting point: `67f4010`.
The accepted consumer Guide engine, discovery/inspection styles, specimen styles,
four specimen templates and anatomy template are mirrored without changing
consumer runtime sources, generated AMD, visible language strings or CSS assets.
The canonical and embedded example language files receive the anatomy strings.
Program/fixture data remains product-owned in `classes/local/guide_discovery.php`;
none is copied into the generic Guide package.

The public sync adapter and round-trip test cover seven templates, four SCSS
partials and six AMD exports. Mustache namespace replacement is limited to
`guide_*` partials; the translated checklist/launcher adaptations remain intact.
The exact old round-trip assertions remain; the new templates are added to them.
No assertion is removed or relaxed. T037:14, T038:47, round-trip:PASS.
Evidence: `C:/dev/artifacts/guide-mirror-e1e4-20261017/`.

The Kit forms mixin receives only the disabled segmented-choice state from E3
and `position: relative` in `toggle-check` from K16-45. Unrelated canonical focus
rules and CCB-specific components remain unchanged. Canonical `main` is untouched.

This is source parity, not a new native or visual acceptance. ANIM is a separate
consumer branch (`88d8e83d`) and must be integrated before its additive Guide
entry-point mirror; it is not silently mixed into this baseline.
