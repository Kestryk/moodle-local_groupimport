$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$choiceSource = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/searchable_choices.js')
$managerSource = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
$choiceBuild = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/build/searchable_choices.min.js')
$managerBuild = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/build/course_manager.min.js')
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json

if ($manifest.version -ne '0.4.74') { throw "Expected Kit 0.4.74, found $($manifest.version)." }
foreach ($required in @('export const closeChoicesWithin', "container.querySelectorAll('select')", 'controls.get(select)')) {
    if (-not $choiceSource.Contains($required)) { throw "Missing choice lifecycle contract: $required" }
}
if ($managerSource -notmatch '(?s)else \{\s*closeChoicesWithin\(panel\);\s*setAdvancedFilterAccessibility\(panel, false\)') {
    throw 'More Filters collapse does not close nested choices before making the panel inert.'
}
if (-not $choiceBuild.Contains('closeChoicesWithin') -or -not $managerBuild.Contains('closeChoicesWithin')) {
    throw 'Generated AMD does not contain the nested choice closure contract.'
}
Write-Host 'PASS: More Filters closes active nested searchable choices before parent collapse.'
