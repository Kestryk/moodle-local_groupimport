[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pins = Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
foreach ($entry in $pins.consumerSync.studentRoleDensity20261003.modules.PSObject.Properties) {
    if ((& git -C $root hash-object $entry.Name) -ne $entry.Value) { throw "Role-density pin drift: $($entry.Name)" }
}
foreach ($pair in @(
    @('amd/src/searchable_choices.js','choices/searchable_choices.js'),
    @('scss/easyedu/components/_searchable-choices.scss','scss/easyedu/components/_searchable-choices.scss')
)) {
    if ((& git -C $root hash-object $pair[0]) -ne (& git -C $KitRoot hash-object $pair[1])) { throw 'Canonical choice drift.' }
}
foreach ($file in @('styles.css','templates/manage.mustache','manage.php','ajax.php',
    'classes/service/course_structure.php','classes/service/membership_transfer.php','amd/src/motion.js')) {
    if ((& git -C $root hash-object $file) -ne (& git -C $root rev-parse "c57d325d72dfe6d87a8b230caf60de0f7b3eb18a:$file")) {
        throw "Role-density paint/business/Motion drift: $file"
    }
}
& node (Join-Path $PSScriptRoot 'test-role-density-mode.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Role-density mode unit check failed.' }
& (Join-Path $PSScriptRoot 'test-student-soft-loading-contract.ps1') -KitRoot $KitRoot -RoleDensitySuccessor
& (Join-Path $KitRoot 'scripts/test-searchable-choice-contract.ps1')
Write-Output 'PASS: dense roles reuse the unchanged Kit; exact mode-only successor, native data/predicate/Motion and soft loading retained.'
