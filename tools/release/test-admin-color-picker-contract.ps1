$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Read-RequiredFile([string]$RelativePath) {
    $path = Join-Path $root $RelativePath
    if (-not (Test-Path -LiteralPath $path)) { throw "Missing required file: $RelativePath" }
    return Get-Content -LiteralPath $path -Raw
}

$settings = Read-RequiredFile 'settings.php'
$script = Read-RequiredFile 'js\admin_settings_loading.js'
$styles = Read-RequiredFile 'scss\views\_admin-settings.scss'
$foundation = Read-RequiredFile 'scss\easyedu\_foundation-classes.scss'
$forms = Read-RequiredFile 'scss\easyedu\components\_forms.scss'

foreach ($needle in @("'data-easyedu-color-picker' => '1'",
    "'name' => `$this->get_full_name()",
    "'id' => `$this->get_id() . '_picker'",
    "'pattern' => '#[0-9A-Fa-f]{6}'",
    "'class' => 'easyedu-color-picker__hex'")) {
    if (-not $settings.Contains($needle)) { throw "Missing authoritative colour setting contract: $needle" }
}

$swatchBlock = [regex]::Match($settings, '(?s)\$swatchattributes\s*=\s*\[(.*?)\];')
if (-not $swatchBlock.Success) { throw 'Missing progressive swatch attributes.' }
if ($swatchBlock.Groups[1].Value -match "'name'\s*=>") {
    throw 'The progressive native swatch must remain unnamed.'
}

foreach ($needle in @("querySelectorAll('[data-easyedu-color-picker]')",
    "control.classList.toggle('is-invalid', !valid)",
    "hex.value = swatch.value.toUpperCase()",
    "swatch.value = hex.value")) {
    if (-not $script.Contains($needle)) { throw "Missing colour synchronization contract: $needle" }
}

foreach ($needle in @('.easyedu-color-picker--small', '.easyedu-color-picker--large',
    '.easyedu-color-picker__swatch', '.easyedu-color-picker__hex',
    '@mixin color-picker-hex-input')) {
    if (-not ($foundation.Contains($needle) -or $forms.Contains($needle))) {
        throw "Missing embedded Kit colour-picker primitive: $needle"
    }
}

foreach ($legacy in @('@include easyedu.color-picker-control',
    '@include easyedu.color-picker-input', '@include easyedu.color-picker-value')) {
    if ($styles.Contains($legacy)) { throw "Consumer-owned colour paint remains: $legacy" }
}

Write-Output 'PASS: EasyStud consumes the public colour picker with named Hex persistence and unnamed swatch enhancement.'
