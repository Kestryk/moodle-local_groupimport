param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    [Parameter(Mandatory = $true)][string]$BaselineCssPath
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pin = (Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw |
    ConvertFrom-Json).consumerSync.studentEntityFieldsExtraction
if ($null -eq $pin -or @($pin.modules.PSObject.Properties).Count -ne 2) {
    throw 'Entity field canonical source pins are missing.'
}
foreach ($entry in $pin.modules.PSObject.Properties) {
    $embedded = & git -C $root hash-object $entry.Name
    $canonical = & git -C $KitRoot hash-object $entry.Name
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical -or $embedded -ne $entry.Value) {
        throw "Entity field canonical module/pin drift: $($entry.Name)"
    }
}
$source = Get-Content -LiteralPath (Join-Path $root 'scss/components/_settings-modal.scss') -Raw
foreach ($pair in @(
    @('&-settings-modal__field', 'entity-settings-field'),
    @('&-settings-modal__field--readonly', 'entity-readonly-field'),
    @('&-detail__field', 'entity-detail-field')
)) {
    if (-not $source.Contains("$($pair[0]) {`n    @include easyedu.$($pair[1]);") -and
        -not $source.Contains("$($pair[0]) {`r`n    @include easyedu.$($pair[1]);")) {
        throw "Missing pure Kit field adapter: $($pair[0])"
    }
    $adapter = [regex]::Match($source, [regex]::Escape($pair[0]) + '\s*\{([^{}]*)\}').Groups[1].Value
    if ($adapter -match '(?:background|color|border|font|padding|box-shadow)\s*:') {
        throw "Consumer-owned field paint returned: $($pair[0])"
    }
}
& (Join-Path $root 'tools/release/test-student-card-surface-contract.ps1') -KitRoot $KitRoot -BaselineCssPath $BaselineCssPath
if ($LASTEXITCODE -ne 0) { throw 'Complete compiled CSS equivalence failed.' }
Write-Output 'PASS: opt-in settings/readonly/detail body field paint comes from the canonical Kit; complete CSS preserved. Class-only/full-body/Penpot acceptance remains separate.'
