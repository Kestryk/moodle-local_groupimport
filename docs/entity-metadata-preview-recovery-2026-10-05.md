# Metadata documentation preview conflict - recovery gate

Source/Kit presentation lots are pushed and already served. No browser CSS,
controller, template, SCSS or data diff exists in the failed docs-only promotion.
The source preview currently serves `3d926a3` on local runtime HEAD
`90a6933e9ca1415db29cde74c701d82538778428`.

Managed promotion `20261005T095711Z` attempted Source
`0e60a8c5dee9c2461d9d7b6490c84f66053f6287` and stopped on one documentation
conflict: `docs/student-entity-metadata-native-2026-10-03.md`.
Runtime CHERRY_PICK_HEAD is exactly that Source SHA; six other docs/test files
are staged, one document is unmerged. No manual recovery/abort has been run.

## Verified cause

The earlier owned prerequisite `35813f2c13fee55fd8e60846a7340f327ca87fb7`
was omitted from the preview chain. Runtime still has the initial audit
paragraph and lacks both prior native/paired catalogue evidence JSON files.
Source's new appendix is based on the already-published documentation.
This is integration-order failure, not a product runtime or CSS failure.

The omitted commit contains five documentation/manifest files only:
CHANGELOG, metadata native doc, two 3-October evidence JSON files and the Kit
consumer manifest. Recovery must restore those historical records without
downgrading the current Kit 0.4.106 or deleting newer consumerSync entries.
Do not fix this by taking one side blindly, skipping the missing proof or
replaying an older complete manifest over current source pins.

Verified external snapshot
`easystud-metadata-doc-conflict-20261005-preserved` retains all seven exact
pending runtime files, including conflict markers. The Source and Kit feature
worktrees are clean and pushed. Runtime remains on the local-only preview
branch; never push it, reset/clean/stash or mutate business data.

## Required authority and next sequence

Stop runtime writes and request explicit recovery approval. With approval:
re-read the exact HEAD, CHERRY_PICK_HEAD, seven-file allowlist, snapshot and
leases; recover the omitted prerequisite and successor in order, retaining
current manifest/changelog pins. Stop again for any unrelated edit/conflict.
Then verify clean runtime, both historical evidence files, ordered source
records, complete unchanged CSS/controllers/templates and managed status.
No cache purge or fresh authenticated browser is needed for docs-only recovery.

## Penpot continuation

Product metadata anatomy is corrected and two final exports were inspected;
human checklist remains OPEN. Foundations is now connected in the owned browser
at Library page `81455adb-6787-8068-8008-9ce6186bf6ef`; provider/host inventory
was read only. No Foundation component write has been made in this increment.
Resume its paired row/settings-list publication after the preview recovery;
pending exact provider/consumer IDs are recorded in the native metadata doc.
