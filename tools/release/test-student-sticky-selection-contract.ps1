[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if ((& git -C $root hash-object 'scss/easyedu/components/_panels.scss') -ne
    (& git -C $KitRoot hash-object 'scss/easyedu/components/_panels.scss')) {
    throw 'Consumer sticky selection primitive drifted from canonical Kit.'
}
$layout = Get-Content -LiteralPath (Join-Path $root 'scss/components/_layout.scss') -Raw
$template = Get-Content -LiteralPath (Join-Path $root 'templates/manage.mustache') -Raw
$css = Get-Content -LiteralPath (Join-Path $root 'styles.css') -Raw
foreach ($needle in @(
    '&--has-selection:not(&--responsive-workspace)',
    'padding-bottom: 5rem'
)) {
    if (!$layout.Contains($needle)) { throw "Desktop scroll clearance missing: $needle" }
}
if (!$template.Contains('data-easystud-clear-selection-frame="1"') -or
    !$template.Contains('data-easystud-clear-all-selection="1"')) {
    throw 'Selection recovery hooks are missing.'
}
if (!$template.Contains('btn btn-outline-secondary btn-sm foundation-selection-action local-groupimport-easystud__clear-selection')) {
    throw 'Sticky Clear selection must consume the canonical neutral selection-action skin.'
}
foreach ($needle in @('inset-inline-start: 50%', 'transform: translateX(-50%)', 'border-radius: 999px')) {
    if (!$css.Contains($needle)) { throw "Generated selection capsule missing: $needle" }
}
Write-Output 'PASS: Kit-linked centered selection capsule, native hooks and desktop scroll clearance.'
