# Compatibility entry point: parity is historical; only one on-demand pass remains.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$ArtifactRoot,
    [string]$PhpPath = 'php',
    [string]$AllowedSpecRoot = $PSScriptRoot,
    [Parameter(Mandatory = $true)][string[]]$Spec,
    [string]$Grep = '.*',
    [string]$MoodleUrl = 'http://localhost:8051/local/groupimport/manage.php?id=5&lang=fr',
    [ValidateSet('before', 'after')][string]$Stage = 'after'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($Spec.Count -ne 1) { throw 'Select one targeted spec. Broad discovery and double-mode matrices are retired.' }
& (Join-Path $PSScriptRoot 'Invoke-EasyStudOnDemandSpec.ps1') -CredentialLoaderPath $CredentialLoaderPath `
    -OrchestrationModulePath $OrchestrationModulePath -MoodleRoot $MoodleRoot -PhpPath $PhpPath `
    -ArtifactRoot (Join-Path $ArtifactRoot $Stage) -AllowedSpecRoot $AllowedSpecRoot -Spec $Spec[0] `
    -Grep $Grep -MoodleUrl $MoodleUrl
