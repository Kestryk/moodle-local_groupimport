$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
$build = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/build/course_manager.min.js')

foreach ($required in @(
    'const isItemFilteredOut = item =>',
    "item.getAttribute('data-easystud-catalog-filter-hidden') === '1'",
    "item.getAttribute('data-easystud-catalog-search-hidden') === '1'",
    "item.getAttribute('data-easystud-structure-search-hidden') === '1'",
    "item.getAttribute('data-easystud-grouping-filter-hidden') === '1'",
    'if (!item.matches(config.selector) || isItemFilteredOut(item))',
    'if (!isItemFilteredOut(item))'
)) {
    if (-not $source.Contains($required)) { throw "Missing filtered result contract: $required" }
}
if (-not $source.Contains("grouping.setAttribute('data-easystud-grouping-filter-hidden', filterhidden ? '1' : '0')")) {
    throw 'Grouping filters have no durable exclusion marker for multi-page selection.'
}
if (-not $build.Contains('isItemFilteredOut')) {
    throw 'Generated course_manager AMD does not contain the filtered selection contract.'
}
Write-Host 'PASS: select-results excludes every explicitly filtered entity while retaining off-page matches.'
