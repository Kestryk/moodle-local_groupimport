[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$KitRoot, [switch]$RoleDensitySuccessor)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
foreach ($file in @('scss/easyedu/_tokens.scss','scss/easyedu/components/_loading.scss',
    'scss/easyedu/components/_animations.scss')) {
    if ((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $file)) {
        throw "Canonical loading drift: $file"
    }
}
$pins = Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
foreach ($entry in $pins.consumerSync.studentSoftLoading20261003.modules.PSObject.Properties) {
    if ((& git -C $root hash-object $entry.Name) -ne $entry.Value) { throw "Soft loading pin drift: $($entry.Name)" }
}
foreach ($file in @('amd/src/course_manager.js','amd/build/course_manager.min.js','amd/src/motion.js',
    'js/loading_state_bootstrap.js','js/admin_settings_loading.js','templates/manage.mustache',
    'index.php','settings.php','ajax.php','classes/service/membership_transfer.php')) {
    if ($RoleDensitySuccessor -and $file -in @('amd/src/course_manager.js', 'amd/build/course_manager.min.js')) {
        $pin = $pins.consumerSync.studentRoleDensity20261003.modules.PSObject.Properties[$file].Value
        if ((& git -C $root hash-object $file) -ne $pin) { throw "Role-density successor asset drift: $file" }
        if ($file -eq 'amd/src/course_manager.js') {
            $actual = (Get-Content -LiteralPath (Join-Path $root $file) -Raw).Replace("`r`n", "`n").Trim()
            $expected = ((& git -C $root show "dce0c39e88c1512809df28daba5074dd89081600:$file") -join "`n").Trim()
            $patch = "    // Keep quick role chips for a short catalogue; dense catalogues reuse Kit search.`n" +
                "    const roleChoiceCount = Array.from(select.options).filter(option => option.value && !option.disabled).length;`n" +
                "    const shouldFallback = window.innerWidth < 768 || roleChoiceCount > 6;"
            if (!$actual.Contains($patch) -or $actual.Replace($patch, '    const shouldFallback = window.innerWidth < 768;') -cne $expected) {
                throw 'Role-density successor changed more than its exact mode-selection patch.'
            }
        }
        continue
    }
    if ((& git -C $root hash-object $file) -ne (& git -C $root rev-parse "dce0c39e88c1512809df28daba5074dd89081600:$file")) {
        throw "Native business/markup/Motion/loading lifecycle drift: $file"
    }
}
$motion = Get-Content -LiteralPath (Join-Path $root 'scss/easyedu/components/_animations.scss') -Raw
$previous = (& git -C $root show 'dce0c39e88c1512809df28daba5074dd89081600:scss/easyedu/components/_animations.scss') -join "`n"
$allowed = '(?s)    @keyframes easyedu-skeleton-(?:shimmer|appear)\s*\{.*?\n    \}\n(?:\n)*'
if (([regex]::Replace($motion.Replace("`r`n","`n"),$allowed,'').Trim()) -cne
    ([regex]::Replace($previous,$allowed,'').Trim())) {
    throw 'Non-Skeleton motion keyframes changed.'
}
& (Join-Path $KitRoot 'scripts/test-loading-contract.ps1')
& (Join-Path $root 'tools/release/test-admin-settings-loading-contract.ps1')
& (Join-Path $root 'tools/release/test-navigation-skeleton-contract.ps1')
Write-Output 'PASS: canonical quiet loading; native lifecycle, business and non-Skeleton Motion retained (explicit role-density successor when selected).'
