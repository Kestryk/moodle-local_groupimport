[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$RuntimeRunnerPath,
    [string]$AllowedSpecRoot,
    [string]$ArtifactRoot,
    [switch]$WaitForLease,
    [ValidateRange(1, 86400)][int]$LeaseWaitTimeoutSeconds = 900,
    [ValidateRange(60, 1800)][int]$WatchdogSeconds = 300,
    [switch]$DiscoveryOnly
)

if (-not (Test-Path -LiteralPath $RuntimeRunnerPath -PathType Leaf)) {
    throw "RuntimeRunnerPath does not exist: $RuntimeRunnerPath"
}
$runner = (Resolve-Path -LiteralPath $RuntimeRunnerPath).Path
$arguments = @{
    CredentialLoaderPath = $CredentialLoaderPath
    OrchestrationModulePath = $OrchestrationModulePath
    MoodleRoot = $MoodleRoot
    FixtureHelperPath = (Join-Path $PSScriptRoot 'easystud-action-button-alignment-fixture.php')
    Spec = 'easystud-action-button-alignment.spec.js'
    Grep = 'EasyStud action controls keep shared alignment and restrained typography'
    WatchdogSeconds = $WatchdogSeconds
}
if ($AllowedSpecRoot) { $arguments.AllowedSpecRoot = $AllowedSpecRoot }
if ($ArtifactRoot) { $arguments.ArtifactRoot = $ArtifactRoot }
if ($WaitForLease) { $arguments.WaitForLease = $true; $arguments.LeaseWaitTimeoutSeconds = $LeaseWaitTimeoutSeconds }
if ($DiscoveryOnly) { $arguments.DiscoveryOnly = $true }
& $runner @arguments
exit $LASTEXITCODE
