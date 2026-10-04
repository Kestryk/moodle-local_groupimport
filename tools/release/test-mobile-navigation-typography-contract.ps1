[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$KitRoot,
    [Parameter(Mandatory = $true)][string]$BaselineCssPath)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$navigation = Get-Content -LiteralPath (Join-Path $root 'scss/easyedu/components/_navigation.scss') -Raw
foreach ($role in @('type-navigation-compact-destination', 'type-navigation-compact-guide-label')) {
    if (!$navigation.Contains('@include typography.' + $role)) {
        throw "Compact navigation does not consume the shared role: $role"
    }
}
$relative = 'scss/easyedu/components/_typography.scss'
if ((& git -C $root hash-object $relative) -ne (& git -C $KitRoot hash-object $relative)) {
    throw 'Embedded Typography differs from the canonical Kit source.'
}
if ((Get-FileHash -LiteralPath $BaselineCssPath).Hash -ne
    (Get-FileHash -LiteralPath (Join-Path $root 'styles.css')).Hash) {
    throw 'Typography extraction changed generated CSS.'
}
Write-Output 'PASS: shared compact Navigation roles, canonical Typography and entire CSS identity.'
