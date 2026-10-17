# TRI38 — build toolchain provenance and release limitation
Base 05a84c57. Read-only package inspection; no dependency installation or build.

| Tool | Recorded installed version | Release meaning |
|---|---|---|
| Node | 20.17.0 | Used successfully by standalone builders; DOES NOT meet Moodle engine |
| Moodle build engine | >=22.11.0 <23 | Inherited from current build checkout package.json |
| Sass | 1.79.1 | Existing builders explicitly assert this version |
| @babel/core | 7.17.5 | Installed Moodle build package |
| Terser | 5.11.0 | Installed Moodle build package |
| AMD lazy plugin | 2.0.1 | Installed Moodle Babel plugin |

The July Node 20.19.4 / Sass 1.77.8 note is historical, not the present builder
contract. Do not label Node 20.17.0 as the official Moodle release toolchain.
tools/release/toolchain-contract.json records versions and the open acceptance.
check-toolchain.cjs accepts absolute build-root/Sass-root/external-JSON arguments;
inspects package provenance without installation/config/bootstrap; `--release`
rejects an engine outside the inherited range. It does not certify full builds.

PASS inspection, syntax and deliberate fail-closed check: observed Node 20 produces
exit 1 in --release mode. No runtime, product, generated asset, dependency or
PATH/config changes. TRI38 remains PARTIAL: select an exact Node 22 patch within
the inherited Moodle range in a dedicated build toolchain, run the existing AMD /
conservative CSS builders and parity checks, then record that patch as validated.
No Kevin visual choice is needed, but that unperformed validation must not be
represented as a completed release pin. No npm install or Node replacement here.
