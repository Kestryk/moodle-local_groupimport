# Production package — 17 October 2026

`Node22 tools/release/package-plugin.cjs ABSOLUTE_EXTERNAL_OUTPUT_DIR` creates `local_groupimport.zip` with a single Moodle root `groupimport/`, an independent contents list and a SHA-256 manifest. Uses tracked clean production inputs only; rejects symlinks, unsafe paths, unsupported Node and ZIP64 sizes. No shell archiver, database or external dependency.

Allowlist: runtime PHP entrypoints, classes, db (including tour JSON), lang, templates, js, amd/src + amd/build (including maps), fonts/pix, styles/styles.css, SCSS product source, README/CHANGELOG/LICENSE. Keeping readable product source preserves review/debugging and source availability; embedded Kit documentation/mirrors are not runtime dependencies.

Excluded: tools, all docs, development tests, fixture/sandbox directories, node_modules/vendor, VCS/agent files and untracked files. Full per-file included/excluded lists are generated outside the product as package-contents.md and package-manifest.json.

Independent Python zipfile check PASS: CRC, unique safe paths, all content hashes, no excluded paths, blank extraction, Moodle install inputs and PHP lint of all extracted PHP files. Repeat build has the same ZIP SHA-256. Evidence: C:/dev/artifacts/package-plugin-20261017/verification.json.

This is static install-structure validation only. No Moodle installation, upgrade, DB change or runtime acceptance is claimed. Archive built from this branch's 108f0b2c production base; later deliveries require a fresh package. Node22 portable: C:/dev/tools/node-v22.11.0-win-x64/node.exe.
