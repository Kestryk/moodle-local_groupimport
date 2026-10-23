# Adaptive card search and rename Save

Inline card search uses the existing `card-inline-search-panel` recipe as a named inline-size container. At an available panel width of 20rem or less, `easyedu-inline-search-cancel` hides only its visible label and reuses the field-peer X frame: 38px on desktop, 44px at the existing touch boundary. Wider cards retain their text Cancel. Keep the native button, its translated accessible name, and the original filtering/cancellation handler. The search field consumes `easyedu-search-field` in both initial and dynamically created cards.

Rename Save uses the existing Foundations `floppy-disk (solid)` icon, painted in currentColor on the shared centred 16px box. The public `easyedu-create-icon-button` frame, hover/focus states and Cancel X remain unchanged. The icon mask and field-peer frame each have one shared definition. No global Moodle control changes.

Foundations: file `40e06342-8830-80d6-8008-96572effc11c`; Save master `d7c302b3-48b7-802c-8008-d49fa1b3694f`, linked desktop/touch usages; constrained-search composition `f7ecc2e2-dc33-80e2-8008-d565abfd35d5` on page 09.5. Linked fields and existing Cancel controls retain an 8px gap.
