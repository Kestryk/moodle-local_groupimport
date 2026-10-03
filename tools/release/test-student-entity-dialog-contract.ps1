param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/_dialog-classes.scss'
$embedded = & git -C $root hash-object $module
$canonical = & git -C $KitRoot hash-object $module
if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical) { throw 'Entity dialog Kit source drift.' }
$ledger = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
foreach ($entry in @($ledger.consumerSync.studentEntityDialogs, $ledger.consumerSync.studentLookupDialogs,
    $ledger.consumerSync.studentCompactPortals)) {
    if ($entry.modules.$module -ne $canonical) { throw 'Current dialog module pin drift in consumer ledger.' }
}
$proof = Get-Content -Raw -LiteralPath (Join-Path $root $ledger.consumerSync.studentEntityDialogs.penpotReadback) |
    ConvertFrom-Json
if ($proof.foundations.pairs.Count -ne 2 -or
    $proof.product.hosts.Count -ne 3) { throw 'Entity header paired publication/source evidence missing.' }
foreach ($pair in $proof.foundations.pairs) {
    if (-not $pair.visibleFingerprintMatch -or $pair.visibleEscapes.Count -ne 0) {
        throw 'Foundation Standard/Library visible anatomy drift.'
    }
    foreach ($text in $pair.texts) {
        if ($text.fontFamily -ne 'Inter') { throw 'Foundation entity header font drift.' }
    }
}
foreach ($entityRecord in $proof.product.hosts) {
    if ($entityRecord.visibleEscapes.Count -ne 0) {
        throw 'Recorded product entity chrome overflow.'
    }
    foreach ($text in $entityRecord.header.texts) {
        if ($text.fontFamily -ne 'Inter' -or $text.fontSize -notin @('10', '16')) {
            throw 'Product entity header typography drift.'
        }
    }
}
$footer = Get-Content -Raw -LiteralPath (Join-Path $root $ledger.consumerSync.studentEntityDialogs.footerReadback) |
    ConvertFrom-Json
if ($footer.source.modules.$module -ne $canonical -or $footer.product.entity.Count -ne 3) {
    throw 'Current entity footer source/readback missing.'
}
foreach ($record in $footer.product.entity) {
    if ($record.actionRightDelta -gt 1 -or $record.heightSpread -gt 1) { throw 'Entity right-aligned matched footer drift.' }
    foreach ($action in $record.buttons) {
        if (-not $action.labelContained -or -not $action.boxContained -or [math]::Abs($action.paintCenterDelta) -gt 1 -or
            $action.fontSize -ne '14.08' -or $action.fontFamily -ne 'Inter' -or
            ($null -ne $action.iconLabelBoxGap -and [math]::Abs($action.iconLabelBoxGap - 10.4) -gt .01)) {
            throw 'Current entity action paint/type/gap readback drift.'
        }
    }
}
if ($proof.product.hosts[0].actions.Count -ne 1 -or
    $proof.product.hosts[0].actions[0].label -ne 'Open native Moodle profile') {
    throw 'Participant Penpot specimen must remain read-only with optional native action only.'
}
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
$advanced = [regex]::Match($source, '(?s)const openAdvancedSettingsModal =.*?(?=const applyAdvancedGroupUpdate =)').Value
$participant = [regex]::Match($source, '(?s)const bindParticipantModal =.*?(?=// The shared Guide owns)').Value
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
$user = [regex]::Match($template, '(?s)class="local-groupimport-easystud-modal easyedu-modal-layer"\s+data-easystud-user-modal="1".*?(?=\n    <div\s+class="local-groupimport-easystud-modal")').Value
foreach ($role in @('easyedu-modal-layer', 'easyedu-entity-dialog', 'easyedu-entity-dialog__header',
    'easyedu-entity-dialog__heading', 'easyedu-entity-dialog__icon', 'easyedu-entity-dialog__eyebrow',
    'easyedu-entity-dialog__body', 'easyedu-modal-title')) {
    if (-not $advanced.Contains($role) -or -not $user.Contains($role)) { throw "Missing shared role: $role" }
}
foreach ($slice in @($advanced, $user)) {
    if ($slice -match '\bstyle=|class="h5 mb-0"') { throw 'Entity chrome still has inline paint or legacy title.' }
}
foreach ($needle in @('updategroupadvanced', 'updategroupingadvanced', "'name'", "'idnumber'",
    "'enrolmentkey'", "'description'", 'advancedsettingsconfigdata', 'renderAdvancedListSection',
    'name="imagefile" accept="image/*"', 'name="deletepicture"', 'data-easystud-settings-toggle-state',
    'easyedu-entity-dialog__actions', 'type="submit" class="btn easyedu-button easyedu-action-with-icon"',
    'btn easyedu-button--secondary', 'advancedsettingsnative', "'data-easystud-settings-list-state'")) {
    if (-not $advanced.Contains($needle)) { throw "Lost conditional content/action: $needle" }
}
foreach ($needle in @('data.username', 'data.idnumber', 'data.institution', 'data.department',
    'data.city', 'data.country', 'data.lang', 'data.roles', 'data.groups', 'data.groupings',
    'data.description', 'data.profileurl', 'bindParticipantDetailLists(body)', 'showEasyStudModal(modal)',
    'hideEasyStudModal(modal, () =>', 'participantReturnFocus.focus({preventScroll: true});',
    'closeParticipantModal();', 'easyedu-entity-dialog__actions')) {
    if (-not $participant.Contains($needle)) { throw "Lost read-only Participant content: $needle" }
}
if ($participant -match 'type="submit"|labels\.save|labels\.cancel') { throw 'Read-only Participant gained editing actions.' }
$settings = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_settings-modal.scss')
if ($settings.Contains('&-settings-modal &-modal__footer {') -or $settings.Contains('&-settings-modal__heading {') -or
    $settings.Contains('&-settings-modal__native > .btn {')) { throw 'Consumer retains a duplicate entity chrome/action skin.' }
foreach ($needle in @('Motion.collapse(content', 'Motion.expand(content', 'details.open = false;', '<table hidden>')) {
    if (-not $source.Contains($needle)) { throw "Native Motion/CSV contract missing: $needle" }
}
$build = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/build/course_manager.min.js')
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
foreach ($role in @('easyedu-entity-dialog__header', 'easyedu-entity-dialog__actions', 'easyedu-modal-title')) {
    if (-not $build.Contains($role) -or -not $css.Contains($role)) { throw "Generated entity role missing: $role" }
}
Write-Output 'PASS: canonical module/pins, recorded paired chrome/readback, conditional/read-only data and unchanged Motion/CSV source contracts. Recorded evidence is not a fresh browser or human validation.'
