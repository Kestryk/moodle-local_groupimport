[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$studentSource = Get-Content (Join-Path $root 'scss\components\_typography.scss') -Raw
$massImportSource = Get-Content (Join-Path $root 'scss\views\_mass-import.scss') -Raw
$source = $studentSource + "`n" + $massImportSource
$css = Get-Content (Join-Path $root 'styles.css') -Raw
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
    '.local-groupimport-import__title',
    '.local-groupimport-import-card__title',
    '.local-groupimport-import-fields__header strong',
    '.local-groupimport-import-form .fitemtitle',
    '.local-groupimport-import-preview__table thead th'
)) {
    Assert-Contains $css $selector "Generated CSS is missing $selector."
}

foreach ($sourceSelector in @(
    '&__panel-title',
    '&-tree__section--ungrouped',
    '&-group__name',
    '&-grouping__name',
    '&__title',
    '&-card__title',
    '&-fields__header',
    '&-form',
    '&-preview__table'
)) {
    Assert-Contains $source $sourceSelector "Source contract is missing $sourceSelector."
}

foreach ($role in @('type-page-title', 'type-panel-title', 'type-section-title', 'type-control-label', 'type-body', 'type-caption', 'type-eyebrow')) {
    Assert-Contains $source "easyedu.$role" "Source contract does not consume $role."
}

Assert-Contains $source 'easyedu.card-title' 'Entity cards do not consume the shared card-title component.'

if ($massImportSource -notmatch '(?s)&-card__title\s*\{.*?@include easyedu\.type-control-label;' -or
        $massImportSource -notmatch '(?s)&-fields__header\s*\{.*?strong\s*\{\s*@include easyedu\.type-control-label;' -or
        $massImportSource -notmatch '(?s)&-form\s*\{.*?\.fitemtitle,\s*\.col-form-label\s*\{\s*@include easyedu\.type-eyebrow;') {
    $failures.Add('Mass Import visible title hierarchy does not use the compact Student Management tiers.')
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'EasyStud typography contract passed.' -ForegroundColor Green
