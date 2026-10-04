# Framed Search/Add disclosure - SM-41

Baseline native search sampler `easystud-authenticated-20261004T212554151Z-14144`
passes at 1600/768/390; it records 120/122ms effects and a 19.59px padding/border
floor, followed by an abrupt final hide. No page error or business request;
credentials, owned child and runtime lease cleanup complete, no fixture mutation.

Kit 0.4.94 adds `Motion.disclosePanel` as a shared opt-in recipe. Its function
is copied unchanged into this consumer's existing namespaced Motion module.
`setInlinePanelOpen` delegates only native member/container search and
group-email/grouping-groups add panels. All other controllers, original Motion
methods, data hooks, Show-all, native card contents and stylesheet remain intact.
The helper owns `is-open`, interpolates frame insets with height for 320–420ms,
captures paint before reversal, and restores original inline declarations.
These transient measured values are runtime orchestration, not template styles.

`build-motion-amd.js` compiles only this worktree's source using the existing
Moodle Babel/Terser toolchain, without writing to its source checkout. Generated
AMD `disclosePanel` export is executed and callable; ordinary format checks
alone do not establish that export. Existing Browserslist notice is unchanged.

Isolated Kit frame/reversal/policy tests pass. Native successor
`student-inline-disclosure-successor.spec.js` is a separate immutable spec
asserting shared duration, zero padding/border endpoints and no old frame floor.
Native successor/Group and Grouping Add coverage, destination-dropdown successor,
paired Penpot notes and human acceptance remain pending until appended below.
