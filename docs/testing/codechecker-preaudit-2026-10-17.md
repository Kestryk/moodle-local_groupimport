# Codechecker pre-audit — 17 October 2026

Base c752f775. MoodleCS on all 112 tracked PHP files, including tools/fixtures; Moodle ESLint config on 51 amd/src files. No suppressions added.

- PHP: 10215 errors / 156 warnings → 1231 / 124. Executable-token equality and lint PASS across 44 touched PHP files. Remaining product findings: two logging errors, six internal-guard warnings.
- ESLint: 23522 errors / 622 warnings → 23518 / 621. Includes 23409 retained CRLF errors; excluding them, 113 → 109 errors. Three comment-only modules have identical executable Babel tokens.
- Required targeted tests PASS: escaping, filter engine, long-list pills (16 cases), T037 (14), T038 (47), five CRLF controller tests. Isolated release smoke PASS. No native runtime acceptance claimed.
- Builds SM/CM PASS; generated executable AMD unchanged, three source maps updated. CSS, visible templates and language files unchanged.
- Duplicate testsCrlf20261017 entry merged losslessly. No other existing evidence changed.

Full before/after tables by rule/file and remaining decisions:
C:/dev/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/PRE-AUDIT-CODECHECKER-2026-10-17.md

Machine reports/logs: C:/dev/artifacts/codechecker-preaudit-20261017/.
Audit tools still return nonzero because existing findings remain; this is a bounded mechanical cleanup, not a clean-lint claim.
