[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $relativePath"
    }
    return Get-Content -Raw -LiteralPath $path
}

function Assert-Contains([string]$label, [string]$text, [string]$needle) {
    if (-not $text.Contains($needle)) {
        throw "$label is missing contract text: $needle"
    }
}

$identity = Read-RequiredFile 'scss/components/_typography-identity.scss'
$modal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$mass = Read-RequiredFile 'scss/components/_typography.scss'
$manager = Read-RequiredFile 'amd/src/course_manager.js'
$managerBuild = Read-RequiredFile 'amd/build/course_manager.min.js'
$styles = Read-RequiredFile 'styles.css'

Assert-Contains 'Administration section role' $identity '@include easyedu.type-section-title;'
Assert-Contains 'Administration subordinate field role' $identity '.local-groupimport-admin-settings__field-card h4 {'
Assert-Contains 'Administration subordinate field role' $identity '@include easyedu.type-control-label;'
Assert-Contains 'Administration subordinate title casing' $identity 'text-transform: none;'

foreach ($needle in @(
    'local-groupimport-easystud-settings-modal__disclosure-chevron',
    'local-groupimport-easystud-settings-modal__list-title',
    'local-groupimport-easystud-detail__list-chevron',
    'local-groupimport-easystud-detail__list-title'
)) {
    Assert-Contains 'Entity modal JavaScript' $manager $needle
    Assert-Contains 'Generated entity modal AMD' $managerBuild $needle
}

if ($manager -notmatch '(?s)<summary>.*?settings-modal__disclosure-chevron.*?settings-modal__list-title.*?<strong>') {
    throw 'Group/Grouping disclosure chevron must precede its title and count.'
}
if ($manager -notmatch '(?s)<summary>.*?detail__list-chevron.*?detail__list-title.*?detail__list-summary-end') {
    throw 'Participant disclosure chevron must precede its title and count.'
}

foreach ($needle in @(
    'grid-template-columns: auto minmax(0, 1fr) auto auto;',
    'grid-template-columns: auto minmax(0, 1fr) auto;',
    '@include easyedu.type-caption;',
    'font-weight: var(--easyedu-font-weight-regular);',
    '@include easyedu.toggle-check;',
    'gap: 0.38rem;'
)) {
    Assert-Contains 'Entity modal source' $modal $needle
}

Assert-Contains 'Mass Import compact nested baseline' $mass '&-card,'
Assert-Contains 'Mass Import compact nested baseline' $mass 'font-size: var(--easyedu-font-size-control);'
Assert-Contains 'Mass Import intro-navigation gap' $mass '&__header > .local-groupimport-import-navigation {'
Assert-Contains 'Mass Import intro-navigation gap' $mass 'margin-top: 1rem;'

foreach ($needle in @(
    '.local-groupimport-easystud-settings-modal__list-title',
    '.local-groupimport-easystud-detail__list-title',
    '.local-groupimport-import__header > .local-groupimport-import-navigation'
)) {
    Assert-Contains 'Generated stylesheet' $styles $needle
}

Write-Output 'EasyStud waves 1-3 RF3 corrective contract passed.'
