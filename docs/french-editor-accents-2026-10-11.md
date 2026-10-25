# T042 — French advanced-editor accents

Correct five existing Moodle-localized strings only: Paramètres avancés,
the existing introduction, configurée, fichier sélectionné and Données.
Native button labels/ARIA/help and modal rendering consume those same labels;
no French copy is hardcoded in JavaScript, no key or English text is changed.
This is punctuation/diacritic correction, not a rewrite of the introduction.

Source reconstruction checks the complete remaining locale file and unchanged
PHP/controller/Guide/markup/CSS against0027796. PHP syntax and native French
editor/accessible-label proof remain separate gates. No new shared visual
component, Foundation variant or Penpot English specimen change is applicable.
No Save, course mutation or fixture is needed. Human checklist remains open.

`test-french-editor-label-contract.cjs` and PHP syntax pass. Preserve the
failed guessed-ARIA predecessor rather than changing the reusable production
helper for the test. `french-editor-accents-native.spec.js` is local-supervised:
FR1280/768/390 native entry, original ARIA/help, no-file and configuration copy,
Escape only; a pre-existing image is never removed to invent an empty state.
Native serving and results remain pending until the pushed preview runs.

That native successor passed on Source cbf99c2 / runtime0722045: six actual
FR Group/Grouping entries at1280/768/390, accented ARIA/help plus modal copy,
Escape only. No errors or blocked writes; no-image text is checked only where
the pre-existing image state permits it. No data/settings changed. Evidence:
`testing/native-host-layout-and-french-labels-2026-10-11.json`. Human review
remains open; this does not certify all French strings or full modal layout.
