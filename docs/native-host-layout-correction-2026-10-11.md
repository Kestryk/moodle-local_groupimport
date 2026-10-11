# T004 / T005 — native host layout, shared Kit source

Supervised baseline `easystud-authenticated-20261011T163109029Z-44064`
reproduces both defects at1600/1280/390px with no errors or writes: Moodle's
native drawer toggle has z-index1200 and wins the actual paint hit above the
Guide at1067; Preview import is14.08px left of its action host's centre.
The empty native label still occupies space, field width is short and the note
is start-aligned. No guessed z-index or image-only inference is required.

The preceding failed native diagnostic used an overescaped route replacement;
it stayed on manage.php. Keep that immutable spec/run; no product fix is based
on its missing Import element. The corrected route baseline retains diagnostic
rows before later assertions.

Five canonical Kit CSS rules restore the existing behavior. Moodle drawers
yield to the existing html Guide-blocking marker, so no new JS lifecycle or
z-index is required. The deposit adapter expands only the outer action group
and field, hides only its explicitly empty label and centres the adjacent note.
No button skin/size, real label, nested field, footer or business command changes.

`test-native-host-layout-normalized.cjs` passes same Sass1.89.2 whole shared
CSS preservation, exact canonical consumer copies and complete consumer CSS
reconstruction to7f5a4a9. Its failed predecessor doubled a virtual-import path;
preserve it, normalize the test's virtual file path and do not change production.

These are native-host bridges, not new Foundation control anatomy or paint.
No independent product component or Foundation family is created. The accepted
blocking modal and centred actions remain the visual references; native
EN/FR1600/1280/390 outcome is a separate managed preview gate, still open here.
The saved Foundation identity main was independently read as Inter14/700,
#264861. Correct its stale documentation;600 weight adoption stays a separate
approved shared-publication lot. Human checklist remains OPEN.
