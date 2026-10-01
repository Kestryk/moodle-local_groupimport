param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    [string]$BaselineCss
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentMemberRowExtraction
$embedded = & git -C $root hash-object $pin.module
if ($LASTEXITCODE -ne 0 -or $embedded -ne $pin.moduleBlob) { throw 'Unpinned related-person module.' }
$canonical = & git -C $KitRoot hash-object $pin.module
if ($LASTEXITCODE -ne 0 -or $canonical -ne $embedded) { throw 'Canonical related-person module drift.' }
$structure = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
$expected = [ordered]@{
    '&-member' = '@include easyedu.related-person-row;'
    '&-member > .local-groupimport-easystud-selector' = '@include easyedu.related-person-selection-slot;'
    '&-member__name' = "@include easyedu.related-person-name;`n@include easyedu.related-person-name-layout;"
    '.local-groupimport-easystud-member__remove' = '@include easyedu.related-person-remove;'
}
foreach ($selector in $expected.Keys) {
    $match = [regex]::Match($structure, [regex]::Escape($selector) + '\s*\{([^}]+)\}')
    $actual = ($match.Groups[1].Value -replace '\s+', ' ').Trim()
    $recipe = ($expected[$selector] -replace '\s+', ' ').Trim()
    if (-not $match.Success -or $actual -cne $recipe) { throw "Consumer skin remains local: $selector" }
}
if ($BaselineCss) {
    # Existing public contract compares the ENTIRE stylesheet, not row subsets.
    & (Join-Path $PSScriptRoot 'test-student-card-header-contract.ps1') -KitRoot $KitRoot -BaselineCss $BaselineCss
}
Write-Output 'PASS: all related-person adapters are recipe-only and canonically pinned.'
