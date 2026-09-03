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

$settingsModal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$structure = Read-RequiredFile 'scss/components/_structure.scss'
$manager = Read-RequiredFile 'amd/src/course_manager.js'
$managerBuild = Read-RequiredFile 'amd/build/course_manager.min.js'
$styles = Read-RequiredFile 'styles.css'

foreach ($needle in @(
    '@include easyedu.settings-modal-dialog;',
    'display: flex;',
    'flex-direction: column;',
    'overflow: auto;',
    'overscroll-behavior: contain;',
    '@include easyedu.type-card-title;',
    '@include easyedu.type-control-label;',
    'border-radius: inherit;',
    '@include easyedu.action-button(small);',
    'min-height: 2.25rem;',
    'max-inline-size: 100%;'
)) {
    if (-not $settingsModal.Contains($needle)) {
        throw "Missing card-modal SCSS contract: $needle"
    }
}

foreach ($needle in @(
    'data-easystud-detail-list="1"',
    'Motion.isEnabled(details)',
    'Motion.collapse(content',
    'Motion.expand(content',
    'details.open = false;',
    'local-groupimport-easystud-modal__footer'
)) {
    if (-not $manager.Contains($needle)) {
        throw "Missing participant/modal action contract: $needle"
    }
}

if ($manager -notmatch '(?s)local-groupimport-easystud-modal__footer.*?data-easystud-close-advanced-settings.*?advancedsettingsnative.*?</form>') {
    throw 'Group/Grouping native Moodle action is not kept with Save and Cancel in the shared footer.'
}

if ($manager -notmatch '(?s)name="imagefile" accept="image/\*".*?data-easystud-advanced-file-input="1"') {
    throw 'The existing Group image Filepicker boundary is missing.'
}

foreach ($needle in @(
    'local_groupimport/course_manager',
    'data-easystud-detail-list',
    'bindAnimatedDetails',
    'data-easystud-detail-list-state',
    'data-easystud-settings-list-state',
    'Motion.collapse(content',
    'Motion.expand(content'
)) {
    if (-not $managerBuild.Contains($needle)) {
        throw "Generated Course Manager AMD is missing card-modal contract: $needle"
    }
}

if ($structure -notmatch '(?s)is-expanded:focus-within.*?card-focus-context') {
    throw 'The existing open-card inner focus treatment must remain present.'
}

foreach ($needle in @(
    '.local-groupimport-easystud-settings-modal__dialog {',
    '.local-groupimport-easystud-settings-modal .local-groupimport-easystud-modal__body {',
    '.local-groupimport-easystud-detail__avatar img,',
    '.local-groupimport-easystud-detail__list-scroll {',
    '.local-groupimport-easystud-settings-modal .local-groupimport-easystud-modal__footer > .btn {'
)) {
    if (-not $styles.Contains($needle)) {
        throw "Generated stylesheet is missing card-modal contract: $needle"
    }
}

Write-Output 'EasyStud card modal contract passed.'
