param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ledger = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $ledger.consumerSync.studentMessageModalCompletion20261003

if ($ledger.version -ne '0.4.70' -or $pin.kitCommit -ne '6da5316') {
    throw 'Message modal completion is not pinned to Kit 0.4.70.'
}
foreach ($module in $pin.modules.PSObject.Properties) {
    $actual = & git -C $root hash-object $module.Name
    if ($LASTEXITCODE -ne 0 -or $actual -ne $module.Value) {
        throw "Message modal source/generated pin drift: $($module.Name)"
    }
}
foreach ($module in @(
    'scss/easyedu/adapters/_moodle-message-dialog.scss',
    'scss/easyedu/components/_modals.scss'
)) {
    $embedded = & git -C $root hash-object $module
    $canonical = & git -C $KitRoot hash-object $module
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical) {
        throw "Embedded message module differs from Kit: $module"
    }
}

$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
foreach ($needle in @(
    '.local-groupimport-easystud-message-modal .modal-header [data-action=hide]',
    'height: 1.9rem;',
    'resize: none;',
    '.local-groupimport-easystud-message-modal .modal-body .loading-icon',
    'background: transparent;',
    'box-shadow: none;'
)) {
    if (-not $css.Contains($needle)) { throw "Missing compiled message-modal contract: $needle" }
}
if ($css -match '(?s)\.local-groupimport-easystud-message-modal \.modal-body \.loading-icon\s*\{[^}]*radial-gradient' -or
    $css -match '(?s)\.local-groupimport-easystud-message-modal \.modal-body \.loading-icon\s*\{[^}]*0 0\.45rem 1\.25rem') {
    throw 'Legacy blue halo remains in the message loader.'
}
$scenario = Get-Content -Raw -LiteralPath (Join-Path $root 'tools/playwright/student-message-footer-preview.spec.js')
foreach ($needle in @("toHaveCSS('resize', 'none')", 'closeGeometry.width', 'data-action="hide"')) {
    if (-not $scenario.Contains($needle)) { throw "Missing supervised message assertion: $needle" }
}

& (Join-Path $KitRoot 'scripts/test-compact-portals-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Canonical compact portal contract failed.' }
Write-Output 'PASS: Kit 0.4.70 message header, field and loader are synchronized in the consumer.'
