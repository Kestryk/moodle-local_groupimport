# K21-33 — Duplicate language assignments

Base: `0802e4c6`. Keep the English simple-create editing sentence that matches
French: the pencil renames, the copy icon creates a duplicate marked `(copy)`.
The later sentence was an older wording overriding that choice. The repeated
Mass Import path warnings were byte-identical; keep their first definitions.

`node tools/release/test-language-key-uniqueness.cjs` checks every literal
assignment in both language files, rejects duplicate keys and checks exact
FR/EN key parity: **1,469 unique keys per language, PASS**. No key or placeholder
is removed from the effective catalogue. Only the intended editing sentence
changes. PHP syntax checks pass.

No runtime or visual change beyond that text; no AMD/style build is required.
The pre-existing intake JSON at this base contains unresolved merge markers;
it is deliberately not rewritten or reordered by this change. This document
and the changelog carry the handoff until that separate conflict is reconciled.
