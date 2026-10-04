[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$RuntimeRunnerPath,
    [switch]$WaitForLease,
    [ValidateRange(1, 900)][int]$LeaseWaitTimeoutSeconds = 900,
    [switch]$DiscoveryOnly
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$runner = (Resolve-Path -LiteralPath $RuntimeRunnerPath).Path
$arguments = @{
    CredentialLoaderPath = $CredentialLoaderPath
    OrchestrationModulePath = $OrchestrationModulePath
    MoodleRoot = $MoodleRoot
    AllowedSpecRoot = $PSScriptRoot
    FixtureHelperPath = (Join-Path $PSScriptRoot 'easystud-workspace-preferences-fixture.php')
    Spec = 'student-workspace-preferences-preview.spec.js'
    Grep = 'Configured two-view workspace opens Structure on desktop and Groups on mobile'
    LeaseResource = 'moodle51-active-fixture-write'
    WatchdogSeconds = 300
}
if ($WaitForLease) {
    $arguments.WaitForLease = $true
    $arguments.LeaseWaitTimeoutSeconds = $LeaseWaitTimeoutSeconds
}
& $runner @arguments -DiscoveryOnly
if ($LASTEXITCODE -ne 0 -or $DiscoveryOnly) {
    exit $LASTEXITCODE
}
Import-Module $OrchestrationModulePath -Force -DisableNameChecking
$runId = 'easystud-workspace-preferences-owner-' + [Guid]::NewGuid().ToString('N')
$lease = @{
    Resource = 'groupimport-active-runtime-write'
    ProjectNamespace = 'easystud'
    RunId = $runId
    Repository = (Resolve-Path -LiteralPath (Join-Path (Split-Path -Parent $runner) '..\..')).Path
    Purpose = 'SM28 supervised workspace-preference browser gate; fixture lease held separately'
    LeaseSeconds = 600
    OwnerPid = $PID
}
$acquired = $false
$exitCode = 1
try {
    if ($WaitForLease) {
        Wait-EasyEduResourceLease @lease -MaxWaitSeconds $LeaseWaitTimeoutSeconds -PollSeconds 5 | Out-Null
    } else {
        Acquire-EasyEduResourceLease @lease | Out-Null
    }
    $acquired = $true
    & $runner @arguments
    $exitCode = $LASTEXITCODE
} finally {
    if ($acquired) {
        Release-EasyEduResourceLease -Resource 'groupimport-active-runtime-write' -RunId $runId
        Write-Output 'Workspace-preferences runtime lease released.'
    }
}
exit $exitCode
