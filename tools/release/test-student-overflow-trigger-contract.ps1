param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    [Parameter(Mandatory = $true)][string]$BaselineCss
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/components/_card-actions.scss'
$local = Get-Content -Raw -LiteralPath (Join-Path $root $module)
$canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $module)
if ($local.Replace("`r`n", "`n") -cne $canonical.Replace("`r`n", "`n")) {
    throw 'Card actions source differs from canonical Kit.'
}
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
if ($source -notmatch '&-group__actions-toggle\s*\{\s*@include easyedu\.card-overflow-trigger;\s*\}') {
    throw 'The desktop card overflow adapter must not duplicate local paint.'
}
$responsive = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/responsive/_desktop.scss')
if (-not $responsive.Contains('@include easyedu.mobile-card-menu-trigger;')) {
    throw 'Responsive 44px composition must remain shared.'
}
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
$baseline = Get-Content -Raw -LiteralPath $BaselineCss
if ($css.Replace("`r`n", "`n") -cne $baseline.Replace("`r`n", "`n")) {
    throw 'Pure overflow extraction changed generated consumer CSS.'
}
Write-Output 'PASS: canonical card-overflow adapter; exact full CSS equality; responsive composition retained.'
