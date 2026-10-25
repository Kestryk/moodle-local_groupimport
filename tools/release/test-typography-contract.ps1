[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$studentSource = Get-Content (Join-Path $root 'scss\components\_typography.scss') -Raw
$massImportSource = Get-Content (Join-Path $root 'scss\views\_mass-import.scss') -Raw
$adminSource = Get-Content (Join-Path $root 'scss\views\_admin-settings.scss') -Raw
$foundationSource = Get-Content (Join-Path $root 'scss\easyedu\_foundation-classes.scss') -Raw
$depositSource = Get-Content (Join-Path $root 'scss\easyedu\adapters\_moodle-file-deposit.scss') -Raw
$dataSource = Get-Content (Join-Path $root 'scss\easyedu\_data-classes.scss') -Raw
$source = $studentSource + "`n" + $massImportSource + "`n" + $adminSource + "`n" + $foundationSource + "`n" + $depositSource + "`n" + $dataSource
$css = Get-Content (Join-Path $root 'styles.css') -Raw
$markup = Get-Content (Join-Path $root 'index.php') -Raw
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains {
    param([string]$Contents, [string]$Needle, [string]$Message)
    if ($Contents -notmatch [regex]::Escape($Needle)) { $failures.Add($Message) }
}

foreach ($selector in @(
    '.local-groupimport-easystud__panel-title',
    '.local-groupimport-easystud-tree__section--ungrouped',
    '.local-groupimport-easystud-group__name',
    '.local-groupimport-easystud-grouping__name',
    '.easyedu-ui .easyedu-page-title',
    '.easyedu-ui .easyedu-panel__title',
    '.easyedu-ui .easyedu-information__title',
    '.easyedu-ui .easyedu-file-deposit--moodle .easyedu-file-deposit__title',
    '.easyedu-ui .easyedu-data-table th'
)) {
    Assert-Contains $css $selector "Generated CSS is missing $selector."
}

foreach ($sourceSelector in @(
    '&__panel-title',
    '&-tree__section--ungrouped',
    '&-group__name',
    '&-grouping__name',
    '.easyedu-ui .easyedu-page-title',
    '.easyedu-ui .easyedu-panel__title',
    '.easyedu-ui .easyedu-information__title',
    '.easyedu-file-deposit__title',
    '.easyedu-ui .easyedu-data-table'
)) {
    Assert-Contains $source $sourceSelector "Source contract is missing $sourceSelector."
}

foreach ($role in @('type-panel-title', 'type-section-title', 'type-control-label', 'type-body', 'type-caption', 'type-eyebrow')) {
    Assert-Contains $source "easyedu.$role" "Source contract does not consume $role."
}

Assert-Contains $foundationSource '@include type.type-page-title;' 'Canonical Foundations source does not consume type-page-title.'

Assert-Contains $source 'easyedu.card-title' 'Entity cards do not consume the shared card-title component.'
Assert-Contains $markup 'local-groupimport-import__title easyedu-page-title' 'Mass Import does not bind its page title to the canonical Kit class.'
Assert-Contains $markup 'local-groupimport-import__intro easyedu-body' 'Mass Import does not bind its introduction to the canonical Kit body class.'

if ($foundationSource -notmatch '(?s)\.easyedu-ui \.easyedu-panel__title\s*\{\s*@include type\.type-section-title;' -or
        $foundationSource -notmatch '(?s)\.easyedu-ui \.easyedu-information__title\s*\{\s*@include type\.type-card-title;' -or
        $depositSource -notmatch '(?s)\.easyedu-file-deposit__title\s*\{\s*@include typography\.type-card-title;' -or
        $depositSource -notmatch '(?s)\.easyedu-file-deposit__support\s*\{\s*@include typography\.type-caption;') {
    $failures.Add('Mass Import visible title/help hierarchy does not consume the canonical Foundations roles.')
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'EasyStud typography contract passed.' -ForegroundColor Green
