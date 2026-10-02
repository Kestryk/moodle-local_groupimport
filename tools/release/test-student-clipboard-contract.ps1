param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentClipboardFields
$dialogPin = $manifest.consumerSync.studentLookupDialogs
foreach ($entry in $dialogPin.modules.PSObject.Properties) {
    $embedded = & git -C $root hash-object $entry.Name
    $canonical = & git -C $KitRoot hash-object $entry.Name
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $entry.Value -or $canonical -ne $embedded) {
        throw "Lookup dialog source pin drift: $($entry.Name)"
    }
}
foreach ($pair in @(@($pin.module, $pin.moduleBlob), @($pin.paintModule, $pin.paintBlob),
    @($pin.formsModule, $pin.formsBlob))) {
    $embedded = & git -C $root hash-object $pair[0]
    $canonical = & git -C $KitRoot hash-object $pair[0]
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $pair[1] -or $canonical -ne $embedded) {
        throw "Clipboard source pin drift: $($pair[0])"
    }
}
$modals = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_modals.scss')
$field = [regex]::Match($modals, '(?s)\[data-easystud-paste-box\]\s*\{([^}]+)\}')
if (-not $field.Success -or ($field.Groups[1].Value -replace '\s+', ' ').Trim() -cne '@include easyedu.foundation-textarea;') {
    throw 'Clipboard field must be one canonical recipe without a local skin.'
}
$structure = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
$scope = [regex]::Match($structure, '(?s)\[data-easystud-paste-results\]\s*\{(.*?)\n  \}')
foreach ($pair in @(@('valid', 'success'), @('invalid', 'error'))) {
    $token = [regex]::Match($scope.Groups[1].Value, 'token--' + $pair[0] + '\s*\{([^}]+)\}')
    if (-not $token.Success -or ($token.Groups[1].Value -replace '\s+', ' ').Trim() -cne "@include easyedu.detected-token($($pair[1]));") {
        throw "Clipboard lookup result must be recipe-only: $($pair[0])"
    }
}
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
$clipboard = [regex]::Match($template, '(?s)<div\s+class="[^"]*easyedu-modal-layer"\s+data-easystud-clipboard-modal="1".*?(?=\n    <div\s+class="local-groupimport-easystud-modal")')
foreach ($role in @('easyedu-lookup-dialog', 'easyedu-lookup-dialog__header',
    'easyedu-lookup-dialog__body', 'easyedu-lookup-dialog__description', 'easyedu-modal-title')) {
    if (-not $clipboard.Success -or -not $clipboard.Value.Contains($role)) { throw "Missing lookup class role: $role" }
}
if ($clipboard.Value.Contains('modal__dialog--confirm') -or $clipboard.Value -match '\bstyle=') {
    throw 'Clipboard must use neutral public classes, not danger chrome or inline paint.'
}
$textarea = [regex]::Matches($template, '(?s)<textarea\b[^>]*data-easystud-paste-box[^>]*>')
if ($textarea.Count -ne 1 -or $textarea[0].Value -notmatch 'rows="6"') { throw 'Native Clipboard rows/instance count changed.' }
if ($template -notmatch '(?s)data-easystud-paste-results="1"[^>]*aria-live="polite"') { throw 'Native Clipboard announcement missing.' }
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
foreach ($suffix in @('', ':focus', ':focus-visible', '::placeholder', ':disabled')) {
    if (-not $css.Contains('[data-easystud-paste-box]' + $suffix)) { throw "Missing compiled Clipboard field path: $suffix" }
}
foreach ($state in @('valid', 'invalid')) {
    if (-not $css.Contains("[data-easystud-paste-results] .local-groupimport-easystud-token--$state")) {
        throw "Missing compiled Clipboard lookup state: $state"
    }
}
Write-Output 'PASS: Clipboard canonical field/result pins, recipe-only adapters, native rows/live announcement and generated states.'
