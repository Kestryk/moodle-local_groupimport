# T024 — paired Mass Import subsections (EED-UI-2026-0073)

N2 / M9–M10. Kit opt-ins align the two small-icon subsections on one text
rail, including identification copy, available-fields label and format caption.
Both surfaces use white, the existing deposit border #c8d6e3 and 16px padding.
Formats retain caption typography without an additional contour or background.
T025 vertical density and T026 grid proportions remain separate lots.

PHP changes add presentation classes only; POST/sesskey and native picker,
upload/remove, draft handling, maxfiles and Motion are preserved.
No new Moodle API, Bootstrap class or PHP feature is introduced (4.5 compatible).
Kit owns both recipes; consumer SCSS copies are byte-identical.

Validation: PHP lint; existing small-icon source contract; pinned Sass 1.79.1
build; targeted `mass-subsections-t024.spec.js` at 1600/1280/390 FR.
Native result and publication hashes are recorded in the intake/passation.
Penpot propagation is deferred to the visual milestone; human acceptance open.
No AGENTS change: existing alignment, canonical Kit and native-proof rules apply.

## Native geometry result

Runtime c77456af / Source 680e12ff / Kit f3669f4 (0.4.206).
Run easystud-authenticated-20261013T182312819Z-48092: PASS at 1600/1280/390 FR;
no page errors; POST and sesskey present; no fixture/business writes.
Credentials cleared, child stopped and lease released. External run manifest retained.
The predecessor 20261013T182028474Z-47568 is retained: transparent white
serialized as rgba(255,255,255,0), while its overly strict oracle expected
transparent black. Successor checks alpha zero and border zero; product unchanged.
1280 and 390 captures inspected: aligned copy, matching contours, unframed caption.
The 1280 capture still shows Moodle picker loading: upload readiness/lifecycle
is not certified by this presentation test. No claim about T025 density.
Penpot and human gates remain open.
