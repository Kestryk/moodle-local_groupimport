param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentNativeTextFields
foreach ($pair in @(@($pin.module, $pin.moduleBlob), @('scss/easyedu/_tokens.scss', $pin.tokensBlob),
    @('scss/easyedu/_components.scss', $pin.exportsBlob))) {
    $embedded = & git -C $root hash-object $pair[0]
    $canonical = & git -C $KitRoot hash-object $pair[0]
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $pair[1] -or $canonical -ne $embedded) {
        throw "Text-field pin drift: $($pair[0])"
    }
}
$forms = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_forms.scss')
$scope = [regex]::Match($forms, '(?s)&-create \.form-control,\s*&-rename \.form-control\s*\{([^}]+)\}')
if (-not $scope.Success -or ($scope.Groups[1].Value -replace '\s+', ' ').Trim() -cne '@include easyedu.foundation-text-field;') {
    throw 'Native field adapter must remain one canonical recipe, no local skin.'
}
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
foreach ($kind in @('create', 'rename')) {
    foreach ($suffix in @('', ':focus', ':focus-visible', '::placeholder', ':disabled')) {
        if (-not $css.Contains(".local-groupimport-easystud-$kind .form-control$suffix")) {
            throw "Missing compiled field path: $kind/$suffix"
        }
    }
}
Write-Output 'PASS: canonical field module/tokens/exports, recipe-only bounded adapter and generated states.'
