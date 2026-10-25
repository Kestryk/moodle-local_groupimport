[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$pluginRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$buildRoot = Join-Path $pluginRoot 'amd\build'
$bundles = @(Get-ChildItem -LiteralPath $buildRoot -Filter '*.min.js' -File)

if ($bundles.Count -eq 0) {
    throw 'No EasyStud AMD bundles were found.'
}

$failed = @()
foreach ($bundle in $bundles) {
    $content = Get-Content -LiteralPath $bundle.FullName -Raw
    $module = [System.IO.Path]::GetFileNameWithoutExtension(
        [System.IO.Path]::GetFileNameWithoutExtension($bundle.Name)
    )
    $expectedPrefix = 'define("local_groupimport/{0}"' -f [regex]::Escape($module)
    $isAmd = $content.StartsWith($expectedPrefix, [System.StringComparison]::Ordinal)
    $hasTopLevelModuleSyntax = $content -match '(^|\r?\n)\s*(import|export)\s'
    if (-not $isAmd -or $hasTopLevelModuleSyntax) {
        $failed += $bundle.Name
        'FAIL: {0} is not a RequireJS AMD bundle' -f $bundle.Name
    } else {
        'PASS: {0} is a RequireJS AMD bundle' -f $bundle.Name
    }
}

if ($failed.Count -gt 0) {
    throw ('Invalid EasyStud AMD runtime bundle(s): ' + ($failed -join ', '))
}
