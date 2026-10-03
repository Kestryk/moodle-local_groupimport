param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$ledger = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $ledger.consumerSync.studentModalClose20261003
if ($ledger.version -ne '0.4.66' -or $pin.kitCommit -ne 'b2f9cb67ca14f8c203c1b24018f6d531fce6a9c1') {
    throw 'Modal Close is not pinned to Kit 0.4.66.'
}

foreach ($module in $pin.modules.PSObject.Properties) {
    $actual = & git -C $root hash-object $module.Name
    if ($LASTEXITCODE -ne 0 -or $actual -ne $module.Value) {
        throw "Modal Close source pin drift: $($module.Name)"
    }
}

$embedded = & git -C $root hash-object 'scss/easyedu/components/_buttons.scss'
$canonical = & git -C $KitRoot hash-object 'scss/easyedu/components/_buttons.scss'
if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical) {
    throw 'Embedded Close-button source differs from the canonical Kit.'
}

$modals = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_modals.scss')
$tutorial = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_tutorial.scss')
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
$manager = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
if (-not $modals.Contains('@include easyedu.close-button;') -or $tutorial.Contains('&-modal__close')) {
    throw 'Consumer still forks or omits the shared modal Close recipe.'
}
$block = [regex]::Match($css, '(?s)\.local-groupimport-easystud-modal__close\s*\{([^}]+)\}')
foreach ($declaration in @('height: 1.9rem;', 'min-height: 1.9rem;', 'min-width: 1.9rem;', 'width: 1.9rem;')) {
    if (-not $block.Success -or -not $block.Groups[1].Value.Contains($declaration)) {
        throw "Compiled modal Close geometry drift: $declaration"
    }
}
if (-not $css.Contains('background: var(--easyedu-danger-soft);') -or
    -not $css.Contains('color: var(--easyedu-danger);')) {
    throw 'Compiled modal Close semantic hover paint is missing.'
}
foreach ($needle in @(
    'const openAdvancedSettingsModal = (root, item, returnFocus = null) =>',
    'const closeModal = () => hideEasyStudModal(modal, () => {',
    'returnFocus.focus({preventScroll: true});',
    'openAdvancedSettingsModal(root, item, button);',
    'openAdvancedSettingsModal(root, target, opener);'
)) {
    if (-not $manager.Contains($needle)) { throw "Modal Close focus-return contract missing: $needle" }
}

$browser = Get-Content -Raw -LiteralPath (Join-Path $root $pin.currentPreviewProof) | ConvertFrom-Json
$penpot = Get-Content -Raw -LiteralPath (Join-Path $root $pin.penpotReadback) | ConvertFrom-Json
if ($browser.status -ne 'passed' -or $browser.cases.count -ne 9 -or
    $browser.cases.closeSizePx -ne 30.4 -or $browser.cases.maxGlyphCenterDeltaPx -gt 1 -or
    -not $browser.cases.desktopRealOpenerFocusRestored -or $browser.cases.businessPostInvoked) {
    throw 'Recorded native modal Close evidence is incomplete.'
}
if ($penpot.foundationProvider.componentId -ne '761eab91-8390-80e8-8008-98c317ebe621' -or
    $penpot.foundationProvider.width -ne 30.4 -or $penpot.entityHeaderInstances.Count -ne 3 -or
    $penpot.productLocalCloseComponents -ne 0) {
    throw 'Recorded linked Penpot modal Close evidence is incomplete.'
}

& (Join-Path $KitRoot 'scripts/test-close-button-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Canonical Kit Close-button compile contract failed.' }
Write-Output 'PASS: Kit 0.4.66 Close source, generated consumer, linked Penpot S provider and nine native cases.'
