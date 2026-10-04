param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$base = 'fa3cca4'
foreach ($pair in @(@('amd/src/searchable_choices.js', 'choices/searchable_choices.js'),
    @('scss/easyedu/components/_searchable-choices.scss', 'scss/easyedu/components/_searchable-choices.scss'))) {
    if ((& git -C $root hash-object $pair[0]) -ne (& git -C $KitRoot hash-object $pair[1])) {
        throw "Canonical choice drift: $($pair[0])"
    }
}
$source = (Get-Content (Join-Path $root 'amd/src/course_manager.js') -Raw -Encoding UTF8).Replace("`r`n", "`n").Trim()
$old = ((& git -C $root show "${base}:amd/src/course_manager.js") -join "`n").Trim()
if ($source.Replace('enhanceSelect(destination, chooserLabels(), {motion: Motion})',
    'enhanceSelect(destination, chooserLabels())') -cne $old) {
    throw 'Controller changed beyond the exact destination Motion opt-in.'
}
$css = (Get-Content (Join-Path $root 'styles.css') -Raw -Encoding UTF8).Replace("`r`n", "`n").Trim()
$oldCss = ((& git -C $root show "${base}:styles.css") -join "`n").Trim()
$rule = ".easyedu-ui .easyedu-searchable-choice--framed {`n  --easyedu-choice-disclosure-duration: 360ms;`n}`n`n"
if (-not $css.Contains($rule) -or $css.Replace($rule, '') -cne $oldCss) {
    throw 'Compiled CSS changed beyond the canonical framed-choice timing rule.'
}
foreach ($file in @('amd/src/motion.js', 'templates/manage.mustache', 'ajax.php', 'settings.php',
    'manage.php', 'index.php', 'classes/service/membership_transfer.php', 'js/loading_state_bootstrap.js')) {
    if ((& git -C $root hash-object $file) -ne (& git -C $root rev-parse "${base}:$file")) {
        throw "Unexpected accepted Motion/template/business change: $file"
    }
}
& (Join-Path $root 'tools/release/test-student-searchable-choice-motion-contract.ps1') -KitRoot $KitRoot
& (Join-Path $root 'tools/release/test-amd-runtime-format-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'AMD format check failed.' }
& node (Join-Path $root 'tools/release/test-choice-amd-exports.js')
if ($LASTEXITCODE -ne 0) { throw 'Generated choice exports failed.' }
Write-Output 'PASS canonical choice opt-in; complete other CSS, accepted Motion and commands preserved.'
