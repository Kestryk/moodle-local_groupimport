[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) { throw "Missing required file: $relativePath" }
    return Get-Content -Raw -LiteralPath $path
}

function Assert-Contains([string]$label, [string]$text, [string]$needle) {
    if (-not $text.Contains($needle)) { throw "$label is missing: $needle" }
}

$source = Read-RequiredFile 'amd/src/course_manager.js'
$build = Read-RequiredFile 'amd/build/course_manager.min.js'

foreach ($needle in @(
    'const rehydrateParticipantMembershipDetails = root => {',
    "root.querySelectorAll('[data-easystud-group-id]').forEach(group => {",
    "root.querySelectorAll('[data-easystud-user][data-user-id]').forEach(user => {",
    "user.setAttribute('data-group-ids', groupids.join(','));",
    "user.setAttribute('data-grouping-ids', groupingids.join(','));",
    "user.setAttribute('data-user-detail', JSON.stringify(data));",
    'rehydrateParticipantMembershipDetails(root);'
)) { Assert-Contains 'Entity modal live-state source' $source $needle }

foreach ($needle in @(
    'data-user-detail',
    'data-grouping-ids',
    'rehydrateParticipantMembershipDetails'
)) { Assert-Contains 'Entity modal generated AMD' $build $needle }

if ($build -match '(?m)^\s*(?:import|export)\s') {
    throw 'Generated Course Manager contains a top-level ESM declaration.'
}
if ($build -notmatch '^define\(') {
    throw 'Generated Course Manager is not a canonical AMD define bundle.'
}

Write-Output 'EasyStud entity modal rehydration static contract passed.'
