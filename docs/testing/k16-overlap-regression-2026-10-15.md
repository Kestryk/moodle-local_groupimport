# K16 ? horizontal separation and right footer

Claude audit of af12dc17 found responsive selector/name overlap and a centred filter Reset. Earlier strict vertical/metadata oracles remain valid only within their measured scope; they missed horizontal separation and the footer right edge.

Kit653adbe reserves the full44px touch target plus12px before the text column, with the accent4px before text; selector placement is explicit. The same Kit stacked-footer mixin owns intrinsic button width, auto start margin and end alignment. Existing vertical alignment and Motion stay intact. Consumer only includes the Kit composition.

Native k16-overlap-served-native.spec.js: FR/EN1600/768/390, four cards, initial and toggled density, target AND painted-square to name gap>=8px, accent outside target, case/eye/menu centres<=.5px, name/email/all meta groups one column; all visible filter footer right-edge errors<=.5px. Native pending publication. No course business writes intended.

Follow-up: initial native182722955Z-30956 measured desktop painted-square clearance11.609375px but full target gap4.796875px. The oracle deliberately requires8px for BOTH boxes. Kit3f288bb adds8px start padding to the common text column; every metadata block moves with it. This retains the failure and does not weaken the threshold. Strict-matrix successor uses soft geometry assertions only to collect all cells before returning a failed verdict if ANY threshold fails.

Final native183318258Z-752 PASS on runtime35092059: {"runtime":"35092059","run":"easystud-authenticated-20261015T183318258Z-752","matrix":"FR/EN1600/768/390; initial+toggled density","cards":64,"minTargetGap":12.796875,"maxCaseDelta":0.0078125,"maxEyeDelta":0,"maxMenuDelta":0,"maxFooterRightError":0,"pageErrors":0,"businessWrites":0,"humanAccepted":false}
The intermediate182956511Z-34840 exposed a tablet avatar-row shift from forced grid columns, fixed in Kitccd6007; outgoing transparent footer nodes are excluded by paint state, not by geometry thresholds. No threshold/Motion change. Penpot/human acceptance remain open.
