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
    'scss/easyedu/_data-classes.scss' = '50cf1b6e982f21f61df8f920893b6b93adf655eb'
    'scss/easyedu/_foundation-classes.scss' = '3e9dacd1f923c948202f3882659a37de91a3f254'
    'scss/easyedu/_tokens.scss' = 'f92fb9ab6e4f3d5c7bea742a2e87ac6020150bcd'
    'scss/easyedu/adapters/_moodle-file-deposit.scss' = 'c8f7f6bb8f30a07f43d2051e870bee6a8aab442f'
    'scss/easyedu/components/_animations.scss' = '9dc31bb53c38984f8d69a1c06e9aec848208aa52'
    'scss/easyedu/components/_buttons.scss' = '355a054392c9ece426a7e49fbfa99ba86f0124d8'
    'scss/easyedu/components/_forms.scss' = 'e5b87206d93240fe270ba664425449005744889d'
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
    '@include easyedu.action-row',
    '@include easyedu.layout-disclosure-transition(grid-template-columns);'
)) {
    if (-not $massImport.Contains($needle)) {
        throw "Mass Import is missing the direct Kit contract: $needle"
    }
}

if ($massImport -notmatch '(?s)&\.has-preview\.is-upload-collapsed &-card--upload &-fields,.*?&-card__header > div\s*\{.*?position:\s*absolute;') {
    throw 'Collapsed Mass Import upload content must leave layout flow while the CSV identity remains visible.'
}

if ($massImport -match '(?s)&\.has-preview\.is-upload-collapsed.*?&-card__header > \.easyedu-icon-tile') {
    throw 'Collapsed Mass Import upload rail must preserve its centred CSV identity icon.'
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

$kitForms = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\components\_forms.scss')
$depositAdapter = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\adapters\_moodle-file-deposit.scss')
if ($kitForms -notmatch '(?s)\.easyedu-file-deposit__title\s*\{\s*@include typography\.type-card-title;' -or
    $kitForms -notmatch '(?s)\.easyedu-file-deposit__support\s*\{\s*@include typography\.type-caption;\s*line-height: 1\.2;') {
    throw 'The embedded file-deposit title/help roles diverge from Foundations.'
}
if ($depositAdapter -match 'font:\s*700\s+1\.0625rem/1\.2' -or
    $depositAdapter -match 'font:\s*500\s+0\.75rem/1\.2') {
    throw 'The embedded Moodle adapter restored legacy local deposit typography.'
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
if (($markup.Split('easyedu-action-with-icon').Count - 1) -lt 2) {
    throw 'Both report-export actions must consume the public icon-and-label class.'
}
if ($massImport -match '\.fp-btn-choose|\.filepicker-container|\.easyedu-file-deposit') {
    throw 'File deposit presentation must live in the canonical Kit adapter, not the plugin view.'
}

$importForm = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'classes\form\import_form.php')
$importController = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\src\csv_import.js')
foreach ($needle in @('data-easyedu-remove-label', "'maxfiles' => 1")) {
    if (-not $importForm.Contains($needle)) { throw "Missing selected-file contract: $needle" }
}
foreach ($needle in @('draftfiles_ajax.php', 'easyedu-file-deposit__file-type',
        'easyedu-file-deposit__remove', 'Motion.swap(button')) {
    if (-not $importController.Contains($needle)) { throw "Missing selected-file/motion controller contract: $needle" }
}
if ($importController.Contains('Motion.swap(uploadCard')) {
    throw 'Upload-column geometry must not stack Motion.swap over the Kit layout transition.'
}

if ($kitManifest.consumerSync.fullTreeIdentical -ne $false) {
    throw 'Phase 0 must preserve and disclose the deferred embedded-tree drift.'
}

Write-Output 'EasyStud Phase 0 Mass Import and Administration contract passed.'
