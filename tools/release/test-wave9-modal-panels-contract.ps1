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

Assert-Contains $manager 'class="btn btn-link p-0 icon-no-margin ' 'Contextual help must keep the accepted CCB Slideshow button structure.'
Assert-Contains $manager 'local-groupimport-easystud-settings-modal__help" ' 'Contextual help must retain the EasyStud behavior hook.'
Assert-Contains $modal '@include easyedu.contextual-help-control;' 'Contextual help must use the canonical Kit primitive.'
Assert-NotContains $manager 'local-course-banner-builder-help-dot ' 'EasyStud contextual help must not retain a cross-plugin class.'

Assert-Contains $manager 'local-groupimport-easystud-settings-modal__field--entity-count' 'Entity count fields must expose their semantic label mapping.'
Assert-Contains $manager 'local-groupimport-easystud-settings-modal__field-label' 'Members and Groups count labels must expose the shared label hook.'
Assert-Contains $modal '&-settings-modal__field--entity-count {' 'Entity count label spacing must remain scoped to the summary field.'
Assert-Contains $modal '@include easyedu.type-caption;' 'Entity count labels and compact guidance must use the shared caption role.'
Assert-Contains $modal 'gap: 0.32rem;' 'Entity count labels must retain visible label-to-value spacing.'

Assert-Contains $manager 'local-course-banner-builder-slideshow-toggle-button-row' 'The Group image toggle must use the accepted CCB button-row DOM.'
Assert-Contains $manager 'local-course-banner-builder-slideshow-enable-button ' 'The Group image toggle must use the accepted CCB button class.'
Assert-Contains $manager 'syncAdvancedSettingsToggleButton(button, input)' 'The Group image toggle must synchronise its full interactive state.'
Assert-Contains $modal 'background-color var(--easyedu-motion-normal)' 'The Group image toggle must visibly animate state changes.'
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
