$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $pluginRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $RelativePath"
    }
    return Get-Content -Raw -LiteralPath $path
}

$template = Read-RequiredFile 'templates/manage.mustache'
$layout = Read-RequiredFile 'scss/components/_layout.scss'
$forms = Read-RequiredFile 'scss/components/_forms.scss'
$settingsModal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$controlTypography = Read-RequiredFile 'scss/components/_control-typography.scss'
$responsive = Read-RequiredFile 'scss/responsive/_desktop.scss'
$styles = Read-RequiredFile 'styles.css'
$scenario = Read-RequiredFile 'tools/playwright/easystud-action-button-alignment.spec.js'
$supervisor = Read-RequiredFile 'tools/playwright/Invoke-EasyStudActionButtonAlignmentSupervised.ps1'
$fixture = Read-RequiredFile 'tools/playwright/easystud-action-button-alignment-fixture.php'
$credentialRunner = Read-RequiredFile 'tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1'

if ($template -match 'fa \{\{icon\}\} me-2') {
    throw 'Upper EasyStud actions still add a Bootstrap icon margin on top of the Kit gap.'
}

foreach ($needle in @(
    '&__participant-navigation {',
    '--easyedu-action-icon-gap: 0.35rem;',
    'gap: var(--easyedu-action-icon-gap);',
    '&::after {',
    'margin-inline-start: 0;',
    '@include easyedu.action-button(small);',
    'margin-inline: 0 !important;',
    '[data-easystud-panel-actions-menu] .btn',
    'text-decoration: none !important;'
)) {
    if (-not $layout.Contains($needle) -and -not $controlTypography.Contains($needle)) {
        throw "Missing upper-action or More-actions contract: $needle"
    }
}

foreach ($obsolete in @(
    '--easyedu-action-icon-gap: 0.45rem;',
    'gap: 0.6rem;'
)) {
    if ($layout.Contains($obsolete)) {
        throw "Obsolete excessive upper-action spacing remains: $obsolete"
    }
}

foreach ($source in @($forms, $settingsModal)) {
    if (-not $source.Contains('@include easyedu.action-button(small);') -or
            -not $source.Contains('margin-inline: 0 !important;')) {
        throw 'Inline rename or native-profile action does not use the shared action-button contract.'
    }
}

if (-not $responsive.Contains('&-mobile-actions__buttons') -or
        -not $responsive.Contains('@include easyedu.action-button(small);') -or
        -not $responsive.Contains('@include easyedu.mobile-action-tray-button;')) {
    throw 'Responsive selected-action buttons do not preserve the shared centred action contract.'
}

foreach ($needle in @(
    '.local-groupimport-easystud__participant-navigation',
    'gap: var(--easyedu-action-icon-gap)',
    'margin-inline-start: 0',
    '.local-groupimport-easystud__panel-actions',
    '--easyedu-action-icon-gap: 0.35rem',
    '.local-groupimport-easystud-settings-modal__native > .btn',
    '.local-groupimport-easystud-rename__edit .btn',
    '[data-easystud-panel-actions-menu] .btn'
)) {
    if (-not $styles.Contains($needle)) {
        throw "Generated stylesheet is missing action-button alignment: $needle"
    }
}

if ($styles.Contains('--easyedu-action-icon-gap: 0.45rem')) {
    throw 'Generated stylesheet still contains the rejected upper-action gap.'
}

if ($scenario -match 'manage\.php\?id=5' -or
        -not $scenario.Contains('EASYEDU_EASYSTUD_MANAGER_URL')) {
    throw 'The focused scenario must require the supervisor-provided fixture URL and must not retain course 5.'
}
foreach ($needle in @(
    'FixtureHelperPath',
    'easystud-action-button-alignment-fixture.php',
    'EASYEDU_EASYSTUD_MANAGER_URL',
    'delete_course($courseid, false)'
)) {
    if (-not ($supervisor + $fixture + $credentialRunner).Contains($needle)) {
        throw "Missing supervised action-alignment fixture contract: $needle"
    }
}

Write-Output 'EasyStud action-button alignment contract passed.'
