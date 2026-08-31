[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$pluginRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$sourcePath = Join-Path $pluginRoot 'amd\src\course_manager.js'
$buildPath = Join-Path $pluginRoot 'amd\build\course_manager.min.js'

foreach ($path in @($sourcePath, $buildPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $path"
    }
}

$source = Get-Content -Raw -LiteralPath $sourcePath
$build = Get-Content -Raw -LiteralPath $buildPath

$requiredSource = @(
    'const applyContainerGroupSearch = (root, options = {}) => {',
    'const applyGroupMemberSearch = (root, options = {}) => {',
    'scheduleResponsiveUiRefresh(root, options);',
    'applyContainerGroupSearch(root, {pagination: false});',
    'applyGroupMemberSearch(root, {pagination: false});'
)

foreach ($needle in $requiredSource) {
    if (-not $source.Contains($needle)) {
        throw "Nested search focus source contract is missing: $needle"
    }
}

if (-not $build.StartsWith('define("local_groupimport/course_manager"', [System.StringComparison]::Ordinal)) {
    throw 'Generated Course Manager is not a canonical AMD define bundle.'
}
if ($build -match '(?m)^\s*(?:import|export)\s') {
    throw 'Generated Course Manager contains a top-level ESM declaration.'
}

foreach ($selector in @(
    'data-easystud-container-group-search',
    'data-easystud-group-member-search'
)) {
    if (-not $build.Contains($selector)) {
        throw "Generated Course Manager is missing nested search selector: $selector"
    }
}

$paginationBypasses = [regex]::Matches($build, 'pagination:!1').Count
if ($paginationBypasses -lt 7) {
    throw 'Generated Course Manager does not contain both nested-search pagination bypasses.'
}

Write-Output 'EasyStud nested search focus static contract passed.'
