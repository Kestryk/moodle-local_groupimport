# EasyEdu Audit Baseline

The audit baseline separates known kit debt from new regressions.

## Why

The kit currently contains deliberate design constants, legacy fixed
measurements and some patterns that should be reviewed gradually. A raw audit
therefore produces useful signal, but too much noise for day-to-day work.

The baseline lets future work fail only when it introduces new suspicious
patterns.

## Commands

Run a non-blocking report:

```powershell
.\scripts\audit-kit.ps1
```

Fail only on new findings:

```powershell
.\scripts\audit-kit.ps1 -FailOnNewWarning
```

Refresh the baseline after a deliberate review:

```powershell
.\scripts\audit-kit.ps1 -UpdateBaseline
```

## Rules

- Do not update the baseline just to silence warnings.
- If a warning is new, either fix it or document why it is now accepted.
- Resolved baseline findings are good news: remove them from the baseline by
  running `-UpdateBaseline` after review.
- Token files may legitimately contain colour constants, but component files
  should prefer tokens or documented component constants.

