# Restricted UI Kit distribution — 2026-10-03

## Outcome

The canonical UI Kit repository remains the private development source. Its
public Sass exporter creates an allowlisted archive containing only
`scss/easyedu/**/*.scss`. Agent contracts, audits, history, documentation,
examples, tests and build tools are not embedded in that ZIP. The private build
manifest and archive SHA-256 are emitted beside the ZIP, not inside it.

Canonical Kit checkpoint: `b43f819` on the existing
`work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin` branch.

The ordinary Kit synchroniser already copied only the Sass tree by default.
It now requires an explicit `-IncludeInternalDevelopmentAssets` acknowledgement
before `-IncludeDocs` or `-IncludeAiContracts` can copy private material into a
development checkout. Guide, Motion and Navigation are distinct optional
runtime-source integrations; they do not widen the SCSS-only package.

EasyStud retains internal Kit docs in its private Git checkout because source
contracts and focused tests consume them. They are excluded from the customer
plugin archive through `.gitattributes`. The release validator now also rejects
`easyedu-navigation-kit`, `AGENTS.md`, `.codex`, `.claude`, or an `ai` directory,
and verifies that every archived entry under `scss/easyedu/` is a `.scss` file.
The first archive run correctly caught the embedded `scss/easyedu/README.md`;
that development reference is now explicitly excluded as well.

## Verification

Kit command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-scss-package-contract.ps1
```

Result: PASS. The generated public ZIP contained the complete Sass source count
and no non-SCSS/internal path. The generated temporary package and its internal
verification manifest/checksum were removed by the test.

The strict Kit audit still reports thirteen pre-existing new-baseline findings
in earlier component files. This distribution-only lot did not change those
SCSS files and does not relabel that audit as clean.

EasyStud package command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release\validate-plugin.ps1 -BuildArchive
```

Run this after the source checkpoint is committed so the Git-backed archive
represents the exact candidate. The resulting ZIP stays outside Git.

## Boundaries

- This is a packaging/privacy contract, not code obfuscation. The Sass required
  to build a standalone paid plugin remains inspectable by its recipient.
- The exporter does not create or alter a licence. Commercial/licensing terms
  remain an explicit owner/legal decision and are not inferred here.
- Runtime PHP, Mustache, AMD and compiled CSS belonging to EasyStud remain part
  of the Moodle plugin package.
- No CCB source, production site or Moodle data changed.
- The future technical rename to `local_easystud` remains a separate migration
  lot; current release validation intentionally retains `local_groupimport`.
