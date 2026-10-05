# SM-46 - Progressive colour-panel successor

User requests the Foundation popup in preview, not just an OS swatch. Human
checklist OPEN. Existing seven native controls remain 160px M swatch/Hex rows.

## Ownership and native authority

Kit 0.4.103 owns public S/M/L popup SCSS and optional classic draft controller,
canonical code pin `8351869`,
embedded byte-identically at `js/easyedu_colour_picker.js`. PHP adds translated
labels and loads that controller before the existing Admin bootstrap. There is
no private popup paint, anonymous AMD definition or inline template style.
Dynamic CSS variables carry selected colours only. Public export stays SCSS-only;
the one optional runtime file contains no internal docs/agent assets.

The original unnamed native swatch and named editable Hex remain in their
generated setting, with validation, storage/defaults, contrast note and Restore
unchanged. Modal drafts do not change the named field until Apply; Apply never
saves settings. Cancel/Escape restore opener focus without applying. Read-only,
disabled and unsupported controls retain their native fallback. Native dialog
owns modality and native labelled Hue/Saturation/Brightness ranges provide full
keyboard alternatives to the pointer SV plane. Real Save and a screen-reader
matrix are not certified by this bounded proof.

## Source - Penpot - consumer crosswalk

| Shared source | Foundations | Consumer |
| --- | --- | --- |
| `components/_color-panel.scss` and public class aggregator | Library 08.4.1 `81455adb-6787-8068-8008-9ce9b711604d`; Standard 08.4 `d0d0680d-7d36-80da-8008-97a6a5af5762` | Embedded canonical SCSS; no private view changes |
| `colour-picker/colour-picker.js` | Open/Keyboard/Invalid/Disabled state notes | `js/easyedu_colour_picker.js`; exact bootstrap call only |
| Regular public fields/actions | Linked existing M field and icon-free Regular button providers | Same public M field/paired right-end actions |

M Library host `5daf2376-ada4-8014-8008-ad800eb21f37` and Standard host
`5daf2376-ada4-8014-8008-ad80be446a29` retain the four original providers,
now 352x569.6 normal / 605.6 invalid. Bottom swatch examples and subsequent
hosts shifted 180px to retain spacing; before geometry stored in pluginData.

S/L Library host `386b6f86-a1e7-806b-8008-bdcb6879a3f4`; Standard host
`386b6f86-a1e7-806b-8008-bdcccad648f7`. Twelve source/Standard recursive paint,
geometry/type fingerprints match with zero visible text or surface overflow.
M export exposed a linked field's old 360px surface: all twelve field surfaces
were corrected along with their text lanes. Palette values are centred in their
resized linked hosts. One incomplete S draft is hidden/recoverable after a
generator confused a text label named Saturation with the plane rectangle.
No canonical provider was deleted, and no native failure was hidden.

## Validation and scenario lifecycle

`test-colour-panel-successor-source.js` compares full unrelated CSS against
`01c6446`, reconstructs unchanged settings/bootstrap/language code and checks
canonical embedding. All native persistence/default/contrast/reset, loading,
templates, business commands and legacy Motion remain unchanged. Existing
colour contracts, PHP lint, JS syntax and full Sass compile pass.

Kit isolated tests exercise S/M/L at 1600/768/390: draft validity, palette,
Apply/Cancel, keyboard ranges/native modality, focus restoration, reduced Motion,
no Submit and destroy/read-only fallback. Early test focus assertions incorrectly
excluded browser chrome (allowed by WAI H102); the corrected scenario still
rejects any outside page control. A real Large/mobile UA max-width conflict was
fixed in shared SCSS, not weakened in the test. Failed manifested runs retained.

Native `admin-colour-panel-successor.spec.js` is a saved-credential, one-test,
local-supervised CI candidate with settings POST guarded, external manifested
artifacts, no Save/fixtures or persistent changes. Source/provider and product
publication, native preview and human acceptance remain distinct gates.
Product Desktop host `386b6f86-a1e7-806b-8008-bdcec509eef8` / linked panel
`386b6f86-a1e7-806b-8008-bdcec5439871`; Mobile host
`386b6f86-a1e7-806b-8008-bdcec5797e6d` / panel
`386b6f86-a1e7-806b-8008-bdcec5b5ec70` consume the original M/Open provider,
with 352x569.6 geometry and zero visible descendant overflow. Mobile export
inspected. Existing seven colour controls and full Admin compositions stay intact.
Native successor is pending at this candidate pin.

Final isolated run `colour-panel-20261005-sm46a-policy-final` additionally covers
pointer drafts, disabled fallback and the canonical saved Motion policy. The
consumer attaches that read-only policy; normal/reduced/disabled routes retain
their distinct behavior. No configuration is changed to force animation.

First native run `easystud-authenticated-20261005T035054194Z-32164` passes
Desktop/Tablet draft and Cancel paths, then exposes a real phone margin defect:
390px emulation has a 375px usable viewport with a classic scrollbar. A vw cap
leaves only 11.5px clearance. Shared percentages now exclude that scrollbar,
retaining the required 16px side clearance without hiding it or reducing the
assertion. Native and isolated scenarios measure usable viewport width. All
cleanup flags true; failed run preserved. Fresh successor remains pending.
Scrollbar-cap successor consumes Kit 0.4.104 `85c7ed3`; isolated stress run
`colour-panel-20261005-sm46a-scrollbar-successor` passes all nine size/width
cases with a deliberately scrollable page. Existing Penpot scrollbar-free
viewport specimens remain valid; responsive cap is documented rather than
artificially adding a desktop scrollbar to the phone source board.
