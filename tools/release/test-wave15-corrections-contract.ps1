[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (!(Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing Wave 15 contract file: $relativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains([string]$label, [string]$content, [string]$fragment) {
    if (!$content.Contains($fragment)) {
        throw "$label is missing: $fragment"
    }
}

function Assert-Absent([string]$label, [string]$content, [string]$fragment) {
    if ($content.Contains($fragment)) {
        throw "$label must not contain: $fragment"
    }
}

$manager = Read-RequiredFile 'amd\src\course_manager.js'
$managerBuild = Read-RequiredFile 'amd\build\course_manager.min.js'
$modal = Read-RequiredFile 'scss\components\_settings-modal.scss'
$tooltips = Read-RequiredFile 'scss\easyedu\components\_tooltips.scss'
$guide = Read-RequiredFile 'scss\easyedu\components\_guide.scss'
$navigation = Read-RequiredFile 'scss\easyedu\components\_navigation.scss'
$styles = Read-RequiredFile 'styles.css'
$history = Read-RequiredFile 'docs\history\eed-ui-2026-wave15-corrections.md'

# UI 0052-RF1: only the two semantic Group-modal question marks consume the
# authoritative Kit control, without Bootstrap's link decoration utility.
Assert-Contains 'Contextual-help source' $tooltips 'flex: 0 0 1.15rem !important;'
Assert-Contains 'Contextual-help source' $tooltips 'text-decoration-line: none !important;'
Assert-Contains 'Contextual-help source' $tooltips 'box-shadow: 0 0 0 var(--easyedu-focus-ring-width) var(--easyedu-focus-ring) !important;'
Assert-Contains 'Native help markup' $manager '<button type="button" class="btn p-0 icon-no-margin '
Assert-Absent 'Native help markup' $manager '<button type="button" class="btn btn-link p-0 icon-no-margin local-groupimport-easystud-settings-modal__help'
Assert-Contains 'Enrollment key help consumer' $manager "labels.advancedsettingsenrolmentkeyhelp || ''"
Assert-Contains 'Group image help consumer' $manager "renderFieldHelp(labels.advancedsettingsimagehelp || '')"
if ([regex]::Matches($manager, 'renderFieldHelp\(labels\.').Count -ne 1) {
    throw 'EasyStud must not add another direct labelled question-mark consumer.'
}

$helpCss = [regex]::Match(
    $styles,
    '(?s)\.local-groupimport-easystud-settings-modal__help\s*\{(?<body>.*?)\}'
)
if (!$helpCss.Success) {
    throw 'Generated CSS is missing the Group-modal contextual-help rule.'
}
foreach ($declaration in @(
    'align-items:\s*center !important;',
    'border-radius:\s*999px !important;',
    'height:\s*1\.15rem !important;',
    'justify-content:\s*center !important;',
    'padding:\s*0 !important;',
    'text-decoration:\s*none !important;',
    'width:\s*1\.15rem !important;'
)) {
    if ($helpCss.Groups['body'].Value -notmatch $declaration) {
        throw "Generated contextual-help cascade is missing '$declaration'."
    }
}
if ($styles -notmatch '(?s)\.local-groupimport-easystud-settings-modal__help:hover,.+?text-decoration-line:\s*none !important;') {
    throw 'Generated contextual-help interaction may restore a theme underline.'
}

# UI 0038-RF8: Delete picture is one pending destructive command. It is reset
# after successful Save and is not backed by preference storage.
foreach ($fragment in @(
    'data-easystud-delete-picture-input="1"',
    'data-easystud-delete-picture-command="1"',
    'const resetAdvancedDeletePictureCommand = form =>',
    "input.value = '0';",
    'resetAdvancedDeletePictureCommand(form);'
)) {
    Assert-Contains 'Delete picture command' $manager $fragment
}
foreach ($fragment in @(
    'data-easystud-delete-picture-input',
    'data-easystud-delete-picture-command',
    'resetAdvancedDeletePictureCommand'
)) {
    Assert-Contains 'Generated Delete picture command' $managerBuild $fragment
}
if ($manager -match '(?is)deletepicture.{0,160}(localStorage|sessionStorage)') {
    throw 'Delete picture must not be persisted as a user preference.'
}
foreach ($fragment in @(
    'min-height: 1.9rem;',
    'min-width: 0;',
    'font-size: 0.84rem;',
    'transform: rotate(180deg) scale(1.06);',
    'transition-duration: 0.01ms !important;'
)) {
    Assert-Contains 'Delete picture visual contract' $modal $fragment
}

# UI 0040-RF1: desktop outer chrome stays transparent; only the compact row
# owns a visible boundary and clearance. Close hover remains Kit-owned.
foreach ($fragment in @(
    'align-items: center;',
    'background: transparent;',
    'border: 0;',
    'padding: 0;'
)) {
    Assert-Contains 'Desktop Guide launcher' $guide $fragment
}
foreach ($fragment in @(
    '.easyedu-navigation__guide-slot:not(:empty)',
    'margin-block-end: 1rem;',
    'border: 0.0625rem solid var(--easyedu-guide-launcher-resting-border);',
    '@include buttons.close-button;'
)) {
    Assert-Contains 'Responsive Guide and Close' $navigation $fragment
}
if ($navigation -match '(?s)\.easyedu-navigation__close:hover\s*\{') {
    throw 'EasyStud must not fork the shared Navigation Close hover state.'
}

$desktopGuideCss = [regex]::Match(
    $styles,
    '(?s)\.path-local-groupimport \.easyedu-guide \.easyedu-guide__launcher\s*\{(?<body>.*?)\}'
)
if (!$desktopGuideCss.Success) {
    throw 'Generated CSS is missing the desktop Guide launcher rule.'
}
foreach ($declaration in @(
    'align-items:\s*center;',
    'background:\s*transparent;',
    'border:\s*0;',
    'justify-content:\s*center;',
    'padding:\s*0;'
)) {
    if ($desktopGuideCss.Groups['body'].Value -notmatch $declaration) {
        throw "Generated desktop Guide cascade is missing '$declaration'."
    }
}
if ($styles -notmatch '(?s)\.easyedu-navigation__guide-slot:not\(:empty\)\s*\{[^}]*margin-block-end:\s*1rem;') {
    throw 'Generated compact Guide slot is missing its following-section clearance.'
}
if ($styles -notmatch '(?s)\.easyedu-navigation__guide-slot \.easyedu-guide__launcher\s*\{[^}]*border:\s*0\.0625rem solid var\(--easyedu-guide-launcher-resting-border\);') {
    throw 'Generated compact Guide launcher is missing its visible resting boundary.'
}
if ($styles -notmatch '(?s)\.easyedu-navigation__close:hover,.+?background:\s*var\(--easyedu-danger-soft\);') {
    throw 'Generated Navigation Close control is missing the shared danger-soft hover state.'
}

Assert-Contains 'Wave 15 history' $history '`EED-UI-2026-0052-RF1`'
Assert-Contains 'Wave 15 history' $history '`EED-UI-2026-0038-RF8`'
Assert-Contains 'Wave 15 history' $history '`EED-UI-2026-0040-RF1`'

Write-Host 'EasyStud Wave 15 correction contract passed.' -ForegroundColor Green
