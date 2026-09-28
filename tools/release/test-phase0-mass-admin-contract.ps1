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

# Git blob hashes compare normalized source, independently of checkout CRLF.
$canonicalModules = @{
    'scss/easyedu/_data-classes.scss' = '21c27c0d91cbe103e4fb0a0fcf38cae80d9f5b50'
    'scss/easyedu/_foundation-classes.scss' = '8cd2f7a80c92279891bf0924a454c44dd331aa7f'
    'scss/easyedu/adapters/_moodle-file-deposit.scss' = '71cfa861522e300ea0db555b8ff74e2a406a257a'
}
foreach ($path in $canonicalModules.Keys) {
    $actual = & git -C $pluginRoot hash-object $path
    if ($LASTEXITCODE -ne 0 -or $actual -ne $canonicalModules[$path]) {
        throw "Embedded Kit module diverges from the canonical source: $path"
    }
}

foreach ($needle in @(
    '@include easyedu.type-control-label;',
    '@include easyedu.type-caption;',
    '@include easyedu.action-row'
)) {
    if (-not $massImport.Contains($needle)) {
        throw "Mass Import is missing the direct Kit contract: $needle"
    }
}

foreach ($needle in @(
    '@include easyedu.type-ui-base;',
    '@include easyedu.type-panel-title;',
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

if ($kitManifest.consumerSync.sourceCommit -notmatch '^[0-9a-f]{40}$') {
    throw 'The embedded Kit manifest does not pin the canonical Phase 0 source commit.'
}

$markup = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'index.php')
if (-not $markup.Contains('table-reboot easyedu-data-table')) {
    throw 'Kit tables must opt out of Moodle automatic table decoration.'
}
foreach ($class in @('easyedu-ui', 'easyedu-panel__title', 'easyedu-information', 'easyedu-tag', 'easyedu-empty')) {
    if (-not $markup.Contains($class)) { throw "Missing shared class: $class" }
}
if ($massImport -match '\.fp-btn-choose|\.filepicker-container|\.easyedu-file-deposit') {
    throw 'File deposit presentation must live in the canonical Kit adapter, not the plugin view.'
}

if ($kitManifest.consumerSync.fullTreeIdentical -ne $false) {
    throw 'Phase 0 must preserve and disclose the deferred embedded-tree drift.'
}

Write-Output 'EasyStud Phase 0 Mass Import and Administration contract passed.'
