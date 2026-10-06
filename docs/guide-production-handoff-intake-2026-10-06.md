# Guide production handoff intake — first local integration

Portable scope under EED-UI-2026-0073. User asked to preserve all prior lots,
read the Guide window's handoff and integrate its production locally with a
dedicated Penpot channel. See `lots-before-guide-handoff-2026-10-06.md`; older
requirements/human acceptance remain OPEN, not superseded by Guide priority.

## Scope card

- Owner: existing EasyStud/Kit implementation window, single writer.
- Source branch: `work/port4719pg3/easystud-foundations-student-management-20260928`,
  pre-integration checkpoint `57d533f94e5d3c4941d161a2dcf7e6be3e61b4bb`.
- Kit branch: `work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin`,
  checkpoint `4c5ee3bb4be857ff434d77459f6865338afb2bb6`, version0.4.124.
- Both existing worktrees clean/pushed/even at intake. No new worktree.
- Includes: Guide shell/presentation/content through canonical Kit, limited
  Student Management adapter, dedicated Guide/Foundations crosswalk and tests.
- Owned candidate paths: Kit `guide/templates/easyedu_guide.mustache`,
  `guide/amd/src/easyedu_guide.js` only presentation lifecycle extensions if
  needed, `scss/easyedu/components/_guide.scss` or bounded new Guide composition;
  Source shared embedded copies, runtime template/wrapper/build, Guide-only
  adapter SCSS, `manage.php` Guide builder/configuration regions and Guide
  strings/docs/tests. Final hunk allowlist follows source comparison.
- Excludes: native business actions/AJAX/capabilities/data, technical rename,
  card/CSV Motion, highlight geometry/lifecycle rewrite, fixture creation or
  cleanup, CCB deployment, unrelated pending controls and global plan writes.
- Runtime: only managed Moodle5.1 preview with its exclusive build/cache/test
  leases; no production/main merge. Exact preview commits/scenario are recorded
  at readiness, not inferred from the demo.
- Shared dependencies: current Kit, existing Guide engine/storage/progression,
  canonical icon providers and serialized Foundations/Guide publication.

## Received production and precedence

External artefact root is supplied locally, not hardcoded into production code.
Handoff filename `PROMPT-PASSATION-CODEX-INTEGRATION-GUIDE.md`, SHA256
`88AD903A86A226A2FAEB4D2C40DEDA1C60B2D4914CA990DFBDE4BE1CBB80390F`.
The complete prompt and nine reference families were read. Apply current6
October rendering/slides/source/evidence over explicitly historical README
paragraphs (Atlas,880x680,old timings/disconnected statements).

Candidate: modal on the product page, up to1220x800, compact Inter roles,
topics/progress/fixed interface cue/footer, preserved content scroll, same-size
footer actions. Four Student sample lessons only: concepts, series creation,
membership comparison and actions/confirmation. Mass Import is a distinct
later curriculum, not silently merged into Student or claimed complete.

Reuse current scene/Motion primitives and canonical icons; clean the demo's
33KB SCSS composition/late overrides instead of copying them. Do NOT deploy
demo.js as engine, demo workspace, vendor snapshot8149ce5, local SVG substitutes,
notes/agent files/profiles/captures or an old whole Kit tree.

## Dedicated design/local channel verified read-only

Guide browser CDP9227 is alive on Guide Easystud
`b564c72c-f31f-81ec-8008-ad9958b272bd`, Page1
`b564c72c-f31f-81ec-8008-ad9958b272be`. Local4400 manifest,4401 transport and
4402 websocket are listening. Demo4415 responds HTTP200 and serves only its
allowlisted assets. Two plugin panels were observed, one Connected and one
Not connected; these labels do not prove which transport receives a tool call.
Read-only SDK identity did not return before stopping the wait; no Guide
shape/token/browser/server/configuration mutation was performed.

User says the Guide window has finished for now, but is unsure about channel
release. Serialize the actual channel before writes; never close its browser,
regenerate tokens or overwrite hosted MCP to guess a fix. Reported server2.15.4
/editor2.18.2 warning remains unresolved, not a proved failure cause.

## Current source differs from the handoff snapshot

Read-only `sync-easyedu-guide.ps1` preflight reports embedded JS/Mustache aligned,
but two drifts: runtime shared SCSS and AMD source. No `-Apply` was used.

- SCSS current Source retains newer launcher centring and transparent
  hover/focus, two-column guided-card composition with final action row,
  normal wrapping. Canonical Kit still differs at these bounded declarations.
  Do not overwrite those approved Source fixes with the old snapshot.
- Runtime wrapper and canonical controller both1845 body lines. Exact comparison
  finds12 text-only differences: nine empty localized defaults and three
  localized fallback removals. They are NOT missing controllers or highlight
  implementation. Preserve translation behavior explicitly during sync.
- Source current storage key remains `local_groupimport.easyedu_guide.<courseid>`
  and `.checklist`; completion uses stable path/step IDs. Existing paths include
  first-structure,create-grouping,try-actions. Retain their IDs/state and content
  not covered by four demo lessons through a reversible migration.
- Preserve original highlightStyle pulse-blue,5200ms configured cleanup,
  target variants and real compact routes. No diagram-based rewrite.

## Immutable source baseline (SHA256)

| Source file | Hash |
| --- | --- |
| embedded controller | AD4F6A3739C0096A242519E7A1BA8D87F4764BDB13E7014770A9EB3A61FA755E |
| runtime template |61ED82A0623BCFDAE2971961F97CA9BCD0DB12B54A9A9E175DE52D6B4831DD38 |
| shared Guide SCSS |1BB2C08256900112E789CA44C33BF922E49D6FCCDF216C2FA170703C387A4DDE |
| runtime AMD source |912D3E12C6B1338AAB08B73A1A94412A2FE982A6387BAEA7363ED02F9DE3352A |
| generated AMD |4E8727691A8B13CD6EEE2DD4C18A39E2F98582F34E32F0A78C511D8B599A5699 |
| Source Guide adapter SCSS |D0610FDE465C00CF121C30FE25A4066CC055D471AC4FD53C14AE4EDED21D966C |

## Candidate source baseline (SHA256)

| Demo file | Hash |
| --- | --- |
| index.html | F46483E9C9F1FF65A5CD39AC5CEC7BCE1B4BDEDF607D9566A0694E6715F911DF |
| guide.scss |439D6AE77AE2E1A8EC6B3FAA41A725C94368C7B81F482AE04026402337509B85 |
| guide.css |40A5171E46306686AEF32D38C9B2CF652D3282AA8032B5DD3BB2FE3C0E2F56E2 |
| content.js |5CAA8AC88151DA0009325167753DE1FB0AA26038F48398DF6C19E914E189FF6D |
| demo.js |152B24FE33BEC7176FAA18377E2673060226CE9F088895AFF5AEA2D32392F866 |
| motion.js |A49804C05D9A6108AB84C1F6325430EF4CFD97D444028978C10668134FEF4F35 |
| scenes.js |85BB42155B6B91012FC488BB09707CA1CA65C069DFB1C1B947DD7BCE4903F687 |
| icons.js |E0369775094B438E1E44C258276E10A34BFBB7FD98BF6E1A31A8217E7BF7D48E |

## First integration steps and acceptance gates

1. Preserve these baselines and current private branches; finish G1 crosswalk
   and reconcile bounded Source/Kit drifts without blanket sync.
2. Reuse/publish canonical shell/topics/invitation/checklist compositions and
   icons. Preserve the Guide's existing linked providers/archives; read saved
   and painted states before propagating source/library changes.
3. Add declarative typed scenes/content to the existing engine, not another
   init/destroy/progression/highlight implementation. One true interface target
   and an existing accompanied path; preserve old useful curriculum and IDs.
4. Rebuild from source, prove unchanged highlight/card Motion/business commands,
   then controlled local preview and1280/768/390, Tab/Escape/return/reopen,
   scrolling/rail, reduced/cancellation/missing-target and translated text.
5. Only prove actual business completion when separately authorized synthetic
   exercise data exists. Never mark completion from a prompt/opening or mutate
   a real course automatically; no cleanup promise without a safe journal.

At this checkpoint NO Guide presentation/controller/template was replaced,
NO shared component published and NO Guide change deployed to Moodle. Demo
proof is standalone only; the shared human checklist remains open. This intake
is an execution boundary, not an implementation or acceptance claim.
