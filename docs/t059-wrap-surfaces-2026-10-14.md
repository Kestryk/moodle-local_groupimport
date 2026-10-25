# T059 Message wrapping and remaining surfaces — 2026-10-14

The 49072e22 stress case found an 84px title overflow for a temporary long title,
not a confirmed native translation overflow. Allow the flex title to shrink with
min-width:0 and wrap with white-space:normal / overflow-wrap:anywhere; preserve
the native Message dialog width. Product SCSS adapter only; Kit propagation belongs
to Codex1. No Message controller, sending, Guide or admin change.

The immutable predecessor remains t059-remaining-49072.spec.js. The successor uses
the existing native 30s Message readiness bound, captures synthetic title BEFORE
restoration and distinguishes it from the actual translated title. It chooses native
desktop Structure or compact Groups/Groupings navigation, and measures Rollback's
actual inner dialog. FR1600/1280/768/390, both rendering modes; Move, Message,
Group/Grouping settings, populated-group delete Confirmation and existing Rollback.
No native history is created; business writes remain blocked.

SCSS compilation passes; injected CSS candidate only. First successor: all six surfaces PASS at1600/1280 in both modes; mobile768
stopped because the harness cleared only the hidden desktop selection command.
The mobile successor uses the actual Clear-selection proxy before switching entity
type, asserts the group input is enabled, and retains every geometry assertion.
Final results pending C:/dev/artifacts/es-final14/after/matrix.json. Human acceptance remains open.

Visual inspection:390-message-long.png from es-final14 confirms wrapped title and
visible Close, unchanged narrow dialog. The body is still loading in that frame;
this evidence certifies title/shell containment, not settled Message body content.
The es-final14 supervisor was interrupted before reactive results; the dead owner
39832 lease was released and original mode/Guide preference restored before es-close14.

## Final result
C:/dev/artifacts/es-close14/after/matrix.json: T059 PASS in legacy and reactive,
24cases per mode,48total; six surfaces at1600/1280/768/390FR, no gaps, no page
errors, no business writes. Every native/synthetic shell stays inside the viewport
and every synthetic title has0px horizontal overflow. Message body-loaded proof,
Moodle4.5 runtime and human visual acceptance remain separate gates.
