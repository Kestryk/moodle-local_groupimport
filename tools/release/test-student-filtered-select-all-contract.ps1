$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
$build = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/build/course_manager.min.js')
# T055: the course manager code lives in amd/src/local/cm (and amd/build/local/cm); read it with course_manager.js.
$source = $source + "`n" + ((Get-ChildItem -LiteralPath (Join-Path $root 'amd/src/local/cm') -Filter '*.js' | Sort-Object Name | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n")
$build = $build + "`n" + ((Get-ChildItem -LiteralPath (Join-Path $root 'amd/build/local/cm') -Filter '*.min.js' | Sort-Object Name | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n")

foreach ($required in @(
    'const isItemFilteredOut = item =>',
    "item.getAttribute('data-easystud-catalog-filter-hidden') === '1'",
    "item.getAttribute('data-easystud-catalog-search-hidden') === '1'",
    "item.getAttribute('data-easystud-structure-search-hidden') === '1'",
    "item.getAttribute('data-easystud-grouping-filter-hidden') === '1'",
    'if (!item.matches(config.selector) || isItemFilteredOut(item))',
    'if (!isItemFilteredOut(item))',
    'if (deselect && hasActiveListFilters(root, list))',
    'clearSelection(root, type)'
)) {
    if (-not $source.Contains($required)) { throw "Missing filtered result contract: $required" }
}
if (-not $source.Contains("grouping.setAttribute('data-easystud-grouping-filter-hidden', filterhidden ? '1' : '0')")) {
    throw 'Grouping filters have no durable exclusion marker for multi-page selection.'
}
if (-not $build.Contains('isItemFilteredOut')) {
    throw 'Generated course_manager AMD does not contain the filtered selection contract.'
}
Write-Host 'PASS: filtered deselect clears stale global scope and select-results excludes filtered-out entities.'
