param(
    [Parameter(Mandatory = $true)]
    [string]$CanonicalKitRoot,

    [string]$PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [switch]$GuideOnly
)

$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "sync-easyedu-guide.ps1") `
    -CanonicalKitRoot $CanonicalKitRoot `
    -PluginRoot $PluginRoot -GuideOnly:$GuideOnly

$runtimeJavascriptPath = Join-Path $PluginRoot "amd\src\easyedu_guide.js"
$runtimeTemplatePath = Join-Path $PluginRoot "templates\easyedu_guide.mustache"
$runtimeStylesPath = Join-Path $PluginRoot "scss\easyedu\components\_guide.scss"
$buildJavascriptPath = Join-Path $PluginRoot "amd\build\easyedu_guide.min.js"
$buildMapPath = "$buildJavascriptPath.map"
$adapterDocPath = Join-Path $PluginRoot "easyedu-kit-docs\components\guide-adapter-integration.md"
$exampleDocPath = Join-Path $PluginRoot "easyedu-kit-docs\examples\guide-adapter-config.md"

$javascript = Get-Content -LiteralPath $runtimeJavascriptPath -Raw
$template = Get-Content -LiteralPath $runtimeTemplatePath -Raw
$styles = Get-Content -LiteralPath $runtimeStylesPath -Raw
$buildJavascript = Get-Content -LiteralPath $buildJavascriptPath -Raw

function Assert-Contains {
    param(
        [string]$Content,
        [string]$Pattern,
        [string]$Message
    )

    if ($Content -notmatch $Pattern) {
        throw $Message
    }
}

Assert-Contains $javascript "define\(\['local_groupimport/motion'\], function\(Motion\)" "The current Motion-dependent AMD wrapper is missing."
Assert-Contains $javascript 'const destroy =' "The runtime source does not include teardown."
Assert-Contains $javascript 'destroy: destroy' "The AMD wrapper does not export destroy."
Assert-Contains $javascript 'init: init' "The AMD wrapper does not export init."
if ($javascript -match '\bexport\s+(const|default)') {
    throw "ES-module exports remain inside the direct AMD wrapper."
}

Assert-Contains $template 'guidehoverlabel' "The EasyStud responsive launcher label was lost."
Assert-Contains $template 'role="dialog"' "The shared dialog role is missing."
Assert-Contains $template 'aria-live="polite"' "The checklist live region is missing."
Assert-Contains $template 'data-easyedu-guide-show-after-open' "The runtime template must expose consumer detail controls after the view opens."
Assert-Contains $template 'data-easyedu-guide-show-target-compact' "The runtime template must expose compact target variants."
Assert-Contains $template 'data-easyedu-guide-show-target-desktop' "The runtime template must expose desktop target variants."
if ($template -match 'id="easyedu-guide-title"') {
    throw "The runtime template retains the duplicate-prone fixed title id."
}

Assert-Contains $styles '100dvh' "The responsive dynamic-height contract is missing."
Assert-Contains $styles 'safe-area-inset-bottom' "Safe-area positioning is missing."
Assert-Contains $styles '@media \(forced-colors: active\)' "Forced-colours support is missing."

Assert-Contains $buildJavascript 'define\("local_groupimport/easyedu_guide"' "The built AMD namespace is incorrect."
Assert-Contains $buildJavascript 'return\{destroy:' "The built AMD artifact does not export destroy."
Assert-Contains $buildJavascript 'init:' "The built AMD artifact does not export init."
if (-not (Test-Path -LiteralPath $buildMapPath)) {
    throw "The guide AMD source map is missing."
}
Get-Content -LiteralPath $buildMapPath -Raw | ConvertFrom-Json | Out-Null

foreach ($path in @($adapterDocPath, $exampleDocPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Embedded guide handoff documentation is missing: $path"
    }
}

Write-Host "EasyStud guide integration checks passed."
