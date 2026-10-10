# Guide header palette: bounded R10-01 successor

Status: served at runtime6152a67; configured-palette native gate passes.
Human review remains deferred. This does not close the other R10-01 pop-ups.

Native run44232 passes1280/768/390/1280 header/title/icon paints and open/close,
including the real compact portal. Settings/business writes, errors and blocked
calls are zero. Credentials, owned child and lease cleanup are complete.
Custom/restored colours remain isolated proof, not persisted admin changes.
Exact pins and limits: `testing/guide-header-palette-native-2026-10-10.json`.

Verified pre-publication snapshot: `ws3-20261010T205206Z-port4719pg3-d7fb96e1a4f7`.
Two earlier snapshot attempts are retained: first bundle verification ran outside
a repository; second restoration exposed Windows line-ending/index differences.
Use the owned repo as cwd, normalize only owned files, then stage before snapshot.

## Cause and shared correction

Discovery already uses the canonical modal header geometry and title tokens.
Its header did not opt into the canonical primary custom-palette paint. The
default appearance was correct, but a configured custom primary colour left
the header on the official palette. The portal token relay already works.

The Kit exposes the existing primary header paint as a reusable mixin. Its
public class retains identical output; Discovery consumes that same mixin
through its existing header selector and an explicit template class. Do not
add an `easyedu-ui` reset to the portalled Guide or a plugin-local gradient.
Legacy presentation, title/icon dimensions, Motion, controllers, progression,
PHP and language data remain unchanged. Guide synchronization now includes
the canonical dialog-palette SCSS dependency.

## Evidence and limits

- Baseline Source: `5f1315909756eba9d7c479ec47ff6ab3054da30a`.
- Baseline isolated audit: 12 custom-header mismatches out of 24 cases;
  default/restored headers and icon/button/title paint already passed.
- Successor isolated test: 24 passing cases at 1280/768/390, default/purple/
  orange/restored, before/after the actual product portal relay.
- Final CSS rebuilt with Sass 1.79.1; exactly four added paint lines.
- Default header heights remain 64.203125px desktop/tablet and 81.21875px
  phone; title remains 16px. These are isolated-render measurements.
- `test-guide-header-palette-source.cjs` pins full AMD/PHP/language preservation,
  exact one-class template changes and all unrelated compiled CSS.

No settings or course data were written. These tests do not certify persisted
admin colour changes, native Moodle rendering, Penpot publication or acceptance.

## Saved design reference gate

Existing Foundations providers Desktop `f02e60c2-e6ba-8015-8008-bf70d6dac52f`
and Narrow `f02e60c2-e6ba-8015-8008-bf70d79c6c6c` are unchanged. Two linked
paint references are saved in Guide easystud at y27040, x0/x900:
`7aaaed58-7fa9-80c8-8008-c5284ccec0a8` and
`7aaaed58-7fa9-80c8-8008-c5284da0ed66`. Saved server readback verifies provider
IDs, source file, 64px height, clipping and the existing13% custom radial tint.
Both focused PNG exports were visually inspected. The first Narrow export
failed transiently; a single retry succeeded without design changes.

These are generic Entity-header paint references, not a claim that their
body/title geometry is the complete Guide modal. Existing Guide default/fullscreen
specimens remain untouched; no new Foundations family is created.

## Reusable implementation lesson

Check the compiler version before compilation. A local build dependency was
Sass 1.58.3 and initially produced unrelated CSS changes; those outputs were
replaced with the pinned 1.79.1 build before acceptance. Keep the full-CSS
preservation gate. Read large contracts in bounded slices rather than combining
several large outputs; exact token/cost totals are unavailable.
