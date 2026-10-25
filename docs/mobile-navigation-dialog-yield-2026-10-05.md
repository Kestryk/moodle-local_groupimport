# Mobile navigation continuation (SM-49)

Earlier SM27/SM47 evidence already established canonical Inter roles and a
native-course-links composition. SM51 observed the fixed launcher protruding
through the Participant modal's left edge; stacking below the dialog doesn't
necessarily suppress its paint through a semitransparent backdrop.

The read-only successor audits all rendered native drawer label/row fonts at
390/768/320 after fonts/Motion settle. It uses actual mobile Participant-eye
entry, records active aria-modal markers and launcher visibility, then closes
normally with focus return. It never follows destinations/opens Guide or writes
business data/fixtures. Correct type must not get a speculative override.

Source/Kit/Foundation policy for yielding to an actual modal, native baseline
and any successor remain OPEN. Shared Guide project/connection stays untouched.

Native audit PASS213952482Z-22356: all13 visible destination rows and their
actual label children use canonical EasyEdu Inter15/500, title16/600, white
opaque drawer at390/768/320. Actual mobile Participant-eye entry and Close
focus return work; zero errors/blocked requests/fixtures, all cleanup true.
Font complaint is not reproduced in this revision; don't add another override.
The native launcher remains visibly painted (44x44, layer1064) while the public
easyedu-modal-layer Participant dialog is open. Preserve that diagnostic.

The embedded Navigation composition differs substantially from the older
canonical Navigation module, including accepted trigger geometry and Guide
integration. Do not blanket-sync it to repair this issue. Modal primitives and
public dialog classes are identical canonical/embedded: an additive public
modal-yield-control can use the already present easyedu-modal-layer lifecycle
without editing Navigation/Guide controllers or redoing accepted Motion.

Canonical candidate adds modal-yield-control to identical modal/dialog modules
and one public template class in both canonical and consumer Navigation. Full
generated CSS differs only by one visibility/pointer rule; all other CSS,
controllers, AMD, Navigation geometry and accepted Motion are unchanged.
Inactive hidden/aria-hidden public dialogs do not suppress the trigger. Native
successor retains all baseline type/focus checks and adds actual hidden/recovery
at all three widths with normal and reduced Motion. Paired design/native/human
publication remain OPEN. No broad Guide/Navigation drift sync is attempted.

Paired visibility protocol is now recorded in Foundations Library/Standard
and EasyStud Student/Mass Import boards (1240x320); three linked canonical
Default specimens retain 48x48 and visible/hidden/visible states. Twenty-four
existing product triggers receive the same lifecycle annotation without skin,
geometry or controller changes. See testing/mobile-navigation-modal-yield-
penpot-2026-10-05.json. Initial inactive-page policy write failed before mutation;
reconciliation confirmed no partial board, then each owned page was opened
before writing. The first Student readback had unavailable text paint until the
owned viewport rendered it; settled Inter text/containment has no overflow.
This is structural/paint readback, not a clean export or human visual PASS.
Source 48px versus native 44px size parity remains separate. Guide untouched.

Canonical Kit0.4.117/ea831179469d4042003f0939e28075f6be480045 is pushed;
embedded modal/dialog modules match it exactly after normalized line endings.
Source complete-CSS/template/controller preservation and one-test discovery
PASS. Preview must include documentation predecessors d8948e4 then af963ae
before the implementation. Native normal/reduced Participant entry, modal
visibility suppression and close recovery remain pending; Message/Guide and
all-dialog journeys are not certified by this bounded scenario.

## Served native successor - PASS

Ordered request20261005T220005Z-c17b5f28db applied all three commits at clean
runtime ec8bbd15, cachePurged true; Source68b14f6 is served. One selected test,
run easystud-authenticated-20261005T220036839Z-31252, passes twelve records:
390/768/320 with normal/reduced Motion. All thirteen actual destination rows
and children retain Inter15/500, title16/600, opaque white and >=44px targets.
Actual mobile Participant-eye entry hides the fixed launcher in all six cases;
native Close restores the eye focus and visible launcher. No page errors,
blocked requests, business writes or fixtures; credentials/child/lease cleanup
complete. Retention dry-run deletes0 and protects1. Full pins and limits are in
testing/mobile-navigation-modal-yield-native-2026-10-05.json. Human acceptance,
48/44 specimen parity, clean design export and other modal journeys stay OPEN.

6October persistence correction: original Product protocol IDs were not saved
because the prior SM52 nested capsule link blocked autosave. Native CSS PASS is
unaffected. Recover exact capsule linkage, recreate only missing owned protocol
boards and verify all three via server GET200/UI Enregistré/validate=[]. Current
Student/Mass IDs are in testing/penpot-autosave-recovery-2026-10-06.json;
earlier readback metadata is historic, not current saved proof. Guide untouched.
