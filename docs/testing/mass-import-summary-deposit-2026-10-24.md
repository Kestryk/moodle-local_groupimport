# Mass Import deposit action and summary typography

The regular secondary-button recipe overwrote the file-removal action's blue
with the ordinary text colour. The shared Moodle file-deposit adapter now
explicitly consumes `--easyedu-secondary-text` after that recipe. Its 32px frame
and destructive hover/focus-visible states are unchanged. The selected filename
already uses the control-label role and remains unchanged.

Report summary items consume the existing body typography role (0.9rem, 400),
including their counts at inherited size and semibold weight (600). The
section-title token is 1rem here: reusing it would retain the reported 16px
size. Semantic success/error colours remain parameters of the shared recipe.
No new token, page-specific override or JavaScript is introduced.

## Native protocol and scope

Use an authenticated staging Mass Import page and an actual Moodle picker
upload. Compare the served CSS with the candidate stylesheet fulfilled only in
the headless test browser. Do not deploy files or confirm an import. At
1600/768/390, measure the visible filename, removal control, icon and pseudo,
then the two real preview summary items and their `strong` counts. Assert the
exact secondary token colour, unchanged filename typography/frame, 14.4px
summary text (400), 14.4px counts (600), unchanged semantic colours and no JS
exceptions. Delete the exact test draft in `finally`; preserve failed runs.

The shared source is maintained in the canonical Kit and mirrored here. The
page assets contain the source-compiled rules for this change only. A complete
build at this base also changes two unrelated navigation rules and three Guide
rules, already stale in HEAD; those changes are excluded. Rule inventory,
selectors and all unrelated declarations are compared to HEAD. The Guide
stylesheet is byte-identical to HEAD. The external evidence contains the full
build, bounded extraction script, declaration comparison and native captures.

Native results and branch hashes are recorded in the external K23-65 correction
report. Browser-local CSS fulfillment is native staging DOM/server proof, not
verification of a deployment. Deployment and human acceptance remain separate.
