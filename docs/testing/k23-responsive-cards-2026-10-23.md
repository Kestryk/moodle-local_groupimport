# K23 responsive Person and Grouping cards

Base: `f0bb9363`. The responsive workspace opts into three additive Kit recipes:
right-aligned Person copy, a selection target centred on the existing container
header line, and a container title without its generic optical block inset.
Desktop recipes, dimensions, colours and Motion are unchanged.

The responsive membership command reads the existing complete participant index
(`groupids` / `groupingids`). Empty containers, the visible page and active search
results do not decide whether participants have memberships. Both responsive
controls use native `disabled`; the desktop density command remains available.
The ordinary density refresh updates availability after model/selection/viewport
changes; no participant cache or parallel membership model is added.

Isolated gates:

```text
node tools/release/test-responsive-membership-toggle.cjs
node tools/release/test-k23-style-scope.cjs <absolute PostCSS module>
```

The style gate retains every original generated rule and declaration in order.
Only explicit responsive Person/Grouping opt-ins may add the announced alignment
properties. Native desktop comparison must use settled animations and an idle
pointer: an earlier colour sample captured different hover transition progress.
That failed oracle remains part of the external evidence.

The native measurement candidate is
`tools/playwright/candidates/k23-responsive-cards-native.cjs`. Arguments are an
absolute Playwright module, an owned pool base URL, an external artifact directory,
a phase name, a populated course id and a course id without memberships. Supply
`EASYSTUD_TEST_PASSWORD` through the environment. Acquire/release the pool lock
and synchronize with PowerShell before running it. The candidate records facts;
its output is not an automatic assertion of full acceptance.

K23-07's immediate menu closure was not reproduced on this base. Native evidence
covers Grouping menu activation in both languages at 1600/390, plus touch contexts
at 768/390, including activation shortly after a view change. Do not label it fixed
or change shared menu handlers based only on a suspected bubbling conflict.
Responsive menu paint, persistence, outside click and Escape are checked separately.

Detailed before/after measurements, captures, exact source/runtime hashes and any
remaining limits live in `RAPPORT-K23-CARTES-RESPONSIVE-20261023.md` in the review
folder. No native Moodle 4.5 execution is claimed by this bounded 5.1 pool recipe.
