param([Parameter(Mandatory = $true)][string]$KitRoot, [string]$BaselineCss)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/components/_menus.scss'
$canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $module)
$embedded = Get-Content -Raw -LiteralPath (Join-Path $root $module)
if ($canonical.Replace("`r`n", "`n") -cne $embedded.Replace("`r`n", "`n")) {
    throw 'Embedded menu recipes differ from canonical source.'
}
$adapter = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
foreach ($recipe in @('list-sort-trigger', 'list-sort-option')) {
    if (-not $adapter.Contains("@include easyedu.$recipe;")) { throw "Missing adapter: $recipe" }
}
$trigger = [regex]::Match($adapter, '&-dropdown__button\s*\{([^{}]*)\}').Groups[1].Value
if ($trigger -match 'font-|padding:|color:|border:|transition:') {
    throw 'Sort trigger must remain a selector-only adapter.'
}
if ($BaselineCss) {
    if ((Get-FileHash -LiteralPath $BaselineCss).Hash -cne (Get-FileHash -LiteralPath (Join-Path $root 'styles.css')).Hash) {
        throw 'Source-preserving extraction changed compiled CSS.'
    }
}
Write-Output 'PASS: canonical source, selector-only sort adapter and optional full CSS equality.'
