param(
    # Optional canonical checkout for the cross-repository source check.
    [string]$KitRoot,
    # Generated baseline captured BEFORE extraction with the same Sass version.
    [string]$BaselineCss
)
$ErrorActionPreference = 'Stop'
$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$participants = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss/components/_participants.scss')
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss/components/_structure.scss')
$module = 'scss/easyedu/components/_cards.scss'
$manifest = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$embeddedHash = & git -C $pluginRoot hash-object $module
if ($LASTEXITCODE -ne 0 -or $embeddedHash -ne $manifest.consumerSync.studentHeaderExtraction.cardModuleBlob) {
    throw 'Embedded card module differs from the recorded canonical source.'
}
if ($KitRoot) {
    $canonicalHash = & git -C $KitRoot hash-object $module
    if ($LASTEXITCODE -ne 0 -or $canonicalHash -ne $embeddedHash) {
        throw 'Canonical and embedded card modules differ.'
    }
}
foreach ($recipe in @('person-card-headline;', 'person-card-headline(compact);',
        'person-card-headline(detailed, $min-height: null);')) {
    if (-not $participants.Contains('@include easyedu.' + $recipe)) { throw "Missing $recipe" }
}
foreach ($recipe in @('selectable-card-header;', 'selectable-card-header(container);')) {
    if (-not $structure.Contains('@include easyedu.' + $recipe)) { throw "Missing $recipe" }
}
if ($participants -match 'grid-template-areas:\s*"identity') {
    throw 'Person header geometry must be owned by the shared recipe.'
}

if ($BaselineCss) {
    $compiled = & sass (Join-Path $pluginRoot 'scss/easystud.scss') --no-source-map
    if ($LASTEXITCODE -ne 0) { throw 'Consumer Sass compilation failed.' }
    # Ignore only platform line endings and final newline. Rule order and every
    # declaration across the entire plugin must remain byte-equivalent.
    $actual = ($compiled -join "`n").TrimEnd()
    $expected = (Get-Content -Raw -LiteralPath $BaselineCss).Replace("`r`n", "`n").TrimEnd()
    if ($actual -cne $expected) { throw 'Compiled CSS changed during layout-only extraction.' }
    Write-Output 'PASS: full consumer CSS is equivalent to the pre-extraction baseline.'
}
Write-Output 'PASS: all five Student card-header adapters consume the canonical Kit.'
