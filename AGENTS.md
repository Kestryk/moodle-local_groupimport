# EasyEdu agent contract

Discovery Close reuses the native regular multiplication glyph in the existing
Small frame; legacy Guide icons remain. No invalid FontAwesome weight override,
consumer CSS or new Close frame family. Canonical glyph/linked Foundation slots
must precede preview. Keep title-role parity separate from product eyebrow and
Fullscreen glyph work; preserve controller, state and Motion.

Discovery copy must name the illustrated source/destination before explaining
Add/Move, distinguish source members from global Participants, and teach mobile
card actions rather than desktop gestures. Copy-only modernisation preserves
accepted Overview/cards/Motion and stable path IDs; it is not curriculum dedup.

Targetless Discovery cue is optional chrome: hide the entire row and reclaim
its grid track without inventing a target. Preserve original command identity,
attributes, locks and restoration. This is not a new Penpot family. Isolated
geometry and synchronized builds are distinct from served-native proof.

For cross-repository EasyEdu context, start with
`<EASYEDU_PLATFORM_ROOT>\AI\README.md` when it is available locally. Then read
`AI\easystud\context.md` in the platform repository before editing this plugin.
This Moodle component remains `local_groupimport`.

Before editing, read `easyedu-kit-docs/ai/DOCUMENTATION_CONTRACT.md`. Every
feature, validation protocol or reusable UI change must update the appropriate
technical docs, changelog and AI contract, or explicitly explain why one is
not applicable.

## Multi-machine development contract

Every AI agent working in this repository must follow the canonical EasyEdu
handoff procedure:

https://github.com/Kestryk/workstation-sync/blob/main/docs/PROJECT-HANDOFF.md

A handoff is complete only when the relevant worktree is clean, its branch has
an upstream, and all local commits are pushed. Unfinished work must use an
explicit pushed WIP commit on a feature branch; a Git stash is not a handoff.

Before handoff, create a verified workspace snapshot. On the destination
workstation, fetch and fast-forward only from a clean checkout. One branch has
one workstation owner at a time.

Never reset, clean, discard, merge or rebase a dirty handoff automatically.
Preserve and compare it first. Report repository, branch, HEAD, upstream,
clean/dirty state and ahead/behind counts before claiming readiness. Managed
workstations receive no remote service, elevated configuration or policy bypass
without explicit organisational approval.

## Playwright visual artifacts

Before running visual tests, read the platform policy at
docs/development/playwright-artifact-retention.md when the platform checkout
is available. Screenshots, videos and traces stay outside Git and Syncthing.
Register the run manifest, inspect the dry-run retention report and never
delete unmanifested legacy captures or another agent's active run.

If another Codex window owns the required Moodle/runtime lease, use the shared
Playwright wrapper with `-WaitForLease` and a bounded timeout when available.
Do not interrupt the owner or repeatedly relaunch the same test.

## Authenticated Moodle 5.1 Playwright

Use `tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1` for
authenticated EasyStud checks. Supply the local DPAPI loader through
`-CredentialLoaderPath` and the shared orchestration module through
`-OrchestrationModulePath`; neither path may be fixed to a workstation drive in
versioned files.

The runner must discover exactly one test before loading credentials or taking
the GroupImport active-runtime lease. Use `-WaitForLease` when the runtime can
be shared with another supervised run. Cache purge and fixture mutation require
their own dedicated leases. Credentials remain process-local, are passed only
to the owned Node child and are cleared in `finally`. Never request them in a
conversation, inspect user or machine credential variables, or persist
authentication state. Browser profiles, logs, screenshots, videos and traces
must remain in the external manifested run directory.

## K3.1 Navigation Skeleton consumers

The selected Playwright source spec must remain immutable until its owned
child has exited and cleanup is recorded. Diagnose from the loaded source
revision/blob, not an excerpt re-read after editing the file. Capture visibility
is independent of geometry: keep native sticky actions, scroll normally and
check paint hit targets; never hide overlays merely to obtain a passing image.

Treat the embedded K3.1 Navigation Skeleton as mandatory for every EasyStud
view that renders real `easyedu_navigation` markup. Its compact one-line frame,
decorative Guide-start circle and one internal cue stay `aria-hidden`,
non-focusable and independent from navigation destinations, loading readiness,
no-script and fail-open behavior. Internal Skeleton cards use the logical K3.1
`border-inline-start` accent; only large structural left/right containers use
the K3.1 `border-block-start` accent. Never apply either Skeleton frame or
border to an interactive view toggle/selector. Update the durable coverage
matrix and the local source contract whenever a real Navigation view is added
or removed.

For existing EasyStud disclosures, preserve the normal-motion open/close
transition as well as the final geometry and ARIA state. Do not replace Motion
with an instantaneous class or `hidden` change merely to repair layout. A
focused regression scenario must assert the transitional
`is-easyedu-disclosing` state in normal-motion mode; reduced-motion remains a
separate supported path.

## Branch, runtime and response handoff

Read `<EASYEDU_PLATFORM_ROOT>\docs\development\branch-runtime-handoff.md` and
`<EASYEDU_PLATFORM_ROOT>\AI\prompts\procedure-refresh.md` before a branch swap,
runtime test or cross-window handoff. Several windows may work on separate
branches, but only one window may own the shared Moodle `localhost` runtime.
Use the platform read-only branch report helper before handoff and use
`-WaitForLease` for an occupied runtime. Never reset, clean, stash, merge or
rebase another window's dirty worktree.

Before selecting commits for a preview, compare their owned predecessors with
the runtime's recorded applied commits. Include relevant documentation, test
and source-pin prerequisites in order; do not omit them solely because they
are non-visual. Preserve unrelated commits outside the requested scope. After
an authorized conflict recovery, verify the exact cherry-pick, clean runtime
and unchanged generated assets before the managed cache-refresh/test gate.

Every response must end with:

```text
NEXT MODEL: <recommended Codex model>
MODEL REASON: <why it fits the next planned step>
NEXT TASK: <one concrete next task>
ESCALATE IF: <condition requiring another model, role or human decision>
```

This is required for corrections, diagnostics and blocked tests as well as
planned implementation work.

Read `<EASYEDU_PLATFORM_ROOT>\AI\DEVELOPMENT_PLAN.md` and the relevant
`AI\memory\easystud\CURRENT_STATE.md` or roadmap before editing. Update the
versioned plan/state files when a milestone, blocker or next step changes.
Preserve valuable Playwright specs as versioned candidates for Docker/CI and
classify them in the shared scenario registry; keep only generated media
outside Git.

Native Close hover comparisons must wait actual subtree animations before
sampling final paint. Keep failed transient-colour runs/specs immutable and
retain strict glyph/frame/focus oracles; never repair a harness race by changing
the accepted UI Motion. Close parity does not certify Fullscreen or curriculum.

Guide common explanations use dt/dd, not h4/p for their topics. A containment
test must count all actual title/description/note nodes; outer frame plus note
alone is narrower evidence. Preserve that preliminary run and create a strict
successor without changing product assets or weakening painted-text bounds.

Discovery Show commands are relocated into the common cue row. Native tests
wait the committed current slide, assert its exact visible command/opener and
await the interface Return after the view/open callback; modal hidden alone
is not readiness. Preserve failed harness specs and accepted product Motion.
Guide-opened identifier fields do not prove manual card-menu access or recognition.
