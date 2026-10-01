param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/components/_overlays.scss'
$canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $module)
$embedded = Get-Content -Raw -LiteralPath (Join-Path $root $module)
if ($canonical.Replace("`r`n", "`n") -cne $embedded.Replace("`r`n", "`n")) {
    throw 'Embedded drag recipes differ from canonical source.'
}
$adapter = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_interaction.scss')
foreach ($needle in @('@include drop-affordance;', 'border: 1.5px solid var(--easyedu-control-focus-border)',
    'background-size: $size * 0.5 $size * 0.5')) {
    if (-not $canonical.Contains($needle)) { throw "Missing flat affordance contract: $needle" }
}
foreach ($recipe in @('drag-preview-moving-outline', 'drag-preview-moving-badge', 'drag-preview-count-placement')) {
    if (-not $adapter.Contains("@include easyedu.$recipe;")) { throw "Missing shared adapter: $recipe" }
}
if ($adapter -match '#203244|background: linear-gradient|right: -0.65rem') {
    throw 'Legacy local drag-preview skin remains.'
}
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
foreach ($needle in @('if (items.length > 1)', "badge.textContent = '+' + (items.length - 1)",
    "preview.setAttribute('aria-hidden', 'true')", "preview.setAttribute('inert', '')",
    "data-easystud-drag-moving-label", "theme.getPropertyValue(property)")) {
    if (-not $source.Contains($needle)) { throw "Missing drag invariant: $needle" }
}
Write-Output 'PASS: canonical drag source parity, shared flair, portal context and multiple-only stack invariants.'
