# Guide checklist readability

K23-26 changes only the fourth description of prepare-activity-grouping in
French and English. Its title, IDs, targets, prerequisites, completion events
and all other steps remain unchanged. The instructions still cover destination,
optional removal from other groupings, the singular/plural confirmation action
and preservation of completed moves after a failure.

Four short plain-text paragraphs replace the single dense paragraph. The shared
Kit step-caption recipe uses white-space:pre-line to retain intentional line
breaks; textContent remains the renderer, so this introduces no HTML parsing.
Typography, line height, colours and padding retain their existing Kit values.
No other installed Guide translation contains a newline on this predecessor,
so the new whitespace policy leaves their layout unchanged.

Native proof uses the actual first three path steps on an owned Moodle 5.1
copy, then stops at the confirmation step and cancels the move dialog. No
group assignment is submitted. Both French and English are verified at1600px.
Descriptions have four paragraphs with the original18.24px line height. Their
measured height changes from164.109375 to255.28125px in French, and145.875 to
237.046875px in English, providing the requested paragraph separation.

Language keys/order/placeholders and every other value are preserved. Ordered
compiled CSS is identical after removing the one announced white-space
declaration. Other page styles and global styles are byte-identical. JavaScript,
AMD, Motion and path configuration producers are unchanged.

Detailed evidence is in the external review report
RAPPORT-K23-26-27-20261023.md and its k23-26-27-20261023 artifact directory.
Source, native bounded proof and human visual acceptance remain distinct.

## Completion mark (K23-27)

The completion mark used a FontAwesome check-circle inside the existing32px
soft success disc. Use the existing plain fa-check glyph instead, retaining
the single background disc, its palette tokens, dimensions and flex centring.
The canonical template, embedded mirror and Moodle template share this change.
The aria-hidden and hidden states remain unchanged; no controller is modified.

Native French/English measurement uses the actual completed membership demo.
Chrome DevTools Protocol gives the pseudo-element box and the outer disc box.
Both centre deltas are exactly0px on both axes before and after. The double
circle is reproduced, but a CSS-box centring defect is not reproduced on this
predecessor. The simplification removes the extra glyph circle without an
invented positional compensation. Pixel-ink bounds in fractional-position33px
screenshots retain a0.5px horizontal raster discrepancy, reported separately
from CSS geometry. No claim of a larger measured offset is made.

Native runs have no console/JavaScript errors and submit no course mutations.
MoodleCS: zero errors; PHP syntax is valid. ESLint is inapplicable because no
JavaScript source or generated AMD changes. Only Guide CSS is rebuilt with
the pinned Node22.11.0 and Sass1.79.1 toolchain. Existing Motion is preserved.
