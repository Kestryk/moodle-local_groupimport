[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = Get-Content -LiteralPath (Join-Path $root 'amd/src/course_manager.js') -Raw
$build = Get-Content -LiteralPath (Join-Path $root 'amd/build/course_manager.min.js') -Raw
$manage = Get-Content -LiteralPath (Join-Path $root 'manage.php') -Raw
$template = Get-Content -LiteralPath (Join-Path $root 'templates/manage.mustache') -Raw
$spec = Get-Content -LiteralPath (Join-Path $root 'tools/playwright/student-group-member-search-preview.spec.js') -Raw

foreach ($needle in @(
    'ensureGroupMemberSearchControls',
    'data-easystud-group-member-search-toggle',
    'data-easystud-group-member-search-panel',
    'easyedu-search-field',
    'applyGroupMemberSearch(root, {pagination: false})',
    'data-easystud-member-search-hidden',
    'data-easystud-member-filter-empty'
)) {
    if (!$source.Contains($needle)) { throw "Group member search source contract missing: $needle" }
}
if (!$manage.Contains("'group-search-members'") -or !$manage.Contains("get_string('searchparticipantslabel'")) {
    throw 'Responsive context menu does not expose the existing member-search label.'
}
foreach ($selector in @('data-easystud-group-member-search-cancel', 'data-easystud-container-search-cancel')) {
    if (!$source.Contains('easyedu-button easyedu-button--secondary" ' + $selector)) {
        throw "Generated card search Cancel does not use the Kit secondary action: $selector"
    }
}
if (([regex]::Matches($template, 'class="easyedu-button easyedu-button--secondary" data-easystud-container-search-cancel=')).Count -ne 2) {
    throw 'Both server-rendered Grouping search Cancel actions must use the Kit secondary action.'
}
foreach ($needle in @(
    'data-easystud-group-member-search-toggle',
    'data-easystud-group-member-search-panel',
    'easyedu-search-field',
    'data-easystud-member-search-hidden'
)) {
    if (!$build.Contains($needle)) { throw "Generated group member search contract missing: $needle" }
}
foreach ($needle in @(
    "for (const width of [1600, 768, 390])",
    "await expect(input).toBeFocused()",
    "expect(blocked, 'Search and Cancel must not invoke a business command').toEqual([])"
)) {
    if (!$spec.Contains($needle)) { throw "Managed preview scenario missing: $needle" }
}
if (!$build.StartsWith('define("local_groupimport/course_manager"', [System.StringComparison]::Ordinal)) {
    throw 'Generated Course Manager is not a canonical AMD define bundle.'
}
Write-Output 'PASS: group member search uses the canonical field, card-local filtering and non-mutating preview gate.'
