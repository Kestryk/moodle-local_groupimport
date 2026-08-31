[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) { throw "Missing required file: $relativePath" }
    return Get-Content -Raw -LiteralPath $path
}

function Assert-Contains([string]$label, [string]$text, [string]$needle) {
    if (-not $text.Contains($needle)) { throw "$label is missing: $needle" }
}

$modal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$typography = Read-RequiredFile 'scss/components/_typography.scss'
$manager = Read-RequiredFile 'amd/src/course_manager.js'
$managerBuild = Read-RequiredFile 'amd/build/course_manager.min.js'
$styles = Read-RequiredFile 'styles.css'

# Participant's native-profile action is the source reference for the shared
# footer geometry used by Group and Grouping.
foreach ($needle in @(
    '&-settings-modal__native {',
    'border-top: 1px solid #e5edf3;',
    'margin-top: 0.72rem;',
    'padding-top: 0.72rem;',
    '&-settings-modal__native > .btn {',
    '@include easyedu.action-button(small);',
    'min-height: 2.25rem;'
)) { Assert-Contains 'Participant action reference' $modal $needle }

foreach ($needle in @(
    'grid-template-columns: repeat(2, minmax(0, 1fr));',
    '@include easyedu.type-caption;',
    '@include easyedu.type-body;',
    '&-settings-modal__list-item-chip',
    'font-weight: var(--easyedu-font-weight-semibold);'
)) { Assert-Contains 'Group/Grouping semantic parity' $modal $needle }

foreach ($needle in @(
    '<button type="button" class="btn p-0 icon-no-margin ',
    'local-groupimport-easystud-settings-modal__help',
    'aria-label="' ,
    'data-easystud-hover-help='
)) { Assert-Contains 'Local help control' $manager $needle }
if ($manager -match '(?im)^\s*import\s+.*(?:ccb|course-banner|slideshow_admin)') {
    throw 'EasyStud help control must not import or depend on CCB runtime code.'
}

foreach ($needle in @(
    '&-card__description,',
    '&-fields__header p,',
    '&-empty p,',
    '&-preview__notice p,',
    '&-preview__reimport-alert p,',
    '&-drop__panel p,',
    '@include easyedu.type-caption;',
    'font-size: var(--easyedu-font-size-control);'
)) { Assert-Contains 'Mass Import operational copy' $typography $needle }
Assert-Contains 'Accepted Mass Import introduction' $typography '&__intro'

foreach ($needle in @(
    'local-groupimport-easystud-settings-modal__help',
    'local-groupimport-easystud-settings-modal__native',
    'local-groupimport-import-card__description'
)) {
    Assert-Contains 'Generated stylesheet' $styles $needle
}
foreach ($needle in @('data-easystud-hover-help=', 'local-groupimport-easystud-settings-modal__help')) {
    Assert-Contains 'Generated AMD' $managerBuild $needle
}

Write-Output 'EasyStud waves 1-3 RF4/RF5 static contract passed.'
