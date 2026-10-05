# Searchable dropdown terminal spacing - SM-55

Kit 0.4.107 fixes one measured exit defect: a framed choice's outside margin
stayed at 8px until hidden, moving the following help text abruptly. Choices
now pass the opt-in collapseMargins flag to canonical disclosePanel so that
space closes with the frame. Source and generated AMD are rebuilt together.
No CSS, template, field content, font, business selection or command changes.
No private animation engine, selector offset or new font. Original card Motion,
360ms paired chevron timing, pointer pause/resume and focus remain unchanged.

## Evidence and limitations

- Exact isolated predecessor 2662aa1 fails by 8px; twelve successor cases
  (single/multiple, regular/compact, 1600/768/390) pass <=1px terminal jump.
- Existing framed-choice selection/focus, physical pointer hold, rapid reversal,
  reduced/disabled and destroy regression passes at three widths.
- Existing framed card-disclosure continuity/reversal/static regression passes:
  the new option defaults off for those consumers.
- Initial fractional endpoint diagnostics are preserved (10px before/2px after)
  because border-width pixel quantization differs from exact hidden cleanup.
  The same exact terminal oracle fails before and passes after; no relaxed gate.
- Generated callable AMD exports pass after rebuilding both modules. An initial
  builder invocation used the checkout root rather than its node_modules argument;
  correct documented build was then run. An accidental predecessor build in
  Runtime changed two generated files only: preserve those exact own files in
  a verified external snapshot, then restore only those files under the promotion
  lease to the already-served HEAD before continuing. No unrelated edits lost.

Runs live under the external Kit artifact names choice-terminal-spacing-
20261005-exact-predecessor, -terminal, -regression and -card-regression.
Do not equate these isolated HTML fixtures with native Moodle or human review.

`student-choice-terminal-spacing-preview.spec.js` is one versioned
local-supervised native Administration candidate: all visible enhanced fields
at 1600/768/390, physical Escape, exact terminal frame, help/default/host
continuity, focus and cleanup. It blocks settings POST and never saves settings.
Its native execution, other modal/filter consumers, paired Foundations/EasyStud
Motion annotation and human acceptance are OPEN until separately recorded.
No Penpot write is made while the parallel Guide window may use the MCP channel.
