# A10 compatibility candidate — NOT FOR INTEGRATION BEFORE PHASE 8

Base108f0b2c. Branch work/codex1/easystud-a10-compat45-20261017 only. No runtime installation or deployment.

- IReadFilter accepts untyped arguments to implement Moodle4.5's older native interface. It forwards immediately to the same typed scalar boundary in a private method; the previous filter body and limits are unchanged. This keeps ordinary weak PHP scalar validation, bounds, overflow signalling and TypeErrors on5.1 while allowing the4.5 class to be declared.
- Four hidden filter-count text spans carry both sr-only and visually-hidden, reusing core Bootstrap utilities for4.5 and5.1; no duplicated CSS or new5.x-only dependency. No other markup changes.
- version.php is byte-identical to108f0b2c: minimum still2025100600. Proposed only after phase8 installation/upgrade validation: requires2024100700 (Moodle4.5); supported[405,501] only after those versions are certified. Do not claim5.3 or change plugin version monotonicity without its own validation.

Proof: test-a10-compat45.cjs uses the actual4.5/5.1 native IReadFilter and Coordinate sources without Moodle bootstrap. Eight cases per library (bounds, first/last columns, coercion, TypeErrors), comparison with the old5.1 filter, and reproduction of the old4.5 incompatible-signature fatal: PASS. Reads both core Bootstrap source recipes; compiles them in isolation and measures the two-class span:1×1px/absolute; same5.1 computed properties as before. No external requests.

Required existing tests PASS: escaping, filter engine, five CRLF controller tests, T03714/T03847, isolated release smoke (including actual formatted-XLSX inputs). PHP lint PASS. Evidence: C:/dev/artifacts/a10-compat45-implementation-20261017/.

Not certified: clean4.5 installation,4.5 upgrade fromV1, native course actions/theme/browser assistive-technology acceptance,5.3. Read-only API inventory remains in A10-COMPAT-45-ANALYSE-2026-10-17.md. core/modal_factory has no current product caller, so no replacement is introduced. Message dialog existing4.5 fallbacks remain unchanged. This branch must stay separate until phase8.
