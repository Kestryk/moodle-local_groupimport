[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$RuntimeRunnerPath,
    [Parameter(Mandatory = $true)][string]$PhpPath,
    [Parameter(Mandatory = $true)][string]$OutputRoot,
    [ValidateRange(1, 800)][int]$Participants = 800,
    [ValidateSet('baseline', 'regions', 'curve', 'details')][string]$Mode = 'baseline',
    [switch]$WaitForLease,
    [ValidateRange(1, 900)][int]$LeaseWaitTimeoutSeconds = 900,
    [switch]$DiscoveryOnly
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$sourceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$runner = (Resolve-Path -LiteralPath $RuntimeRunnerPath).Path
$runtime = (Resolve-Path -LiteralPath (Join-Path (Split-Path -Parent $runner) '..\..')).Path
$output = [IO.Path]::GetFullPath($OutputRoot).TrimEnd('\', '/')
foreach ($protected in @($sourceRoot, $runtime)) {
    if ($output.Equals($protected, [StringComparison]::OrdinalIgnoreCase) -or
        $output.StartsWith($protected + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'OutputRoot must be external to both source and runtime.'
    }
}
$php = (Resolve-Path -LiteralPath $PhpPath).Path
$arguments = @{
    CredentialLoaderPath = $CredentialLoaderPath
    OrchestrationModulePath = $OrchestrationModulePath
    MoodleRoot = $MoodleRoot
    AllowedSpecRoot = (Join-Path $sourceRoot 'tools\playwright')
    FixtureHelperPath = (Join-Path $PSScriptRoot 'create-fixture.php')
    Spec = 'student-loading-deadline-diagnostic.spec.js'
    Grep = 'Student startup records deadline and native resource timing'
    LeaseResource = 'moodle51-active-fixture-write'
    WatchdogSeconds = 1200
    ArtifactRoot = $output
    WaitForLease = $WaitForLease
    LeaseWaitTimeoutSeconds = $LeaseWaitTimeoutSeconds
}
$names = @('EASYEDU_PERF_BASELINE', 'EASYEDU_PERF_MANIFEST', 'EASYEDU_PERF_MOODLE_ROOT',
    'EASYEDU_PERF_PHP', 'EASYEDU_PERF_SOURCE_HEAD', 'EASYEDU_PERF_PARTICIPANTS', 'EASYEDU_PERF_MODE', 'PATH')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$runId = 'easystud-t052-' + [Guid]::NewGuid().ToString('N')
$manifest = Join-Path $output ($runId + '-fixture.json')
$baseline = Join-Path $output ($runId + '-baseline.json')
$acquired = $false
$exitCode = 1
try {
    [Environment]::SetEnvironmentVariable('PATH', (Split-Path -Parent $php) + ';' + $previous['PATH'], 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_MANIFEST', $manifest, 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_BASELINE', $baseline, 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_MOODLE_ROOT', $MoodleRoot, 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_PHP', $php, 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_PARTICIPANTS', [string]$Participants, 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_MODE', $Mode, 'Process')
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_SOURCE_HEAD',
        ((& git -C $sourceRoot rev-parse HEAD) -join '').Trim(), 'Process')
    & $runner @arguments -DiscoveryOnly
    if ($LASTEXITCODE -ne 0) { throw 'Exact-one discovery failed.' }
    if ($DiscoveryOnly) { $exitCode = 0; return }
    New-Item -Path $output -ItemType Directory -Force | Out-Null
    Import-Module $OrchestrationModulePath -Force -DisableNameChecking
    $lease = @{
        Resource = 'groupimport-active-runtime-write'; ProjectNamespace = 'easystud'; RunId = $runId
        Repository = $runtime; Purpose = 'T052 baseline; fixture lease owned by the saved-credentials runner'
        LeaseSeconds = 1800; OwnerPid = $PID
    }
    if ($WaitForLease) {
        Wait-EasyEduResourceLease @lease -MaxWaitSeconds $LeaseWaitTimeoutSeconds -PollSeconds 5 | Out-Null
    } else { Acquire-EasyEduResourceLease @lease | Out-Null }
    $acquired = $true
    & $runner @arguments
    $exitCode = $LASTEXITCODE
} finally {
    if ($acquired) {
        # The native wrapper cleans completed setup. Recover only our exact partial fixture if setup failed.
        if (Test-Path -LiteralPath $manifest) {
            $owned = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
            if (-not ($owned.PSObject.Properties.Name -contains 'cleanup') -or -not $owned.cleanup.complete) {
                $fixtureRun = $runId + '-partial-cleanup'
                $fixtureAcquired = $false
                try {
                    Wait-EasyEduResourceLease -Resource 'moodle51-active-fixture-write' -ProjectNamespace 'easystud' `
                        -RunId $fixtureRun -Repository $runtime -Purpose 'T052 exact partial fixture cleanup' `
                        -LeaseSeconds 300 -OwnerPid $PID -MaxWaitSeconds $LeaseWaitTimeoutSeconds -PollSeconds 5 | Out-Null
                    $fixtureAcquired = $true
                    & $php (Join-Path $PSScriptRoot 'create-fixture.php') --moodle-root $MoodleRoot --manifest $manifest --purge
                    if ($LASTEXITCODE -ne 0) { $exitCode = 1 }
                } finally {
                    if ($fixtureAcquired) { Release-EasyEduResourceLease -Resource 'moodle51-active-fixture-write' -RunId $fixtureRun }
                }
            }
        }
        Release-EasyEduResourceLease -Resource 'groupimport-active-runtime-write' -RunId $runId
    }
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
Write-Output "T052 baseline: $baseline"
Write-Output "T052 fixture ownership/cleanup: $manifest"
exit $exitCode
