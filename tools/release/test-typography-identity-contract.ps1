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
$studentsource = $source + "`n" + (Read-RequiredFile 'scss/components/_typography.scss')
$massimportsource = Read-RequiredFile 'scss/views/_mass-import.scss'
$adminsource = Read-RequiredFile 'scss/views/_admin-settings.scss'
$settings = Read-RequiredFile 'settings.php'
$kit = Read-RequiredFile 'scss/easyedu/components/_typography.scss'
$kitcontract = Read-RequiredFile 'easyedu-kit-docs/ai/COMPONENT_CONTRACT.md'
$css = Read-RequiredFile 'styles.css'

Assert-Contains 'Sass entrypoint' $entry '@use "components/typography-identity";'
if ($kit -match '@mixin type-page-identity') {
    throw 'Embedded Kit typography must not alias the canonical page-title role.'
}
Assert-Contains 'Embedded Kit component contract' $kitcontract 'create aliases for an existing role such as `type-page-title`'

foreach ($selector in @(
    '\.local-groupimport-easystud'
)) {
    Assert-Contains 'Typography source' $source $selector
    Assert-Contains 'Generated CSS' $css $selector
}

foreach ($role in @(
    'type-panel-title',
    'type-section-title',
    'type-modal-title',
    'type-control-label',
    'type-body',
    'type-eyebrow'
)) {
    Assert-Contains 'Student typography sources' $studentsource "easyedu\.$role"
}

Assert-Contains 'More filters heading source' $source '&-advanced-filters &__filter-label\s*\{\s*@include type-more-filters-label;'
Assert-Contains 'More filters heading generated CSS' $css '\.local-groupimport-easystud-advanced-filters \.local-groupimport-easystud__filter-label\s*\{[^}]*font-size:\s*var\(--easyedu-font-size-eyebrow\);'
Assert-Contains 'More filters compact role' $source '@mixin type-more-filters-label\s*\{\s*@include easyedu\.type-eyebrow;'
Assert-Contains 'More filters compact role usage' $source '&-advanced-filters &__filter-label\s*\{\s*@include type-more-filters-label;'

Assert-Contains 'Mass Import page role' $massimportsource '&__title\s*\{[^}]*@include easyedu\.type-page-title;'
Assert-Contains 'Mass Import card role' $massimportsource '&-card__title\s*\{[^}]*@include easyedu\.type-control-label;'
Assert-Contains 'Mass Import body role' $massimportsource '&__intro\s*\{[^}]*@include easyedu\.type-body;'

$massimport = Read-RequiredFile 'index.php'
Assert-Contains 'Mass Import page title uses Kit identity role' $massimport "'class' => 'local-groupimport-import__title'"
Assert-Contains 'Mass Import section title uses Kit card role' $massimport "'class' => 'local-groupimport-import-card__title'"
Assert-Contains 'Shared card title descender clearance' $kit 'line-height:\s*1\.35;'

Assert-Contains 'Administration uses Mass Import eyebrow role' $settings 'local-groupimport-import__eyebrow local-groupimport-admin-settings__page-eyebrow'
Assert-Contains 'Administration uses Mass Import title role' $settings 'local-groupimport-import__title local-groupimport-admin-settings__page-title'
Assert-Contains 'Administration uses Mass Import description role' $settings 'local-groupimport-import__intro local-groupimport-admin-settings__page-description'
Assert-Contains 'Duplicate native Administration identity is hidden' $adminsource '#adminsettings > \.settingsform > h2\s*\{\s*display:\s*none;'
Assert-Contains 'Administration section role' $adminsource '\.local-groupimport-admin-settings__hero-copy\s*\{(?s:.*?)h3\s*\{\s*@include easyedu\.type-section-title;'
Assert-Contains 'Administration operational copy role' $adminsource '\.local-groupimport-admin-settings__hero-copy\s*\{(?s:.*?)p\s*\{\s*@include easyedu\.type-caption;'
Assert-Contains 'Administration compact hint role' $adminsource '\.local-groupimport-admin-settings__hint\s*\{(?s:.*?)span\s*\{\s*@include easyedu\.type-caption;'
Assert-Contains 'Administration subordinate field role' $adminsource '\.local-groupimport-admin-settings__field-card\s*\{(?s:.*?)h4\s*\{\s*@include easyedu\.type-control-label;'
Assert-Contains 'Administration labels role' $adminsource '\.form-label label\s*\{\s*@include easyedu\.type-control-label;'
Assert-Contains 'Administration icon size' $css '\.local-groupimport-admin-settings__hero > \.fa\s*\{[^}]*height:\s*var\(--easyedu-section-icon-size\);[^}]*width:\s*var\(--easyedu-section-icon-size\);'
Assert-Contains 'Native identifier multiselect remains present' $adminsource 'select\[name="s_local_groupimport_alloweduserfields\[\]"\]'

if ($massimportsource -match 'font-weight:\s*(7[1-9][0-9]|8[0-9][0-9])' -or $massimportsource -match 'letter-spacing:\s*-') {
    throw 'The consumer adoption layer must not introduce numeric weights or negative letter spacing.'
}

Write-Host 'EasyStud typography and identity contract passed.'
