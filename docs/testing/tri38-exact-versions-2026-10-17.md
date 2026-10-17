# TRI38: exact build versions on389b832d

The authoritative file is tools/release/build-versions.json: Node22.11.0 and
Dart Sass1.79.1 exactly, conservative CSS. No dependencies are installed,
upgraded or rewritten. The older toolchain-contract.json remains the historical
Moodle/package provenance record; its recorded Node20 observation does not
override these build pins.

Every one of the18release builders calls assertNode before any build work.
Both Sass paths verify the loaded compiler's actual info before compilation.
check-toolchain --release also enforces the exact pins; inspection-only mode
retains its historical diagnostic role. A mismatch throws a clear message with
required and actual versions and the instruction to use the recorded portable
executable/package path; it never silently chooses another version or installs.

The unit test rejects Node20.17.0 and22.12.0, Sass1.80.0 and unknown Sass,
accepts the exact pins and verifies guard placement in all18entry points.
The installed Node20 executable is also actually rejected before a builder's
self-test. Node22builds SM, course manager, Guide, shared bubble and conservative
page CSS PASS, as does the conservative-builder self-test. No generated output
differs from389b832d after Git line-ending normalization.

The first bubble rebuild exposed only CRLF in source-map sourcesContent; its
mapping, names, source list and executable AMD were unchanged. The builder now
normalizes source input to LF before Babel. The final map matches the committed
reference; the original diagnostic is preserved in the external report.

No PHP source changes. The unmodified official local_codechecker non-PHP pass
reports13supported files,0errors/0warnings. Its supported file types do not
include JavaScript/SCSS: do not relabel this as a JS lint certificate. A separate
Moodle ESLint check covers22changed/new tool files (including the L1 test):
73pre-existing errors versus74on the same baseline configuration, no file
increases. The new guard and tests have0errors. Existing tool lint findings
are retained in the JSON; no rule severity or assertion is relaxed.

All protected product sources, PHP, templates and AMD/CSS output remain
unchanged. No runtime, service or localhost publication. Evidence:
C:/dev/artifacts/tri38-389b832d-20261017/.
