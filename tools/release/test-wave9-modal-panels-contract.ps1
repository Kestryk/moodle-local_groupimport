[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$manager = Get-Content (Join-Path $root 'amd\src\course_manager.js') -Raw
$managerBuild = Get-Content (Join-Path $root 'amd\build\course_manager.min.js') -Raw
$modal = Get-Content (Join-Path $root 'scss\components\_settings-modal.scss') -Raw
$typography = Get-Content (Join-Path $root 'scss\components\_typography-identity.scss') -Raw
$css = Get-Content (Join-Path $root 'styles.css') -Raw
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains {
    param([string]$Contents, [string]$Needle, [string]$Message)
    if (-not $Contents.Contains($Needle)) {
        $failures.Add($Message)
    }
}

function Assert-NotContains {
    param([string]$Contents, [string]$Needle, [string]$Message)
    if ($Contents.Contains($Needle)) {
        $failures.Add($Message)
    }
}

Assert-Contains $manager 'class="btn p-0 icon-no-margin ' 'Contextual help must keep the accepted native button structure without btn-link.'
Assert-NotContains $manager 'class="btn btn-link p-0 icon-no-margin local-groupimport-easystud-settings-modal__help' 'Contextual help must not restore Bootstrap btn-link.'
Assert-Contains $manager 'local-groupimport-easystud-settings-modal__help" ' 'Contextual help must retain the EasyStud behavior hook.'
Assert-Contains $modal '@include easyedu.contextual-help-control;' 'Contextual help must use the canonical Kit primitive.'
Assert-NotContains $manager 'local-course-banner-builder-help-dot ' 'EasyStud contextual help must not retain a cross-plugin class.'

Assert-Contains $manager 'local-groupimport-easystud-settings-modal__field--entity-count' 'Entity count fields must expose their semantic label mapping.'
Assert-Contains $manager 'local-groupimport-easystud-settings-modal__field-label' 'Members and Groups count labels must expose the shared label hook.'
Assert-Contains $modal '&-settings-modal__field--entity-count {' 'Entity count label spacing must remain scoped to the summary field.'
Assert-Contains $modal '@include easyedu.type-caption;' 'Entity count labels and compact guidance must use the shared caption role.'
Assert-Contains $modal 'gap: 0.32rem;' 'Entity count labels must retain visible label-to-value spacing.'

Assert-Contains $manager 'type="checkbox" name="deletepicture" value="1"' 'The Group image toggle must keep native checkbox semantics.'
Assert-Contains $manager 'data-easystud-settings-toggle-state="1"' 'The Group image toggle must expose its visible state label.'
Assert-Contains $manager 'syncAdvancedSettingsToggle(toggle)' 'The Group image toggle must synchronise its visible state.'
Assert-Contains $modal '@include easyedu.toggle-check;' 'The Group image toggle must consume the canonical Kit switch.'
Assert-Contains $modal '@include easyedu.slideshow-toggle-row(var(--local-groupimport-easystud-group));' 'The Group image toggle must consume the accepted CCB row surface.'
Assert-NotContains $manager 'local-course-banner-builder-slideshow-enable-button ' 'The rejected consumer-side CCB button imitation must stay removed.'
Assert-NotContains $modal 'transform: rotate(180deg) scale(1.06);' 'The rejected consumer-owned toggle animation must stay removed.'
Assert-Contains $typography '.local-groupimport-admin-settings__hint span {' 'Administration guidance must remain narrowly scoped to current green panels.'
Assert-NotContains $typography (
    '.local-groupimport-admin-settings__hint span {' + [Environment]::NewLine + '    @include easyedu.type-ui-base;'
) 'Green-panel guidance must not retain the larger UI base role.'

foreach ($needle in @(
    'local-groupimport-easystud-settings-modal__field--entity-count',
    'local-groupimport-easystud-settings-modal__help',
    'local-groupimport-admin-settings__hint span'
)) {
    Assert-Contains $css $needle "Generated CSS is missing $needle."
}
Assert-Contains $managerBuild 'local-groupimport-easystud-settings-modal__field--entity-count' 'Generated AMD must contain the semantic entity-count field hook.'

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'EasyStud Wave 9 modal and information-panel contract passed.' -ForegroundColor Green
