param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
foreach ($entry in $manifest.consumerSync.studentWorkspaceControls.modules.PSObject.Properties) {
    $embedded = & git -C $root hash-object $entry.Name
    $canonical = & git -C $KitRoot hash-object $entry.Name
    if ($embedded -ne $entry.Value -or $canonical -ne $embedded) { throw "Workspace pin drift: $($entry.Name)" }
}
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
foreach ($needle in @('easyedu-search-field', 'easyedu-create-icon-button', 'easyedu-workspace-view-switcher')) {
    if (-not $template.Contains($needle)) { throw "Missing public class: $needle" }
}
$forms = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_forms.scss')
if ($forms.Contains('&-icon-button .fa') -or $forms.Contains('@include easyedu.icon-button;')) {
    throw 'Consumer still owns creation-icon centring.'
}
$layout = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_layout.scss')
if ($layout.Contains('&__search-field {')) { throw 'Consumer still recreates the Search skin.' }
Write-Output 'PASS: pinned public workspace controls, native template classes and no duplicate Search/Create skin.'
