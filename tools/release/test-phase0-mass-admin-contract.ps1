$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$massImport = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\views\_mass-import.scss')
$administration = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\views\_admin-settings.scss')
$lateTypography = @(
    Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_typography.scss')
    Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_typography-identity.scss')
) -join "`n"
$kitTypography = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\components\_typography.scss')
$kitManifest = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'easyedu-kit-docs\easyedu-kit.json') | ConvertFrom-Json

foreach ($needle in @(
    '@include easyedu.type-page-title;',
    '@include easyedu.type-control-label;',
    '@include easyedu.type-caption;',
    '@include easyedu.section-icon-tile',
    '@include easyedu.data-table-surface;',
    '@include easyedu.action-row'
)) {
    if (-not $massImport.Contains($needle)) {
        throw "Mass Import is missing the direct Kit contract: $needle"
    }
}

foreach ($needle in @(
    '@include easyedu.type-ui-base;',
    '@include easyedu.type-section-title;',
    '@include easyedu.section-icon-tile',
    '@include easyedu.multi-select-list;',
    '@include easyedu.native-select-control;',
    '@include easyedu.admin-form-actions(center);'
)) {
    if (-not $administration.Contains($needle)) {
        throw "Administration is missing the direct Kit contract: $needle"
    }
}

if ($lateTypography -match 'local-groupimport-import|page-admin-setting-local_groupimport') {
    throw 'Mass Import and Administration must not be restyled by late compatibility typography layers.'
}

if (($massImport + "`n" + $administration) -match 'font-weight:\s*[0-9]' -or
        ($massImport + "`n" + $administration) -match 'letter-spacing:\s*-') {
    throw 'Mass Import and Administration must use the shared weight and spacing contracts.'
}

if ($kitTypography -match '@mixin type-page-identity') {
    throw 'The embedded Kit must use type-page-title directly.'
}

if ($kitManifest.consumerSync.sourceCommit -ne '09f04aa08300cf6da300ed8a7fd4941bdbba98ef') {
    throw 'The embedded Kit manifest does not pin the canonical Phase 0 source commit.'
}

if ($kitManifest.consumerSync.fullTreeIdentical -ne $false) {
    throw 'Phase 0 must preserve and disclose the deferred embedded-tree drift.'
}

Write-Output 'EasyStud Phase 0 Mass Import and Administration contract passed.'
