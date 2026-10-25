[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$PhpExecutable,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$ManifestPath,
    [Parameter(Mandatory = $true)][string]$ExpectedRuntimeHead,
    [switch]$WaitForLease,
    [ValidateRange(1, 900)][int]$LeaseWaitTimeoutSeconds = 300
)
# CLI-only: no credentials, browser, cache purge or automatic success cleanup.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$moodle = (Resolve-Path -LiteralPath $MoodleRoot).Path
$php = (Resolve-Path -LiteralPath $PhpExecutable).Path
$runtime = Join-Path $moodle 'local\groupimport'
$helper = Join-Path $PSScriptRoot 'easystud-role-density-fixture.php'
$manifest = [IO.Path]::GetFullPath($ManifestPath)
$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
foreach ($excluded in @($moodle, $source)) {
    if ($manifest.StartsWith($excluded.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Fixture manifest must stay outside Moodle and the source worktree.'
    }
}
if (-not (Test-Path -LiteralPath (Split-Path -Parent $manifest) -PathType Container)) {
    throw 'Create the external artifact directory before provisioning.'
}
Import-Module $OrchestrationModulePath -Force -DisableNameChecking
$runId = 'easystud-retained-roles-' + [Guid]::NewGuid().ToString('N')
$held = @()
try {
    foreach ($resource in @('groupimport-active-runtime-write', 'moodle51-active-fixture-write')) {
        $lease = @{
            Resource = $resource; ProjectNamespace = 'easystud'; RunId = $runId
            Repository = $runtime; Purpose = 'SM39 user-authorized retained local course-5 QA roles'
            LeaseSeconds = 300; OwnerPid = $PID
        }
        if ($WaitForLease) {
            Wait-EasyEduResourceLease @lease -MaxWaitSeconds $LeaseWaitTimeoutSeconds -PollSeconds 5 | Out-Null
        } else { Acquire-EasyEduResourceLease @lease | Out-Null }
        $held += $resource
    }
    $head = & git -C $runtime rev-parse HEAD
    if ($LASTEXITCODE -ne 0 -or $head.Trim() -ne $ExpectedRuntimeHead) { throw 'Runtime HEAD changed.' }
    $dirty = & git -C $runtime status --porcelain
    if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'Runtime is dirty; provisioning refused.' }
    if (-not (Test-Path -LiteralPath $manifest)) {
        & $php $helper '--moodle-root' $moodle '--action' 'setup' '--manifest' $manifest '--run-id' $runId '--course-id=5' '--retain'
        if ($LASTEXITCODE -ne 0) { throw 'Provisioning failed; inspect the exact manifest before retrying.' }
    }
    # Repeated invocation verifies the same manifest; it never duplicates roles.
    & $php $helper '--moodle-root' $moodle '--action' 'verify-retained' '--manifest' $manifest
    if ($LASTEXITCODE -ne 0) { throw 'Retained fixture verification failed; do not delete or retry broadly.' }
    Write-Output ('Retained fixture verified: ' + $manifest)
} finally {
    foreach ($resource in ($held | Select-Object -Last 2)) {
        Release-EasyEduResourceLease -Resource $resource -RunId $runId | Out-Null
        Write-Output ('Released ' + $resource)
    }
}
