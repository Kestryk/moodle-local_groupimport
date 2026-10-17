# Guide mirror resync ? 2026-10-17

Base EasyStud 4110785e; canonical base 6804e7f. Reverse-report only d44585d8
(C-G6/J-G1) into the embedded and canonical Guide JS/templates, and the canonical
Guide discovery SCSS. Runtime source, built assets and translated adapters remain unchanged.

The new public ES export `guideModality()` returns `{touch, narrow, pointer}`.
`narrow` is max-width 64rem; `touch` also includes coarse/no-hover pointers.
The synchronizer now exports the same function from Moodle AMD. The roundtrip
oracle verifies six callable exports, four modality combinations and no-matchMedia
fallback, exact JS/templates and all three shared SCSS files.

PASS: T037, T038, adapter roundtrip with the canonical checkout argument.
No test design expectation was relaxed. No build, browser, runtime or publication.
No new style recipe: this is source parity with the accepted d44585d8 behavior.
