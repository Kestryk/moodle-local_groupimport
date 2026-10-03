param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ledger = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $ledger.consumerSync.studentModalFooters
$successor = $ledger.consumerSync.studentCompletion20261003
$proof = Get-Content -Raw -LiteralPath (Join-Path $root $pin.penpotReadback) | ConvertFrom-Json
foreach ($module in $pin.modules.PSObject.Properties) {
    $embedded = & git -C $root hash-object $module.Name
    $canonical = & git -C $KitRoot hash-object $module.Name
    $currentPin = if ($successor.modules.($module.Name)) { $successor.modules.($module.Name) } else { $module.Value }
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical -or $embedded -ne $currentPin -or
        $proof.source.modules.($module.Name) -ne $module.Value) { throw "Canonical current or historical footer module/pin drift: $($module.Name)" }
}
$css = & git -C $root hash-object styles.css
foreach ($module in $pin.browserCandidates.PSObject.Properties) {
    $name = switch ($module.Name) {
        'entity' { 'student-entity-dialog-chrome.spec.js' }
        'move' { 'student-move-dialog-audit.spec.js' }
        'message' { 'student-message-footer-preview.spec.js' }
    }
    $actual = & git -C $root hash-object ("tools/playwright/$name")
    if ($actual -ne $module.Value) { throw "Current scenario pin drift: $name" }
}
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
if ($template -notmatch 'class="local-groupimport-easystud-modal easyedu-modal-layer"\s+data-easystud-move-modal="1"') {
    throw 'Move must consume the canonical modal layer on its fixed root.'
}
$currentCss = if ($successor.generatedCssBlob) { $successor.generatedCssBlob } else { $pin.generatedCssBlob }
if ($css -ne $currentCss -or $pin.generatedCssBlob -ne $proof.source.generatedCssBlob) { throw 'Current or historical footer generated CSS pin drift.' }
if ($proof.foundations.pairs.Count -ne 4 -or $proof.product.destination.Count -ne 6 -or
    $proof.product.message.Count -ne 2 -or $proof.product.entity.Count -ne 3) { throw 'Incomplete recorded footer coverage.' }
foreach ($pair in $proof.foundations.pairs) {
    if (-not $pair.visibleFingerprintMatch -or $pair.differingIndices.Count -ne 0 -or $pair.buttons.Count -ne 2) {
        throw 'Recorded Foundation Standard/Library footer drift.'
    }
    foreach ($button in $pair.buttons) {
        if (-not $button.labelContained -or [math]::Abs($button.paintCenterDelta) -gt 1) { throw 'Foundation label paint drift.' }
    }
}
foreach ($record in @($proof.product.destination) + @($proof.product.message) + @($proof.product.entity)) {
    $compact = $record.kind.StartsWith('message-')
    $height = if ($compact) { 26 } else { 37.6 }
    $font = if ($compact) { '12' } else { '14.08' }
    if ($record.actionRightDelta -gt 1 -or $record.heightSpread -gt 1) { throw 'Right inset or matched pair drift.' }
    foreach ($button in $record.buttons) {
        if (-not $button.labelContained -or -not $button.boxContained -or
            $button.fontFamily -ne 'Inter' -or $button.fontSize -ne $font -or
            [math]::Abs($button.height - $height) -gt .01 -or [math]::Abs($button.paintCenterDelta) -gt 1) {
            throw "Footer density/type/paint drift: $($record.kind)"
        }
    }
}
if ($proof.product.entity[0].buttons.Count -ne 1 -or
    $proof.product.entity[0].buttons[0].label -ne 'Open native Moodle profile') { throw 'Readonly Participant gained editing actions.' }
& (Join-Path $KitRoot 'scripts/test-modal-footer-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Canonical footer compile contract failed.' }
Write-Output 'PASS: exact current source/CSS pins, preserved historical four paired Foundations and eleven product readbacks. Historical readback is not proof of the successor CSS, fresh browser or human PASS.'
