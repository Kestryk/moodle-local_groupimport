param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ledger = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $ledger.consumerSync.studentCompletion20261003
foreach ($entry in $pin.modules.PSObject.Properties) {
    $embedded = & git -C $root hash-object $entry.Name
    $canonical = & git -C $KitRoot hash-object $entry.Name
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical -or $embedded -ne $entry.Value) {
        throw "Completion module/pin drift: $($entry.Name)"
    }
}
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
$confirm = [regex]::Match($template, '(?s)class="local-groupimport-easystud-modal easyedu-modal-layer"\s+data-easystud-confirm-modal="1".*?(?=\n    <div\s+class="local-groupimport-easystud-modal)').Value
foreach ($role in @('easyedu-confirmation-dialog--danger', 'easyedu-confirmation-dialog__header',
    'easyedu-modal-title', 'easyedu-dialog-description', 'easyedu-confirmation-dialog__actions',
    'easyedu-button--secondary', 'easyedu-button--danger', 'data-easystud-close-confirm-modal',
    'data-easystud-confirm-modal-submit')) {
    if (-not $confirm.Contains($role)) { throw "Missing native confirmation role/hook: $role" }
}
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
$choice = [regex]::Match($source, '(?s)const openGroupDropModeModal =.*?(?=const getSelectionInput =)').Value
foreach ($needle in @('easyedu-modal-layer', 'easyedu-confirmation-dialog', 'easyedu-modal-title',
    'easyedu-dialog-description', 'easyedu-confirmation-dialog__actions', 'easyedu-button--secondary',
    'data-easystud-choice-copy', 'data-easystud-choice-move', 'hideEasyStudModal(modal, () => modal.remove())',
    'oncopy();', 'onmove();')) {
    if (-not $choice.Contains($needle)) { throw "Lost native choice contract: $needle" }
}
foreach ($slice in @($confirm, $choice)) {
    if ($slice -match 'class="(?:btn |h5 )|\bstyle=') { throw 'Confirmation/choice retained legacy/inline paint.' }
}
if ($choice -match 'dialog--confirm|dialog--danger|button--danger') { throw 'Copy/Move choice became destructive.' }
$localStyle = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_modals.scss')
if ($localStyle.Contains('&-modal__dialog--confirm')) { throw 'Local confirmation skin was not removed.' }
$proof = Get-Content -Raw -LiteralPath (Join-Path $root $pin.dangerReadback) | ConvertFrom-Json
if ($proof.actions.Count -ne 5) { throw 'Danger Standard/Library states incomplete.' }
foreach ($state in $proof.actions) {
    foreach ($shape in @($state.library, $state.standard)) {
        if (-not $shape.label.contained -or [math]::Abs($shape.label.centerXDelta) -gt 1 -or
            [math]::Abs($shape.label.centerYDelta) -gt 1 -or $shape.label.fontFamily -ne 'Inter' -or
            $shape.label.fontSize -ne '14.08' -or [math]::Abs($shape.height - 37.6) -gt .01) {
            throw 'Recorded Danger density/paint drift.'
        }
    }
}
& (Join-Path $KitRoot 'scripts/test-confirmation-dialog-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Canonical confirmation compile gate failed.' }
$foundations = Get-Content -Raw -LiteralPath (Join-Path $root $pin.confirmationFoundationReadback) | ConvertFrom-Json
if ($foundations.pairs.Count -ne 4) { throw 'Foundation confirmation pairs incomplete.' }
foreach ($pair in $foundations.pairs) {
    foreach ($shape in @($pair.library, $pair.standard)) {
        if ($shape.title.Count -ne 1 -or $shape.title[0].font -ne 'Inter' -or
            $shape.title[0].size -ne '16' -or $shape.title[0].weight -ne '700' -or
            $shape.description[0].size -ne '13' -or $shape.actions.Count -ne 2) {
            throw 'Recorded Foundation confirmation anatomy/type drift.'
        }
        foreach ($action in $shape.actions) {
            if (-not $action.contained -or [math]::Abs($action.paintDeltaX) -gt 1 -or
                [math]::Abs($action.paintDeltaY) -gt 1 -or [math]::Abs($action.height - 37.6) -gt .01) {
                throw 'Recorded Foundation confirmation action paint drift.'
            }
        }
        if ([math]::Abs($shape.actions[1].rightInset - 17) -gt .01) { throw 'Confirmation footer not at inline end.' }
    }
}
$products = Get-Content -Raw -LiteralPath (Join-Path $root $pin.confirmationProductReadback) | ConvertFrom-Json
if ($products.examples.Count -ne 6) { throw 'Product confirmation examples incomplete.' }
foreach ($example in $products.examples) {
    if ($example.titleStyle.weight -ne '700' -or $example.titleStyle.size -ne '16' -or
        $example.descriptionStyle.size -ne '13' -or $example.actions.Count -ne 2) {
        throw 'Product confirmation typography/actions drift.'
    }
    foreach ($action in $example.actions) {
        if (-not $action.contained -or [math]::Abs($action.paintDeltaX) -gt 1 -or
            [math]::Abs($action.paintDeltaY) -gt 1 -or [math]::Abs($action.height - 37.6) -gt .01) {
            throw 'Recorded product confirmation action paint drift.'
        }
    }
    if ([math]::Abs($example.actions[1].rightInset - 17) -gt .01) { throw 'Product confirmation footer not at inline end.' }
}
Write-Output 'PASS: canonical confirmation/choice classes, unchanged callbacks/Motion, five Danger states, four Foundation pairs and six product examples. Source/readback proof, not a fresh browser or human PASS.'
