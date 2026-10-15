$ErrorActionPreference = 'Stop'

# T048 / K18 (Kevin 16/10/2026, decision 6, Penpot S6-D5a/b/c): the card detail dialogs share
# the entity dialog structure (identity, information, relations, image) with a sticky footer.
# This successor replaces the former 72rem/68rem card-modal contract (three-column participant
# lists with inner scroll, footer inside the scrolling body).

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $pluginRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $RelativePath"
    }
    return Get-Content -Raw -LiteralPath $path
}

$entityScss = Read-RequiredFile 'scss/components/_entity-dialog.scss'
$recipes = Read-RequiredFile 'scss/components/_dialog-recipes.scss'
$settingsModal = Read-RequiredFile 'scss/components/_settings-modal.scss'
$entity = Read-RequiredFile 'amd/src/local/cm/entity_dialog.js'
$participant = Read-RequiredFile 'amd/src/local/cm/participant_modal.js'
$advanced = Read-RequiredFile 'amd/src/local/cm/advanced_settings.js'
$template = Read-RequiredFile 'templates/manage.mustache'
$styles = Read-RequiredFile 'styles/student-management.css'

foreach ($needle in @(
    '@include recipes.dialog-shell(45rem);',
    '@include recipes.dialog-scroll-body;',
    '@include recipes.dialog-footer;',
    '@include recipes.dialog-pill;',
    'grid-template-columns: repeat(2, minmax(0, 1fr));',
    'grid-template-columns: 3.5rem minmax(0, 1fr);',
    '@include easyedu.foundation-text-field;',
    '@include easyedu.foundation-textarea;',
    '@include easyedu.skeleton-shimmer-direct;',
    '@include recipes.dialog-sheet;'
)) {
    if (-not $entityScss.Contains($needle)) {
        throw "Missing entity dialog SCSS contract: $needle"
    }
}
foreach ($needle in @('block-size: 1.375rem;', 'background: var(--easyedu-modal-footer-bg);', 'overflow: auto;')) {
    if (-not $recipes.Contains($needle)) {
        throw "Missing dialog family recipe: $needle"
    }
}
foreach ($needle in @('@include easyedu.settings-modal-filepicker;', '@include easyedu.toggle-check;',
        '@include easyedu.modal-file-drop-state(')) {
    if (-not $settingsModal.Contains($needle)) {
        throw "Missing preserved group image hook: $needle"
    }
}

foreach ($needle in @(
    'export const visibleRelationLimit = 8;',
    'const skeletonDelay = 150;',
    'data-easystud-settings-list-section="1"',
    'data-easystud-settings-export="1"',
    'data-easystud-entity-more="1"',
    'easyedu-related-person-row'
)) {
    if (-not $entity.Contains($needle)) {
        throw "Missing entity dialog renderer contract: $needle"
    }
}

foreach ($needle in @(
    'const openForUser = (user, trigger) =>',
    'participantReturnFocus = trigger;',
    'const closeParticipantModal = () => hideEasyStudModal(modal, () =>',
    'participantReturnFocus.focus({preventScroll: true});',
    "renderParticipantDetail(data, 'loading');",
    'startEntityLoading(body)',
    'setEntityFooterBusy(dialog, loading);'
)) {
    if (-not $participant.Contains($needle)) {
        throw "Missing participant dialog contract: $needle"
    }
}

foreach ($needle in @(
    "openAdvancedSettingsModalNow(root, item, returnFocus, 'loading')",
    "emitEditorInspectionCompletion(root, type, 'open-editor');",
    'name="imagefile" accept="image/*"',
    'data-easystud-advanced-file-input="1"',
    'data-easystud-delete-picture-input="1"',
    "renderAdvancedInput(labels.advancedsettingsenrolmentkey || '',",
    '.map(row => row.map(getCsvValue).join(',
    'easystudCompleteEditorClose'
)) {
    if (-not $advanced.Contains($needle)) {
        throw "Missing group/grouping dialog contract: $needle"
    }
}

# Sticky footer outside the scrolling body; Guide targets keep the footer class.
if ($advanced -notmatch '(?s)data-easystud-advanced-settings-body="1"></div>.*?easyedu-entity-dialog__actions.*?advancedsettingsnative.*?data-easystud-close-advanced-settings.*?type="submit".*?</form>') {
    throw 'Group/Grouping footer must follow the body: Edit in Moodle, Cancel, then Save.'
}
if ($template -notmatch '(?s)data-easystud-user-modal-body="1"></div>\s*<div class="local-groupimport-easystud-modal__footer easyedu-entity-dialog__actions local-groupimport-easystud-entity__footer">.*?data-easystud-user-profile-link.*?data-easystud-close-user-modal') {
    throw 'Participant footer must follow the body: Moodle profile link, then Close.'
}

foreach ($needle in @(
    '.local-groupimport-easystud-modal__dialog.local-groupimport-easystud-entity {',
    '.local-groupimport-easystud-entity__pill {',
    '.local-groupimport-easystud-entity__footer {',
    '.easyedu-ui .easyedu-entity-dialog__actions {'
)) {
    if (-not $styles.Contains($needle)) {
        throw "Generated Student Management stylesheet is missing: $needle"
    }
}

Write-Output 'EasyStud entity dialog (card modal) contract passed.'
