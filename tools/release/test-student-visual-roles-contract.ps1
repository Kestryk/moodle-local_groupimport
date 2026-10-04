param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
foreach ($entry in $manifest.consumerSync.studentVisualRoles.modules.PSObject.Properties) {
    $relative = 'scss/easyedu/' + $entry.Name
    $embedded = & git -C $root hash-object $relative
    $publicClassSuccessor = $manifest.consumerSync.studentMemberRowPublicClasses20261004.modules.$relative
    $completionSuccessor = $manifest.consumerSync.studentCompletion20261003.modules.$relative
    $currentPin = if ($publicClassSuccessor) { $publicClassSuccessor }
        elseif ($completionSuccessor) { $completionSuccessor }
        else { $entry.Value }
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $currentPin) { throw "Unpinned current module: $relative" }
    $canonical = & git -C $KitRoot hash-object $relative
    if ($LASTEXITCODE -ne 0 -or $canonical -ne $embedded) { throw "Canonical drift: $relative" }
}
$tokens = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/easyedu/_tokens.scss')
foreach ($name in @('surface', 'border', 'shadow')) {
    if ($tokens -notmatch "--easyedu-navigation-drawer-${name}\s*:") {
        throw "Undefined navigation drawer token: $name"
    }
}
$foundation = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/easyedu/_foundation-classes.scss')
if (-not $foundation.Contains('.easyedu-related-person-row__name')) { throw 'Missing shared related-person class.' }
$adapter = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_control-typography.scss')
foreach ($recipe in @('foundation-button($density: compact)', 'foundation-button($secondary: true, $density: compact)')) {
    if (-not $adapter.Contains($recipe)) { throw "Missing inline action role: $recipe" }
}
if ($adapter -match 'font-size\s*:|color\s*:|background\s*:|align-items\s*:') {
    throw 'Consumer role adapter must not own visual declarations.'
}
$menus = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/easyedu/components/_menus.scss')
if (@([regex]::Matches($menus, '@include action-menu-label;')).Count -ne 2) {
    throw 'Native context and overflow menus must both consume the common action label.'
}
$forms = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_forms.scss')
if ($forms.Contains('@include easyedu.action-button(small);')) { throw 'Competing Rename action skin.' }
foreach ($state in @('&:focus {', '&:hover {', '@include focus.ring($border-color: var(--easyedu-control-focus-border));')) {
    if (-not $foundation.Contains($state)) { throw "Missing Foundation state: $state" }
}
Write-Output 'PASS: pinned Kit visual roles, opaque drawer defaults and selector-only adapters.'
