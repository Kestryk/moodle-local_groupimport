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

Assert-Contains $manager 'class="btn p-0 icon-no-margin ' 'Contextual help must remain independent from Bootstrap btn-link.'
Assert-NotContains $manager 'class="btn btn-link p-0 icon-no-margin local-groupimport-easystud-settings-modal__help' 'Contextual help must not restore the underlined link variant.'
Assert-Contains $modal '@include easyedu.help-tooltip;' 'Group and Grouping help must use the shared Kit help primitive.'
Assert-Contains $modal 'flex: 0 0 1.35rem;' 'Contextual help must keep the canonical CCB Slideshow diameter.'
Assert-Contains $modal 'text-decoration-line: none !important;' 'Contextual help must suppress theme hover underlines.'
Assert-Contains $modal 'easyedu.ring($border-color: var(--easyedu-control-focus-border))' 'Contextual help must retain keyboard focus visibility.'

Assert-Contains $manager 'local-groupimport-easystud-settings-modal__field--entity-count' 'Entity count fields must expose their semantic label mapping.'
Assert-Contains $manager 'local-groupimport-easystud-settings-modal__field-label' 'Members and Groups count labels must expose the shared label hook.'
Assert-Contains $modal '&-settings-modal__field--entity-count {' 'Entity count label spacing must remain scoped to the summary field.'
Assert-Contains $modal '@include easyedu.type-caption;' 'Entity count labels and compact guidance must use the shared caption role.'
Assert-Contains $modal 'gap: 0.32rem;' 'Entity count labels must retain visible label-to-value spacing.'

Assert-Contains $modal '@include easyedu.toggle-check;' 'The Group image toggle must retain the shared binary-control primitive.'
Assert-Contains $modal '@include easyedu.slideshow-toggle-row(var(--local-groupimport-easystud-group));' 'The Group image toggle must reuse the shared CCB/Kit row Motion primitive.'
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
