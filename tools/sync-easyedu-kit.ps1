<#
.SYNOPSIS
Synchronises the embedded EasyEdu UI kit into one or more Moodle plugins.

.DESCRIPTION
EasyEdu is embedded in each plugin so plugins remain independently installable.
This script copies only `scss/easyedu/` from a source plugin or kit repository
to target plugins. It deliberately does not touch plugin-specific SCSS files.

.EXAMPLE
.\tools\sync-easyedu-kit.ps1 `
  -TargetPluginRoots "C:\dev\Moodle 51\server\moodle\local\coursebannerbuilder"

.EXAMPLE
.\tools\sync-easyedu-kit.ps1 `
  -SourceKitPath "C:\dev\easyedu-ui-kit\scss\easyedu" `
  -TargetPluginRoots @(
    "C:\dev\Moodle 51\server\moodle\local\groupimport",
    "C:\dev\Moodle 51\server\moodle\local\coursebannerbuilder"
  )
#>

param(
    [Parameter(Mandatory = $false)]
    [string] $SourceKitPath = (Join-Path $PSScriptRoot '..\scss\easyedu'),

    [Parameter(Mandatory = $true)]
    [string[]] $TargetPluginRoots
)

$source = Resolve-Path -LiteralPath $SourceKitPath -ErrorAction Stop

foreach ($targetRoot in $TargetPluginRoots) {
    $resolvedTarget = Resolve-Path -LiteralPath $targetRoot -ErrorAction Stop
    $targetScss = Join-Path $resolvedTarget 'scss'
    $targetKit = Join-Path $targetScss 'easyedu'

    if (-not (Test-Path -LiteralPath $targetScss)) {
        New-Item -ItemType Directory -Path $targetScss | Out-Null
    }

    if (Test-Path -LiteralPath $targetKit) {
        Remove-Item -LiteralPath $targetKit -Recurse -Force
    }

    Copy-Item -LiteralPath $source -Destination $targetKit -Recurse
    Write-Host "EasyEdu kit synchronised to $targetKit"
}
