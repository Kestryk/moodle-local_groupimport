param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    [string]$BaselineCss
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentMemberRowExtraction
$embedded = & git -C $root hash-object $pin.module
if ($LASTEXITCODE -ne 0 -or $embedded -ne $pin.moduleBlob) { throw 'Unpinned related-person module.' }
$canonical = & git -C $KitRoot hash-object $pin.module
if ($LASTEXITCODE -ne 0 -or $canonical -ne $embedded) { throw 'Canonical related-person module drift.' }
$foundationModule = 'scss/easyedu/_foundation-classes.scss'
if ((& git -C $root hash-object $foundationModule) -ne (& git -C $KitRoot hash-object $foundationModule)) {
    throw 'Embedded Foundation public classes drifted from canonical Kit.'
}
$structure = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
$legacy = @(
    '@include easyedu.related-person-row;',
    '@include easyedu.related-person-selection-slot;',
    '@include easyedu.related-person-name;',
    '@include easyedu.related-person-name-layout;',
    '@include easyedu.related-person-remove;'
)
foreach ($recipe in $legacy) {
    if ($structure.Contains($recipe)) { throw "Local related-person adapter remains: $recipe" }
}
$foundation = Get-Content -Raw -LiteralPath (Join-Path $root $foundationModule)
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
$source = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')
foreach ($role in @('easyedu-related-person-row', 'easyedu-related-person-row__selector',
    'easyedu-related-person-row__name', 'easyedu-related-person-row__remove')) {
    if (-not $foundation.Contains(".$role")) { throw "Missing public Foundation role: $role" }
    if (@([regex]::Matches($template, [regex]::Escape($role) + '(?=[\s"])')).Count -ne 4) {
        throw "Every static member composition must use $role"
    }
    if (-not $source.Contains($role)) { throw "Dynamic member composition must use $role" }
}
if ($BaselineCss) {
    # Existing public contract compares the ENTIRE stylesheet, not row subsets.
    & (Join-Path $PSScriptRoot 'test-student-card-header-contract.ps1') -KitRoot $KitRoot -BaselineCss $BaselineCss
}
Write-Output 'PASS: static and dynamic member rows consume canonically pinned public Foundation classes.'
