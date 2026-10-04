param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$native = (Get-Content (Join-Path $root 'amd/src/motion.js') -Raw).Replace("`r`n", "`n").Trim()
$canonical = (Get-Content (Join-Path $KitRoot 'motion/amd/src/easyedu_motion.js') -Raw).Replace("`r`n", "`n")
$pattern = '(?s)/\*\*\n \* Disclose a framed Search/Add panel.*?(?=export const expand = )'
$helper = [regex]::Match($native, $pattern).Value
if (-not $helper -or $helper -cne [regex]::Match($canonical, $pattern).Value) {
    throw 'Canonical framed Motion helper drift.'
}
$base = 'aba231a'
$oldMotion = ((& git -C $root show "${base}:amd/src/motion.js") -join "`n").Trim()
if ($native.Replace($helper, '') -cne $oldMotion) { throw 'Legacy Motion changed beyond opt-in helper.' }
$oldController = ((& git -C $root show "${base}:amd/src/course_manager.js") -join "`n").Trim()
$adapter = @'
    // Canonical framed disclosure is opt-in: preserve accepted tree/card Motion.
    if (panel.matches('[data-easystud-group-member-search-panel], [data-easystud-container-search-panel], ' +
            '[data-easystud-group-email-panel], [data-easystud-grouping-groups-panel]')) {
        return Motion.disclosePanel(panel, open, {onComplete: () => requestGuideHighlightRefresh(root)});
    }
'@
$controller = (Get-Content (Join-Path $root 'amd/src/course_manager.js') -Raw).Replace("`r`n", "`n").Trim()
if ($controller.Replace($adapter.Replace("`r`n", "`n") + "`n", '') -cne $oldController) {
    throw 'Controller changed beyond exact opt-in adapter.'
}
foreach ($path in @('styles.css', 'templates/manage.mustache', 'amd/src/searchable_choices.js',
    'js/loading_state_bootstrap.js', 'js/admin_settings_loading.js', 'ajax.php', 'settings.php',
    'manage.php', 'index.php', 'classes/service/membership_transfer.php')) {
    if ((& git -C $root hash-object $path) -ne (& git -C $root rev-parse "${base}:$path")) {
        throw "Unexpected style/lifecycle/business change: $path"
    }
}
& (Join-Path $root 'tools/release/test-amd-runtime-format-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'AMD format gate failed.' }
Write-Output 'PASS exact shared opt-in helper/adapter; legacy Motion, styles and data commands preserved.'
