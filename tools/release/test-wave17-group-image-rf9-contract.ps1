[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (!(Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing Wave 17 RF9 contract file: $relativePath"
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
$styles = Read-RequiredFile 'styles.css'
$ajax = Read-RequiredFile 'ajax.php'
$history = Read-RequiredFile 'docs\history\eed-ui-2026-0038-rf9-group-image.md'

# The visible Choose control is a real keyboard-operable button. It resolves
# the file input inside its own shared Kit filepicker and invokes the native
# picker directly instead of relying on a nested-label click.
foreach ($fragment in @(
    'data-easystud-advanced-file-trigger="1"',
    "event.target.closest('[data-easystud-advanced-file-trigger]')",
    "trigger.closest('.local-groupimport-easystud-settings-modal__filepicker')",
    "filepicker.querySelector('[data-easystud-advanced-file-input]')",
    'input.click();',
    'postFormAction(new FormData(form))',
    'updateAdvancedFilePickerName(root, input);'
)) {
    Assert-Contains 'Group image picker' $manager $fragment
}
foreach ($fragment in @(
    'data-easystud-advanced-file-trigger',
    'local-groupimport-easystud-settings-modal__filepicker',
    'data-easystud-advanced-file-input',
    'FormData',
    'updateAdvancedFilePickerName'
)) {
    Assert-Contains 'Generated Group image picker' $managerBuild $fragment
}
Assert-Contains 'Group image picker markup' $manager 'type="file" id="' + "' + imageInputId + '" + '" name="imagefile" accept="image/*"'
Assert-Contains 'Shared filepicker source' $modal '@include easyedu.settings-modal-filepicker;'
Assert-Contains 'Group image server upload' $ajax "`$_FILES['imagefile']['tmp_name']"
Assert-Contains 'Group image server processing' $ajax "process_new_icon(`$context, 'group', 'icon', `$groupid"

# The pending delete command uses native checkbox semantics and only shared
# Kit primitives. No EasyStud-authored transform/timing or copied CCB product
# class remains.
foreach ($fragment in @(
    'type="checkbox" name="deletepicture" value="1"',
    'data-easystud-settings-toggle-state="1"',
    'const syncAdvancedSettingsToggle = input =>',
    'input.checked = false;',
    '@include easyedu.toggle-check;',
    '@include easyedu.slideshow-toggle-row(var(--local-groupimport-easystud-group));'
)) {
    if ($fragment.StartsWith('@include')) {
        Assert-Contains 'Canonical Group image toggle source' $modal $fragment
    } else {
        Assert-Contains 'Canonical Group image toggle behavior' $manager $fragment
    }
}
foreach ($fragment in @(
    'local-course-banner-builder-slideshow-toggle-button-row',
    'local-course-banner-builder-slideshow-enable-button ',
    'data-easystud-settings-toggle-button',
    'transform: rotate(180deg) scale(1.06);'
)) {
    Assert-Absent 'Rejected local toggle imitation' $manager $fragment
    Assert-Absent 'Rejected local toggle styling' $modal $fragment
}

foreach ($fragment in @(
    '.local-groupimport-easystud-settings-modal__filepicker {',
    '.local-groupimport-easystud-settings-modal__image-toggle {',
    '.local-groupimport-easystud-settings-modal__image-toggle input {',
    '.local-groupimport-easystud-settings-modal__image-toggle input:checked + span::before {'
)) {
    Assert-Contains 'Generated shared Group-image CSS' $styles $fragment
}

Assert-Contains 'RF9 history' $history 'EED-UI-2026-0038-RF9'

Write-Host 'EasyStud Wave 17 Group image RF9 contract passed.' -ForegroundColor Green
