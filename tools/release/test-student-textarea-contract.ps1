param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentNativeTextareas
foreach ($pair in @(@($pin.module, $pin.moduleBlob), @($pin.paintModule, $pin.paintBlob),
    @('scss/easyedu/_components.scss', $pin.exportsBlob))) {
    $embedded = & git -C $root hash-object $pair[0]
    $canonical = & git -C $KitRoot hash-object $pair[0]
    # New opt-in exports are additive; retain the historical textarea proof pin.
    $expectedPin = if ($pair[0] -eq 'scss/easyedu/_components.scss' -and
        $manifest.consumerSync.studentEntityFieldsExtraction.modules.($pair[0])) {
        $manifest.consumerSync.studentEntityFieldsExtraction.modules.($pair[0])
    } else { $pair[1] }
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $expectedPin -or $canonical -ne $embedded) {
        throw "Textarea pin drift: $($pair[0])"
    }
}
$structure = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
$scope = [regex]::Match($structure, '(?s)\[data-easystud-group-email-box\],\s*\[data-easystud-grouping-groups-box\]\s*\{([^}]+)\}')
if (-not $scope.Success -or ($scope.Groups[1].Value -replace '\s+', ' ').Trim() -cne '@include easyedu.foundation-textarea;') {
    throw 'Identifier textarea adapter must be one canonical recipe, no local skin.'
}
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
foreach ($kind in @('group-email', 'grouping-groups')) {
    $selector = "[data-easystud-$kind-box]"
    foreach ($suffix in @('', ':focus', ':focus-visible', '::placeholder', ':disabled')) {
        if (-not $css.Contains($selector + $suffix)) { throw "Missing generated multiline path: $kind/$suffix" }
    }
}
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
foreach ($field in [regex]::Matches($template, '(?s)<textarea\b[^>]*data-easystud-(?:group-email|grouping-groups)-box[^>]*>')) {
    if ($field.Value -notmatch 'rows="3"') { throw 'Native identifier row count changed.' }
}
Write-Output 'PASS: canonical multiline module/paint/export pins, recipe-only identifier adapter and native rows.'
