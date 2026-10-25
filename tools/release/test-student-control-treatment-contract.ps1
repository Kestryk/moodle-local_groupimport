param([Parameter(Mandatory = $true)][string]$KitRoot, [string]$BaselineCss)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/components/_control-treatment.scss'
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$blob = & git -C $root hash-object $module
if ($LASTEXITCODE -ne 0 -or $blob -ne $manifest.consumerSync.studentControlTreatment.moduleBlob) {
    throw 'Utility-control source differs from its pinned canonical blob.'
}
$local = Get-Content -Raw -LiteralPath (Join-Path $root $module)
$canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $module)
if ($local.Replace("`r`n", "`n") -cne $canonical.Replace("`r`n", "`n")) {
    throw 'Embedded utility-control source differs from the canonical Kit.'
}
$adapter = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_control-typography.scss')
foreach ($recipe in @('control-regular-type', 'control-count-type', 'action-text-treatment')) {
    if (-not $adapter.Contains("@include easyedu.$recipe")) { throw "Missing Kit recipe: $recipe" }
}
if ($adapter -match 'font-family\s*:|font-weight\s*:|text-decoration\s*:|!important') {
    throw 'The consumer adapter must not own visual declarations or host priority.'
}
if ($BaselineCss) {
    $before = (Get-FileHash -LiteralPath $BaselineCss -Algorithm SHA256).Hash
    $after = (Get-FileHash -LiteralPath (Join-Path $root 'styles.css') -Algorithm SHA256).Hash
    if ($before -cne $after) { throw 'The source-preserving extraction changed generated CSS.' }
}
Write-Output 'PASS: canonical source parity, selector-only adapter and optional full CSS equality.'
