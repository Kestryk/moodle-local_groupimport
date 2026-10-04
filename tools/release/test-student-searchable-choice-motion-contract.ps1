[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$pairs = @{
    'amd/src/searchable_choices.js' = 'choices/searchable_choices.js'
    'scss/easyedu/components/_searchable-choices.scss' = 'scss/easyedu/components/_searchable-choices.scss'
}
foreach ($file in $pairs.Keys) {
    if ((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $pairs[$file])) {
        throw "Searchable Motion Kit drift: $file"
    }
}

$source = Get-Content -LiteralPath (Join-Path $root 'amd/src/searchable_choices.js') -Raw
$css = Get-Content -LiteralPath (Join-Path $root 'styles.css') -Raw
$build = Get-Content -LiteralPath (Join-Path $root 'amd/build/searchable_choices.min.js') -Raw
foreach ($needle in @('const animatePanel = (expanded, complete)', 'panelAnimation.cancel()',
    "panel.inert = true", "typeof panel.animate !== 'function'")) {
    if (-not $source.Contains($needle)) { throw "Missing source Motion contract: $needle" }
}
foreach ($needle in @('--easyedu-choice-disclosure-duration', 'overflow: clip',
    '.easyedu-searchable-choice__panel.is-open')) {
    if (-not $css.Contains($needle)) { throw "Missing generated Motion paint: $needle" }
}
foreach ($needle in @('panelAnimation', 'prefers-reduced-motion', 'aria-expanded')) {
    if (-not $build.Contains($needle)) { throw "Missing generated AMD Motion contract: $needle" }
}

& (Join-Path $KitRoot 'scripts/test-searchable-choice-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Canonical searchable-choice contract failed.' }
Write-Output 'PASS: EasyStud consumes Kit 0.4.80 searchable disclosure Motion without changing native values or commands.'
