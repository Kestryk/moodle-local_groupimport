# Node 22 — exact build parity
Base fcf11a6f, own worktree work/codex1/easystud-node22-validation-20261017.
Found existing portable executables (no installation, no PATH change):
- <workspace>/tools/node-v22.11.0-win-x64/node.exe
- <workspace>/toolchains/node-v22.11.0-win-x64/node.exe
Both report v22.11.0 and their SHA256 hashes are identical (see JSON).

Using the first absolute executable, run 11 current builders: SM/CM, Guide,
CSV import, navigation, Motion, admin choices, member selection, searchable
choices, card-title accent and page bootstrap. Run conservative page CSS with
Sass1.79.1/PostCSS and the unchanged Moodle build dependencies. All 12 exit0.
Compare every committed generated AMD/map/page CSS/global CSS file: 106 files,
zero content differences after CRLF normalization. No source modifications.
Raw command outputs: <workspace>/artifacts/node22-validation-20261017/.

This closes the outstanding TRI38 Node engine verification for this source/base
and these builders. Use portable Node22.11.0 rather than PATH Node20.17.0 for
release builds. This report does not change the global Node installation or
certify other Moodle branches/toolchains. No runtime, service, DB or publication.
Only this report/JSON, changelog and intake are committed; generated files remain
identical to fcf11a6f. The old build-easyedu-guide-amd.js is a predecessor builder,
not run alongside its current build-guide-amd.cjs replacement.
