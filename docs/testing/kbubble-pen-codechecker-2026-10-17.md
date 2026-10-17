# K-BUBBLE / PEN-K17: scoped official checker

Base 9e628d4f; changes introduced by 7a858be3 and 07dec8dc..f9d0dd6a.
No product change was needed. The unmodified local_codechecker 5.1.0 engine
(MoodleCS3.7) reports three touched PHP files, zero errors and one existing
warning (guide_specimen.php:19, MoodleInternalNotNeeded, not an error). PHP lint3/3.
The official non-PHP function reports13 supported files, zero errors/warnings.
Its native file types do not include JS, SCSS or Mustache: those files are not
mislabelled as PHP-checked. They remain unchanged from the published revision.

Moodle ESLint checks the new import-free bubble and its Node builder: zero
errors; bubble zero warnings, builder five warnings (brace layout and promise
return). Source normalized LF is used, preserving the working tree's CRLF.
The actual Guide binder/shared controller test passes9 localized/width cases
at1280/768/390: hover, keyboard, click/Escape/scroll, fullscreen, teardown/rebind.
This is an isolated headless fixture, not a new native Moodle runtime recipe.

Detailed rule/file reports and immutable predecessor harness diagnostics are
outside Git: C:/dev/artifacts/kbubble-pen-check-20261017/.
No build, runtime access, service operation or localhost publication occurred.
No source correction means no generated AMD/CSS rebuild was required.
