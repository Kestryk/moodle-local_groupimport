# Product identity and navigation hover

EasyStud uses the existing Font Awesome fa-users-gear glyph, users with a
management gear. There is no new asset or plugin favicon. EasyEdu's cap remains
the platform brand. local\identity::ICON supplies both navigation contexts and
all current Guide cap occurrences. Historical audit snapshots stay unchanged.
Inventory: rail tile, drawer tile, assignment slide descriptor, takeaway workflow
and ready recap specimen. No text, colour or layout changes are intended.

Navigation destinations use --easyedu-navigation-hover-duration, falling back
to the existing slow Motion step (220ms). Desktop items previously used 180ms
paint/160ms transform; compact items used the fast step. Property lists, easing,
paint and geometry remain unchanged. The global tokens and Guide/drawer timing
are untouched. Existing reduced/minimal overrides still win at 0.01ms.

Native scenarios cover Student Management and Mass Import in FR/EN at
1600/768/390px: identity glyph, frame geometry, all visible navigation items,
full/reduced/minimal duration and unrelated tokens. The real Guide must contain
the management glyph and no cap. Baseline comparison replaces only the icon
class in the HTML response and serves pinned baseline CSS. Candidate contexts
and generated assets are deployed temporarily on the owned local runtime,
then restored. No production deployment or Penpot publication is included.

The narrow timing hunk is identical in Kit and consumer; unrelated pre-existing
differences between their Navigation files are outside this patch. The Kit
template's optional identityicon preserves the platform cap by default.

The native matrix passed 24 before/after cases (two languages, two views,
three widths). Both Guide contexts contain three management glyphs and no cap.
Item dimensions/text, identity colour and global Motion tokens are unchanged;
full duration is 220ms, reduced/minimal duration 0.01ms. PHP checking reports
zero errors (three pre-existing redundant-guard warnings in existing classes).

Rebuilding Mass Import also emits two selection-action rules already present
in the pinned SCSS but absent from its checked-in CSS. They are not a new
selection recipe in this lot. The source CSS audit proves every unrelated
rule unchanged; Administration and Guide styles are byte-for-byte unchanged.
