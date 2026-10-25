param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
foreach ($module in @('scss/easyedu/adapters/_moodle-message-dialog.scss', 'scss/easyedu/_dialog-classes.scss')) {
    $canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $module)
    $embedded = Get-Content -Raw -LiteralPath (Join-Path $root $module)
    if ($canonical.Replace("`r`n", "`n") -cne $embedded.Replace("`r`n", "`n")) {
        throw "Portal/dialog class parity failed: $module"
    }
}
$adapter = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_modals.scss')
$message = $adapter.Substring($adapter.IndexOf('.local-groupimport-easystud-message-modal {'))
if (-not $message.Contains('@include messages.moodle-message-dialog;') -or $message -match '#[0-9a-fA-F]{3,8}|font-weight:|border-radius:') {
    throw 'Consumer message portal must consume the canonical recipe, not recreate its skin.'
}
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
foreach ($needle in @('relayWorkspaceTheme(document.getElementById', 'easyedu-message-dialog__field',
    "textarea.setAttribute('rows', '10')", 'node.easystudMessageContentObserver.disconnect()')) {
    if (-not $source.Contains($needle)) { throw "Missing native portal bridge: $needle" }
}
Write-Output 'PASS: canonical message/dialog parity, recipe-only adapter and native portal hooks.'
