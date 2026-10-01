param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    # Normalized full CSS hash captured before this source-only extraction.
    [string]$BaselineSha256
)
$ErrorActionPreference = 'Stop'
$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$relative = 'scss/easyedu/components/_card-metadata.scss'
$manifest = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$blob = & git -C $pluginRoot hash-object $relative
if ($LASTEXITCODE -ne 0 -or $blob -ne $manifest.consumerSync.studentMetadataExtraction.moduleBlob) {
    throw 'Embedded metadata differs from its recorded canonical blob.'
}
$canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $relative)
$embedded = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot $relative)
if ($canonical.Replace("`r`n", "`n") -cne $embedded.Replace("`r`n", "`n")) {
    throw 'Canonical and embedded metadata modules differ.'
}
if ($canonical -match '(?m)^\s*(transition|animation|overflow|display:\s*none)|@media') {
    throw 'Metadata recipe must not own motion, clipping, visibility or breakpoints.'
}
$participants = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss/components/_participants.scss')
$mobile = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss/responsive/_mobile.scss')
foreach ($recipe in @('card-metadata', 'card-metadata-row', 'card-metadata-label', 'card-metadata-values')) {
    if (-not $participants.Contains('@include easyedu.' + $recipe + ';')) {
        throw "Missing shared metadata adapter: $recipe"
    }
}
if (-not $mobile.Contains('@include easyedu.card-metadata-row-stacked;')) {
    throw 'Mobile stacked row must consume the shared recipe.'
}
$fixture = @'
@use "easyedu" as kit;
.meta { @include kit.card-metadata; }
.row { @include kit.card-metadata-row; }
.label { @include kit.card-metadata-label; }
.values { @include kit.card-metadata-values; }
.stacked { @include kit.card-metadata-row-stacked; }
'@
$publicCss = ($fixture | & sass --stdin "--load-path=$KitRoot/scss" --no-source-map) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Canonical public metadata API failed to compile.' }
foreach ($declaration in @('grid-template-columns: 5.25rem minmax(0, 1fr);',
        'grid-template-columns: 1fr;', 'font-size: 0.67rem;', 'flex-wrap: wrap;')) {
    if (-not $publicCss.Contains($declaration)) { throw "Missing declaration: $declaration" }
}
$compiled = (& sass (Join-Path $pluginRoot 'scss/easystud.scss') --no-source-map) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Consumer Sass compilation failed.' }
$sha = [System.Security.Cryptography.SHA256]::Create()
try {
    $actualHash = [BitConverter]::ToString($sha.ComputeHash(
        [Text.Encoding]::UTF8.GetBytes($compiled.TrimEnd()))).Replace('-', '')
} finally { $sha.Dispose() }
if ($BaselineSha256 -and $actualHash -cne $BaselineSha256) {
    throw "Compiled CSS changed: $actualHash"
}
Write-Output "PASS: canonical metadata, five adapters and public API. CSS SHA256: $actualHash"
