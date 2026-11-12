# Shared component guard

The CI job `kit-guard-report` audits this plugin in report mode. Its artifact `kit-calls-local_groupimport` contains findings, observed debt, named approved exceptions and mirror provenance. Existing findings do not block rollout; parser/configuration errors do. Existing CI gates are unchanged.

Canonical implementation: private EasyEdu UI Kit, `scripts/check-kit-calls.cjs`. Refresh only the tooling with `scripts/sync-kit-guard.cjs ABSOLUTE_PLUGIN_ROOT`; no product components are overwritten. The standard Kit synchronization also distributes it. The checker in `tools/kit/` is copied exactly.

The committed baseline records observed debt, not approval. Before switching to `--fail-on-new`, review it; never refresh it automatically in CI. `--zero` is the final stage after migration. No exception is pre-approved: `kit-guard-exceptions.json` starts empty. Any waiver needs an exact finding, expiry and Kevin decision reference.

The source lock contains canonical hashes at a pinned revision, not copied private source. Assets that do not match remain unverified findings; syncing the checker never ratifies their contents. Public CI needs only this reviewed lock, not access to the private Kit.

This is static review evidence, not browser/Penpot or human acceptance. Changes to the checker, baseline, source lock or exception approvals need review. To revert this integration, revert its dedicated tooling/CI commit; no runtime, schema or product file was changed.
