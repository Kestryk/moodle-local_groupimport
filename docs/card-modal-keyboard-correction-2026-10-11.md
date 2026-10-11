# T041 — card-modal keyboard lifecycle

The supervised baseline at1280px reproduces missing initial focus/Escape on
Participant, Group and Grouping. Their original Cancel return-focus already
works; it is retained. Scope is the existing product adapter, not new Kit paint.

One dialog-local helper focuses the actual canonical Close after the Participant
is shown or the dynamic editor is attached. Escape invokes the existing native
Close/Cancel callback, retaining exit Motion, return-focus and Guide inspection
signals. A nested control that already handled Escape takes priority. Hidden or
closing dialogs ignore repeated keys. No global keyboard listener survives a
removed editor. No Save, transfer, removal or network command is introduced.

The controller's complete preceding content can be reconstructed by removing
only the helper and its three adoption sites. All CSS, Mustache, Guide engine,
Motion, PHP/business and settings are byte-equivalent after EOL normalization
to Source3d9dfe2. Official AMD builder generates the module and source map.

The old `test-card-modal-contract.ps1` fails on a pre-existing SCSS string
expectation (`type-control-label`), unrelated to this JS-only lot. It remains
unchanged; the dedicated source/build successor covers the bounded correction.
`test-card-modal-keyboard-generated.cjs` passes exact full-controller and
protected-file reconstruction, nested/hidden/closing Escape cases, initial
focus semantics and fresh Terser equality for the built AMD plus source map.
The first isolated harness incorrectly assumed embedded `sourcesContent` in
that map; it is retained unchanged. The successor checks the real generated
format, not a changed production build configuration.
Native served proof is still open until the managed preview and successor run.

No Foundation/Kit visual component change is applicable to this logic-only
adapter correction. Tab containment and broader modal accessibility stay in
T058; this lot does not claim a complete accessibility audit. The human combined
checklist remains OPEN. Baseline/successor specs are local-supervised candidates;
isolated reconstruction is a CI candidate. Shared Platform registry ownership
is preserved through this versioned backlink.
