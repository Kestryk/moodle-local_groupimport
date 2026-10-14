[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$PhpPath,
    [Parameter(Mandatory = $true)][string]$ArtifactRoot,
    [Parameter(Mandatory = $true)][string]$Spec,
    [Parameter(Mandatory = $true)][string]$Grep,
    [string]$AllowedSpecRoot = $PSScriptRoot,
    [string]$MoodleUrl = 'http://localhost:8051/local/groupimport/manage.php?id=5&lang=fr',
    [int]$WatchdogSeconds = 300
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$url = [Uri]$MoodleUrl
if ($url.Host -notin @('localhost', '127.0.0.1') -or $url.Port -ne 8051) { throw 'Dedicated Perf copy required.' }
$file = Join-Path $AllowedSpecRoot $Spec
$text = Get-Content -LiteralPath $file -Raw
if ($text -match '(?s)set_config\s*\([^;]*renderingmode|setRenderingMode\s*\(|config\s*\(mode\)|config\s*\(''legacy''\)') {
    throw 'Historical mode-changing scenario: select its on-demand successor; the retired setting must stay absent.'
}
if ($text -match 'for\s*\([^\r\n]*\[''"\s]*legacy[''"\s]*,[''"\s]*reactive') {
    throw 'Historical double-mode loop: select its single-mode successor.'
}
$runtime = Join-Path $MoodleRoot 'local/groupimport'
& $PhpPath (Join-Path $PSScriptRoot '../perf/inspect-on-demand.php') "--moodle-root=$MoodleRoot" `
    --expected-url=http://localhost:8051 --expected-db=moodle51perf
if ($LASTEXITCODE -ne 0) { throw 'Read-only single-mode preflight failed.' }
$previousRuntime = $env:EASYEDU_AUDIT_RUNTIME_ROOT
try {
    $env:EASYEDU_AUDIT_RUNTIME_ROOT = $runtime
    & (Join-Path $runtime 'tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1') `
        -CredentialLoaderPath $CredentialLoaderPath -OrchestrationModulePath $OrchestrationModulePath `
        -AllowedSpecRoot $AllowedSpecRoot -Spec $Spec -Grep $Grep -MoodleUrl $MoodleUrl `
        -ArtifactRoot $ArtifactRoot -LeaseResource groupimport-perf-runtime-write -WaitForLease `
        -WatchdogSeconds $WatchdogSeconds
} finally { $env:EASYEDU_AUDIT_RUNTIME_ROOT = $previousRuntime }
