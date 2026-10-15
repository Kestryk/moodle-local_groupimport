# K16 ? horizontal separation and right footer

Claude audit of af12dc17 found responsive selector/name overlap and a centred filter Reset. Earlier strict vertical/metadata oracles remain valid only within their measured scope; they missed horizontal separation and the footer right edge.

Kit653adbe reserves the full44px touch target plus12px before the text column, with the accent4px before text; selector placement is explicit. The same Kit stacked-footer mixin owns intrinsic button width, auto start margin and end alignment. Existing vertical alignment and Motion stay intact. Consumer only includes the Kit composition.

Native k16-overlap-served-native.spec.js: FR/EN1600/768/390, four cards, initial and toggled density, target AND painted-square to name gap>=8px, accent outside target, case/eye/menu centres<=.5px, name/email/all meta groups one column; all visible filter footer right-edge errors<=.5px. Native pending publication. No course business writes intended.
