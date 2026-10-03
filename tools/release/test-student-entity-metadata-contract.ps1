param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    [Parameter(Mandatory = $true)][string]$BaselineCssPath
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pin = (Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw |
    ConvertFrom-Json).consumerSync.studentEntityMetadataExtraction
if ($null -eq $pin -or @($pin.modules.PSObject.Properties).Count -ne 2) {
    throw 'Entity metadata canonical source pins are missing.'
}
if ($pin.sourceCommit -notmatch '^[0-9a-f]{40}$') {
    throw 'Metadata extraction requires an immutable canonical source commit.'
}
foreach ($entry in $pin.modules.PSObject.Properties) {
    $embedded = & git -C $root hash-object $entry.Name
    $canonical = & git -C $KitRoot hash-object $entry.Name
    if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical -or $embedded -ne $entry.Value) {
        throw "Entity metadata canonical module/pin drift: $($entry.Name)"
    }
}
foreach ($entry in $pin.unchangedNativeSources.PSObject.Properties) {
    if ((& git -C $root hash-object $entry.Name) -ne $entry.Value) {
        throw "Native entity content/controller changed during extraction: $($entry.Name)"
    }
}
$source = Get-Content -LiteralPath (Join-Path $root 'scss/components/_settings-modal.scss') -Raw
$aiContract = Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/ai/DOCUMENTATION_CONTRACT.md') -Raw
foreach ($needle in @('return focus on the actual trigger', 'Desktop open followed by responsive resizing',
    'core/modal_save_cancel', 'Do not reset a nested product action', 'original Motion/scroll/state ownership')) {
    if (-not $aiContract.Contains($needle)) { throw "Consumer-specific AI guardrail lost: $needle" }
}
foreach ($recipe in @('entity-metadata-title', 'entity-metadata-count',
    'entity-metadata-count-label', 'entity-metadata-chevron', 'entity-metadata-scroll',
    'entity-metadata-primary', 'entity-metadata-meta', 'entity-metadata-chip',
    'entity-detail-list-surface', 'entity-detail-list-summary',
    'entity-detail-list-summary-end', 'entity-detail-list-scroll',
    'entity-detail-list-empty', 'entity-detail-description-summary',
    'entity-detail-description-content')) {
    if ($source -notmatch ('@include easyedu\.' + [regex]::Escape($recipe) + '[;(]')) {
        throw "Missing canonical entity list recipe: $recipe"
    }
}
foreach ($role in @('members', 'roles', 'groups', 'groupings')) {
    if (-not $source.Contains("entity-metadata-semantic($role)")) { throw "Missing semantic role: $role" }
}
foreach ($needle in @('data-easystud-detail-list-state="open"',
    'data-easystud-settings-list-state="open"', 'transform: rotate(180deg);',
    '@media (max-width: 34rem)', '@media (prefers-reduced-motion: reduce)', 'transition: none;')) {
    if (-not $source.Contains($needle)) { throw "Original disclosure/responsive adapter missing: $needle" }
}
$before = & git -C $root hash-object $BaselineCssPath
$after = & git -C $root hash-object styles.css
if ($before -ne $after -or $after -ne $pin.generatedCssBlob) {
    throw 'Entity metadata extraction changed the complete compiled CSS blob.'
}
& (Join-Path $root 'tools/release/test-student-card-surface-contract.ps1') -KitRoot $KitRoot -BaselineCssPath $BaselineCssPath
if ($LASTEXITCODE -ne 0) { throw 'Complete CSS property-sequence comparison failed.' }
Write-Output 'PASS: canonical metadata lists/counts/chips/description; complete CSS and native DOM/controller/Motion unchanged. No fresh Penpot/browser/human acceptance.'
