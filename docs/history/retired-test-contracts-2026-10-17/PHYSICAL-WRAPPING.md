# Physical wrapping of retired source transcripts

The `.txt` files in this folder are historical source transcripts, not executable
tests. Eight transcripts contained lines longer than the native Moodle
codechecker limit. Only their physical line wrapping changed on 17 October 2026.
No assertion, value, result, character or original whitespace was removed.

`physical-wraps.json` records the number of physical lines corresponding to each
original line, the original byte length and both SHA-256 hashes. To reconstruct
an original line, concatenate its counted physical lines without the intermediate
LF characters, then append one LF. This reproduces every original byte. A wrapped
transcript is not intended to be executed or copied as executable JavaScript.

Run `node tools/release/test-retired-transcript-wraps.cjs` from the plugin root to
verify the exact reconstruction and the maximum 132-byte physical line length.
The external, byte-for-byte originals are retained in
`<workspace>/artifacts/codechecker-zero-20261017/reflow-originals/`.

This presentation change does not alter the retirement decisions or reactivate
these historical tests. No codechecker rule, ignore list or assertion was relaxed.
