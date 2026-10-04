$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$markup = Get-Content -Raw -LiteralPath (Join-Path $root 'index.php')
$view = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/views/_mass-import.scss')
$foundation = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/easyedu/_foundation-classes.scss')
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json

foreach ($needle in @(
    '.easyedu-ui .easyedu-panel__header--compact-icon',
    'var(--easyedu-section-icon-size-compact) minmax(0, 1fr) auto',
    '.easyedu-ui .easyedu-icon-tile--compact',
    '@include panels.section-icon-tile($size: compact);'
)) {
    if (-not $foundation.Contains($needle)) {
        throw "Missing shared compact panel identity contract: $needle"
    }
}

if (($markup.Split('easyedu-panel__header--compact-icon').Count - 1) -ne 2 -or
        ($markup.Split('easyedu-icon-tile--compact').Count - 1) -ne 2) {
    throw 'Exactly the two main Mass Import panel identities must consume the compact public family.'
}
if ($markup -notmatch 'local-groupimport-import-fields__icon easyedu-icon-tile') {
    throw 'Automatic-identification artwork must retain the regular aligned icon tile.'
}

foreach ($needle in @(
    'grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);',
    '&-card--results > &-empty',
    'flex: 1 1 auto;',
    'min-block-size: 16rem;'
)) {
    if (-not $view.Contains($needle)) {
        throw "Missing Mass Import balance composition: $needle"
    }
}
if ($view -match 'grid-template-columns: minmax\(21rem, 0\.88fr\) minmax\(25rem, 1\.12fr\);') {
    throw 'Mass Import must not restore fixed track minima before the responsive breakpoint.'
}

if ($manifest.version -ne '0.4.81' -or
        $manifest.consumerSync.massImportBalance20261004.kitCommit -ne 'ab44599d543cc96b6cc23065ec508e147552893c') {
    throw 'The embedded Kit manifest does not pin the compact Mass Import source.'
}

Write-Output 'EasyStud Mass Import balance contract passed.'
