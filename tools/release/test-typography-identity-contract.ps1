[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $relativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains([string]$label, [string]$text, [string]$pattern) {
    if ($text -notmatch $pattern) {
        throw "$label is missing contract pattern: $pattern"
    }
}

$entry = Read-RequiredFile 'scss/easystud.scss'
$source = Read-RequiredFile 'scss/components/_typography-identity.scss'
$adminsource = Read-RequiredFile 'scss/views/_admin-settings.scss'
$kit = Read-RequiredFile 'scss/easyedu/components/_typography.scss'
$kitcontract = Read-RequiredFile 'easyedu-kit-docs/ai/COMPONENT_CONTRACT.md'
$css = Read-RequiredFile 'styles.css'

Assert-Contains 'Sass entrypoint' $entry '@use "components/typography-identity";'
Assert-Contains 'Embedded Kit typography' $kit '@mixin type-page-identity\s*\{\s*@include type-page-title;'
Assert-Contains 'Embedded Kit component contract' $kitcontract 'use `type-page-identity` for plugin view identity headings'

foreach ($selector in @(
    '\.local-groupimport-easystud',
    '\.local-groupimport-import',
    '#page-admin-setting-local_groupimport'
)) {
    Assert-Contains 'Typography source' $source $selector
    Assert-Contains 'Generated CSS' $css $selector
}

foreach ($role in @(
    'type-page-identity',
    'type-panel-title',
    'type-section-title',
    'type-modal-title',
    'type-control-label',
    'type-body',
    'type-eyebrow'
)) {
    Assert-Contains 'Typography source' $source "easyedu\.$role"
}

Assert-Contains 'More filters heading source' $source '&-advanced-filters &__filter-label\s*\{\s*@include type-more-filters-label;'
Assert-Contains 'More filters heading generated CSS' $css '\.local-groupimport-easystud-advanced-filters \.local-groupimport-easystud__filter-label\s*\{[^}]*font-size:\s*var\(--easyedu-font-size-eyebrow\);'
Assert-Contains 'More filters compact role' $source '@mixin type-more-filters-label\s*\{\s*@include easyedu\.type-eyebrow;'
Assert-Contains 'More filters compact role usage' $source '&-advanced-filters &__filter-label\s*\{\s*@include type-more-filters-label;'

$massimport = Read-RequiredFile 'index.php'
Assert-Contains 'Mass Import page title uses Kit identity role' $massimport "'class' => 'local-groupimport-import__title'"
Assert-Contains 'Mass Import section title uses Kit card role' $massimport "'class' => 'local-groupimport-import-card__title'"
Assert-Contains 'Shared card title descender clearance' $kit 'line-height:\s*1\.35;'

Assert-Contains 'Administration page role' $source '#adminsettings > \.settingsform > h2\s*\{\s*@include easyedu\.type-page-identity;'
Assert-Contains 'Administration identity eyebrow role' $source '\.local-groupimport-admin-settings__page-eyebrow\s*\{\s*@include easyedu\.type-eyebrow;'
Assert-Contains 'Administration identity title role' $source '\.local-groupimport-admin-settings__page-title\s*\{\s*@include easyedu\.type-page-identity;'
Assert-Contains 'Administration identity description role' $source '\.local-groupimport-admin-settings__page-description\s*\{\s*@include easyedu\.type-body;'
Assert-Contains 'Administration section role' $source '\.formsettingheading h3,\s*\.local-groupimport-admin-settings__hero-copy h3\s*\{[^}]*@include easyedu\.type-section-title;'
Assert-Contains 'Administration operational copy role' $source '\.formsettingheading \.form-description,\s*\.local-groupimport-admin-settings__hero-copy p\s*\{\s*@include easyedu\.type-caption;'
Assert-Contains 'Administration compact hint role' $source '\.local-groupimport-admin-settings__hint span\s*\{[^}]*@include easyedu\.type-caption;'
Assert-Contains 'Administration subordinate field role' $source '\.local-groupimport-admin-settings__field-card h4\s*\{\s*@include easyedu\.type-control-label;'
Assert-Contains 'Administration labels role' $source '\.form-label label\s*\{\s*@include easyedu\.type-control-label;'
Assert-Contains 'Administration icon size' $css '\.local-groupimport-admin-settings__hero > \.fa\s*\{[^}]*height:\s*2\.55rem;[^}]*width:\s*2\.55rem;'
Assert-Contains 'Native identifier multiselect remains present' $adminsource 'select\[name="s_local_groupimport_alloweduserfields\[\]"\]'

if ($source -match 'font-weight:\s*[0-9]' -or $source -match 'letter-spacing:\s*-') {
    throw 'The consumer adoption layer must not introduce numeric weights or negative letter spacing.'
}

Write-Host 'EasyStud typography and identity contract passed.'
