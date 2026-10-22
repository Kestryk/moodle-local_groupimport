# Guide mirror correction for db964f08 — 17 October 2026

Supersedes the d01f7208-only mirror candidate. EasyStud branch work/codex1/easystud-guide-mirror-db964-20261017 is based on **db964f08**. Canonical counterpart work/codex1/easyedu-kit-guide-db964-20261017 is based on **d4cdfe5**, preserving the accepted empty-card composition.

1. Apply the supplied Codex2 guide-fixes-kit-mirror-20261017.patch without conflict; its generic JS preimage is exactly d5283282079396a5f3a4ee34e2ac3c5f0ad45063.
2. Retain the exact accepted bindNavigationTooltips block from a9ed193c: Escape dismisses the tooltip before the Guide, pointer entry is supported and exit grace remains 220ms. Canonical discovery SCSS equals the accepted db964f08 consumer, including pointer-events:auto.
3. The patch also preserves current step re-acquisition, docking/scroll callbacks, superseded cues, and balanced discovery narration across Motion levels. No new behavior is invented during synchronization.
4. Copy the resulting generic JS to easyedu-guide-kit. The exact round trip reconstructs the **unchanged db964f08 AMD source**, including localization, fullscreen and Motion adapters.

PASS: T03714 checks, T03847 checks, roundtrip6 callable AMD exports +3 SCSS +2 templates, with the canonical Kit path supplied explicitly. No test modified. Runtime source, compiled AMD, CSS and templates remain byte-identical to db964f08. No build or deployment needed for this mirror-only synchronization.

Evidence: <workspace>/artifacts/a11y-followup-20261017/db964-{t037,t038,mirror-roundtrip}.log. JSON includes patch/source hashes. No runtime, native browser, service or human acceptance claim. Focus-ring591904cc excluded. AI design contract unchanged: this is an accepted-source mirror repair, not a new component or policy.
