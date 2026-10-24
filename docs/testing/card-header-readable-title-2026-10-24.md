# Readable Group and Grouping identities in narrow columns

After direct actions have moved into the existing overflow menu, terminal controls
can still leave only one glyph for the name. The controller now marks that final
condition explicitly. The shared `card-header-readable-fallback` recipe gives the
identity the first row and lets the remaining controls occupy the following row.
The first row retains the standard action target height so its selector anchor
does not depend on the number of wrapped controls. Wide headers retain their layout.

No command, menu Motion, selection scope, name typography or translation changes.
The shared mixin is also delivered in the canonical UI Kit branch.

## Native verification

Run `tools/playwright/card-header-readable-title.cjs` against an owned pool runtime.
Set `PLAYWRIGHT_MODULE`, `EASYSTUD_BASE`, `EASYSTUD_EVIDENCE_DIR`,
`EASYSTUD_TEST_USER`, `EASYSTUD_TEST_PASSWORD`, `EASYSTUD_COURSE_ID` and optionally
`EASYSTUD_CHROME_PATH`. The course must contain Groups and Groupings.

The matrix covers FR/EN, 1600/1280/1150/1050/1024/768/390, closed/open course drawer,
and separate compact Groups/Groupings views. Mobile drawers cover the workspace
intentionally and are recorded separately. Check title width, name/control overlap,
card-boundary containment, and Escape/outside-click closure of the desktop menu.
At 1050 with drawer open the local Grouping title grows from 16px to 113px;
Group titles retain at least 148px. Production originally measured 13px.

`test-card-overflow-dispatch.cjs` remains a separate command-delegation gate.
The historical `test-group-header-wrap-source.cjs` is pinned to an older complete
CSS snapshot and already fails on the unmodified integration base; it is not a
current native layout oracle. Preserve it rather than weakening its assertions.
