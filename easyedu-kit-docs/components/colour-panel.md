# Progressive colour panel

Opt-in `color-panel(small|regular|large)` and public `easyedu-color-panel*`
classes use 320/352/384px widths, 120/144/168px pointer planes, viewport caps,
one 16px title and existing M text fields/Regular right-end actions. The
existing S/M/L swatch+Hex control geometry is unchanged.

The optional classic `colour-picker/colour-picker.js` exports
`window.EasyEduColourPicker`. Copy only that runtime file plus canonical SCSS;
the SCSS exporter deliberately does not bundle JS, internal docs or agent data.
Load after DOM creation, then call `enhance(control, labels)` per swatch/Hex
pair. Labels are required translated `title`, `hue`, `saturation`, `brightness`,
`palette`, `hex`, `invalid`, `cancel`, `apply`. The returned handle has `open()`
and `destroy()`; initialization is idempotent. Destroy restores the native
swatch's original visibility. Unsupported dialogs/read-only/disabled controls
retain the native fallback.

The named Hex input is authoritative. Typing, native labelled ranges, pointer
SV editing and six Kit presets update only a modal draft. Invalid drafts disable
Apply. Escape/Cancel discard the draft and restore opener focus. Apply updates
the named Hex and dispatches native input/change, never Save or form submission.
The controller owns no persistence, contrast validation, Reset or product routes.
Only dynamic colour values use inline CSS variables; all geometry/paint is SCSS.

Native `<dialog>` owns background inertness and focus containment. Browser
chrome remains reachable, as described by [WAI H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102).
Native colour popup appearance varies by browser/platform, hence the progressive
panel rather than an attempted SCSS repaint of an OS picker. See
[MDN color input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/color).
Normal entrance is restrained; reduced Motion is static. A disabled Motion
ancestor propagates its policy to the portal. No screen-reader matrix is claimed.

`scripts/test-colour-panel-browser.cjs` is a local-supervised CI candidate.
S/M/L at 1600/768/390 pass Hex Apply/Cancel, pointer-independent keyboard,
focus restoration/containment, palette, reduced Motion, named-field authority,
fallback/destroy and no Submit. Final publication run is recorded by the
consumer; generated media remains external and manifested. Earlier focus-test
and native-UA width failures remain retained, not silently overwritten.

Foundations 08.4.1/08.4 publishes twelve size/state providers; 12 settled
Standard/source fingerprints match, with no visible text or surface overflow.
State families are Open, Keyboard focus, Invalid HEX and Disabled. Disabled is
a catalogue specimen, not permission to open a disabled native setting.
Product/native/human acceptance remain independent.
