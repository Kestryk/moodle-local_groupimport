# Guide/Kit mirror after K-BUBBLE and PEN-K17

Base9e628d4f,17October2026. This delivery supersedes source356710fc and
Kit6973139. Do not cherry-pick the obsolete mirror into the PEN-K17 template.
The canonical dedicated branch starts at6973139 and retains its accepted
predecessors, then replaces them with the exact accepted9e628d4f content.
Main is unchanged; no obsolete Codex demos are activated.

The canonical and embedded Guide now import EasyeduBubble from ./easyedu_bubble.
The import-free controller is byte-identical after line-ending normalization to
the published plugin file, including its existing module documentation. Callers
inject Motion. No duplicated bubble renderer, timer or positioning algorithm is
introduced. The Moodle adapter has exactly two dependencies: local_groupimport/
motion and local_groupimport/easyedu_bubble, injected as Motion and EasyeduBubble.
The fullscreen lifecycle remains a separate canonical ES module embedded by the
adapter, with all six existing Guide exports retained.

sync-easyedu-guide.ps1 validates the new dependency/module boundary, copies both
embedded and runtime bubble sources, and checks accepted PEN-K17 tokens,
overflow-action and responsive recipes. It still defaults to dry-run. The
roundtrip test checks source equality, parses both ES modules, executes the
actual committed bubble AMD and checks its three exports, then reconstructs the
complete Guide AMD exactly and compares all seven templates/seven SCSS files.

T037 intentionally follows the already-published K17-35 layout: the obsolete
36rem/two-column threshold becomes52rem/three columns. Additional assertions
reject the old threshold and require both stacked and vertical1px separators.
T038 follows GNAV's localized, truncation-only Kit bubble rather than duplicate
native title tooltips. Other assertions and localized fallback/accessibility
checks remain. The initial failures are retained externally.

Validation: T03717,T03849,roundtrip6Guide/3bubbleexports/3modules/7SCSS/7templates,
sync dry-run aligned, Sass5Guide mixins PASS. The published binder/controller
fixture separately passes9localized/width headless cases at1280/768/390,
including actual fullscreen, Escape and teardown/rebind. No new native Moodle
or cross-consumer visual acceptance is claimed. No package installation tested.

All21owned consumer/product files checked against9e628d4f are unchanged,
including runtime AMD source/build/maps, templates and shared SCSS. Only mirrors,
source synchronization/tests and documentation change; no product rebuild or
localhost publication. Evidence: <workspace>/artifacts/guide-bubble-mirror-20261017/.

The central Kit main integration/other-consumer gate remains separate. This
bounded mirror does not certify inherited Motion API or CCB/EasyExam tests.

## Final pin and optional TRI check

Canonical commit: `22425104199fc217adeac60247a43ecb1afb5762`.

On this current revision, the13-suite isolated TRI19 smoke and the two
standalone TRI31 palette contracts (settings/view icons) pass. PHPUnit/Behat
native execution and the complete native custom-palette matrix remain open.
TRI2's explicit finished-path Restart composition belongs to the active GNAV
delivery; existing resetPathProgress/automatic reset on relaunch are not
mislabelled as its acceptance. TRI8's measured debounce experiment touches
reserved local/cm filtering and remains with its owner; no arbitrary timeout
is introduced. These open items do not authorize another Guide or CAR rewrite.
