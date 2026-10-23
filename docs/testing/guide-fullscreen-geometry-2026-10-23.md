# Native fullscreen host geometry

K23-22, source predecessor EasyStud 0eddc33f and Kit 153ad816.

The host-parking optimization retained each sibling's border-box dimensions but
not the margins collapsed through its descendants. On Community course 5 the
banner child has 16px top and 24px bottom margins. Applying content-visibility:
hidden establishes containment, suppresses that collapse and moves region-main
up by 40px. Host release restores both margins, moving the panel down by 40px.
Window and Moodle scroll offsets, padding and transforms do not change.

The controller snapshots sibling groups relative to their own parent, applies
parking in a batch, then releases groups whose positions or dimensions changed
by more than 0.01px. Parent-relative checks avoid rejecting a stable heavy frame
merely because an earlier host sibling moved. Lightweight unstable headers stay
live; the heavy workspace frame remains parked. No host-specific selector or
margin compensation is introduced.

The release promise, 350ms release interval, Close fade and focus handling remain
unchanged. No participant cache, state mutation, CSS token or Motion change.
Canonical controller, embedded controller and the generated AMD adapter carry
the same implementation. Unrelated canonical Guide drift is not overwritten.

## Reproduction and proof boundaries

Use tools/playwright/guide-fullscreen-geometry-native.cjs with base URL, course
id, absolute evidence directory, label, comma-separated locales and optionally
a candidate built Guide AMD. Credentials use EASYEDU_TEACHER_USERNAME and
EASYEDU_TEACHER_PASSWORD. PLAYWRIGHT_MODULE, QA_CHROME_EXECUTABLE and
QA_ACORN_MODULE select installed tooling. The optional AMD is substituted only
in the owned browser context; it does not deploy to the server.

The probe clicks the real Guide controls, enters actual browser fullscreen,
calls document.exitFullscreen(), then immediately clicks Close. It records
every animation frame for 1.2s, including parent boxes, styles, scroll positions,
parking, modal visibility and the rendered locale. At least ten samples spaced
approximately 40ms apart are required; every frame must retain the same panel
top and the final position must match the pre-opening position. Ordinary Close
is checked separately. Locale labels must actually be translated.

External workstation evidence: C:/dev/artifacts/k23-22-20261023. Full native
results and outstanding gates are recorded in RAPPORT-K23-22-20261023.md in
the review folder. Browser substitution is not production publication.

The asynchronous release contract now also rejects a geometry-changing group
and checks that rejecting every group cannot strand a release promise. The
new assertion fails against the original controller.
