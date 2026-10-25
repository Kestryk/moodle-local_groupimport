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
$admin = Read-RequiredFile 'scss/views/_admin-settings.scss'
$modal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$structure = Read-RequiredFile 'scss/components/_structure.scss'
$mass = Read-RequiredFile 'scss/components/_typography.scss'
$massView = Read-RequiredFile 'scss/views/_mass-import.scss'
$manager = Read-RequiredFile 'amd/src/course_manager.js'
$managerBuild = Read-RequiredFile 'amd/build/course_manager.min.js'
$manage = Read-RequiredFile 'manage.php'
$index = Read-RequiredFile 'index.php'
$english = Read-RequiredFile 'lang/en/local_groupimport.php'
$french = Read-RequiredFile 'lang/fr/local_groupimport.php'
$styles = Read-RequiredFile 'styles.css'

Assert-Contains 'Administration typography source' $identity '#adminsettings {'
if ($identity -match '#page-admin-setting-local_groupimport\s*\{\s*@include easyedu\.type-ui-base;') {
    throw 'Administration typography must not cascade from the complete Moodle page root.'
}
Assert-Contains 'Native multiselect preservation' $admin 'select[name="s_local_groupimport_alloweduserfields[]"]'

foreach ($needle in @(
    'margin: 0 !important;',
    'data-easystud-detail-list-state',
    'data-easystud-settings-list-state',
    'local-groupimport-easystud-detail__list-chevron',
    'local-groupimport-easystud-settings-modal__disclosure-chevron',
    'align-items: start;',
    'min-height: 2.5rem;'
)) {
    Assert-Contains 'Entity modal source' ($modal + $manager) $needle
}

foreach ($needle in @(
    'const bindAnimatedDetails =',
    "labels.groupdetails || 'Group details'",
    "labels.groupingdetails || 'Grouping details'",
    "labels.pluginname || 'EasyStud'",
    "bindAnimatedDetails(details, content, 'data-easystud-settings-list-state')",
    "bindAnimatedDetails(details, content, 'data-easystud-detail-list-state')"
)) {
    Assert-Contains 'Entity modal JavaScript' $manager $needle
}

foreach ($needle in @(
    'bindAnimatedDetails',
    'data-easystud-detail-list-state',
    'data-easystud-settings-list-state',
    'Group details',
    'Grouping details'
)) {
    Assert-Contains 'Generated entity modal AMD' $managerBuild $needle
}

Assert-Contains 'English Group details label' $english "`$string['groupdetails'] = 'Group details';"
Assert-Contains 'English Grouping details label' $english "`$string['groupingdetails'] = 'Grouping details';"
Assert-Contains 'French Group details label' $french "`$string['groupdetails'] = 'Détails du groupe';"
Assert-Contains 'French Grouping details label' $french "`$string['groupingdetails'] = 'Détails du groupement';"
Assert-Contains 'Server detail labels' $manage "'pluginname' => get_string('pluginname', 'local_groupimport')"

Assert-Contains 'History metadata spacing' $massView 'margin-bottom: 0.68rem;'
Assert-Contains 'History actions spacing' $massView 'margin-top: 0.08rem;'
Assert-Contains 'Mass Import compact root' $mass 'font-size: var(--easyedu-font-size-control);'
Assert-Contains 'Mass Import accepted intro' $mass '&__intro {'
Assert-Contains 'Mass Import result heading' $mass '&-report__title {'
Assert-Contains 'Mass Import semantic result heading' $mass 'text-transform: none;'
Assert-Contains 'Ungrouped descender correction' $structure '&-tree__section--ungrouped &-group__name {'

if ($index.Contains("get_string('close', 'moodle')")) {
    throw 'The invalid Moodle close string lookup remains in index.php.'
}
if (([regex]::Matches($index, "get_string\('closebuttontitle'\)")).Count -lt 2) {
    throw 'Mass Import modals do not use the valid core close-button title.'
}

foreach ($needle in @(
    '.local-groupimport-easystud-detail__identity-label',
    '.local-groupimport-easystud-detail__list-summary-end',
    '.local-groupimport-easystud-settings-modal__disclosure-chevron',
    '.local-groupimport-import-history__item-meta',
    '.local-groupimport-import-report__title',
    '.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-group__name'
)) {
    Assert-Contains 'Generated stylesheet' $styles $needle
}

Write-Output 'EasyStud waves 1-3 RF2 corrective contract passed.'
