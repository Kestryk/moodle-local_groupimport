param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
foreach ($path in @('scss/easyedu/_tokens.scss', 'scss/easyedu/components/_loading.scss',
    'scss/easyedu/components/_animations.scss')) {
    if ((& git -C $root hash-object $path) -ne (& git -C $KitRoot hash-object $path)) {
        throw "Canonical loading drift: $path"
    }
}
$baseline = '0b21bcd'
foreach ($path in @('amd/src/course_manager.js', 'amd/build/course_manager.min.js', 'amd/src/motion.js',
    'js/loading_state_bootstrap.js', 'js/admin_settings_loading.js', 'index.php', 'settings.php',
    'manage.php', 'ajax.php', 'classes/service/membership_transfer.php')) {
    if ((& git -C $root hash-object $path) -ne (& git -C $root rev-parse "${baseline}:$path")) {
        throw "Unexpected native lifecycle/business/Motion change: $path"
    }
}
$actual = (Get-Content (Join-Path $root 'templates/manage.mustache') -Raw).Replace("`r`n", "`n").Trim()
$original = ((& git -C $root show "${baseline}:templates/manage.mustache") -join "`n").Trim()
$headerActions = '            <div class="local-groupimport-easystud__loading-header-actions">' + "`n" +
    '                <span class="local-groupimport-easystud__loading-surface local-groupimport-easystud__loading-header-action"></span>' + "`n" +
    '                <span class="local-groupimport-easystud__loading-surface local-groupimport-easystud__loading-header-action"></span>' + "`n" +
    '            </div>' + "`n"
$expected = $original.Replace($headerActions, '').Replace(
    '<div class="local-groupimport-easystud__loading-structure-tools">',
    '<div class="local-groupimport-easystud__loading-search-filter-region">').Replace(
    '<div class="local-groupimport-easystud__loading-view-toggle">',
    '<div class="local-groupimport-easystud__loading-view-toggle{{^showcompleteview}} local-groupimport-easystud__loading-view-toggle--two{{/showcompleteview}}">')
if ($actual -cne $expected) { throw 'Template changed beyond three bounded Skeleton adaptations.' }
& (Join-Path $KitRoot 'scripts/test-loading-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Kit loading contract failed.' }
Write-Output 'PASS: exact Skeleton-only template successor; canonical loading and native lifecycle/Motion retained.'
