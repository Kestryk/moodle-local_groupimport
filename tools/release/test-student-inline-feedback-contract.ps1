param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentInlineFeedback
foreach ($pair in @(@($pin.formsModule, $pin.formsBlob), @($pin.buttonsModule, $pin.buttonsBlob))) {
    $embedded = & git -C $root hash-object $pair[0]
    $canonical = & git -C $KitRoot hash-object $pair[0]
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $pair[1] -or $canonical -ne $embedded) {
        throw "Inline feedback source pin drift: $($pair[0])"
    }
}
$structure = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
$scope = [regex]::Match($structure, '\[data-easystud-group-email-result\],\s*\[data-easystud-grouping-groups-result\]\s*\{(.*?)\n  \}', 'Singleline')
if (-not $scope.Success) { throw 'Missing bounded identifier-result adapter.' }
foreach ($pair in @(@('valid', 'success'), @('invalid', 'error'))) {
    $match = [regex]::Match($scope.Groups[1].Value, 'token--' + $pair[0] + '\s*\{([^}]+)\}')
    $actual = ($match.Groups[1].Value -replace '\s+', ' ').Trim()
    if (-not $match.Success -or $actual -cne "@include easyedu.detected-token($($pair[1]));") {
        throw "Identifier feedback skin is not recipe-only: $($pair[0])"
    }
}
$controls = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_control-typography.scss')
if ($controls -notmatch '(?s)\[data-easystud-container-search-cancel\],\s*\[data-easystud-rename-cancel\]\s*\{\s*@include foundations.foundation-button\(\$secondary: true, \$density: compact\);\s*\}') {
    throw 'Search Cancel is not in the shared compact secondary family.'
}
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
foreach ($resultHost in @('group-email-result', 'grouping-groups-result')) {
    foreach ($state in @('valid', 'invalid')) {
        $selector = ".local-groupimport-easystud [data-easystud-$resultHost] .local-groupimport-easystud-token--$state"
        if (-not $css.Contains($selector)) { throw "Missing compiled selector: $selector" }
    }
}
Write-Output 'PASS: shared inline feedback and Cancel pins, bounded recipe adapters and generated selectors.'
