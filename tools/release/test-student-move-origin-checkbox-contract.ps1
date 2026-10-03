$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
$foundation = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/easyedu/_foundation-classes.scss')
$forms = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/easyedu/components/_forms.scss')
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json

if ($manifest.version -ne '0.4.75') { throw "Expected embedded Kit 0.4.75, found $($manifest.version)." }

if ($template -notmatch 'class="easyedu-toggle-check local-groupimport-easystud-toggle-check local-groupimport-easystud-move-origin-check"') {
    throw 'Move-origin option does not consume the canonical Kit toggle-check class.'
}
if (-not $template.Contains('data-easystud-move-remove-origin="1"')) {
    throw 'Move-origin native checkbox hook is missing.'
}
if (-not $foundation.Contains('.easyedu-ui .easyedu-toggle-check { @include forms.toggle-check; }')) {
    throw 'Foundation classes do not publish the canonical toggle-check.'
}
foreach ($required in @('&:hover', '&:focus-within', 'input:checked + span::before', 'input:disabled + span')) {
    if (-not $forms.Contains($required)) { throw "Canonical toggle-check state missing: $required" }
}
if ($foundation -notmatch '(?s)@media \(max-width: 52rem\).*?\.easyedu-ui \.easyedu-toggle-check \{ min-height: var\(--easyedu-touch-target-min\); \}') {
    throw 'Canonical toggle-check does not expose the responsive 44px hit target.'
}
if (-not $css.Contains('.easyedu-ui .easyedu-toggle-check')) {
    throw 'Compiled consumer CSS does not contain the canonical toggle-check.'
}
Write-Host 'PASS: Move-origin uses the canonical Kit toggle-check with hover, focus, checked and disabled states.'
