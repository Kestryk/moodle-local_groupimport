[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory=$true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory=$true)][string]$MoodleRoot,
    [Parameter(Mandatory=$true)][string]$RuntimeRunnerPath,
    [Parameter(Mandatory=$true)][string]$PhpPath,
    [Parameter(Mandatory=$true)][string]$OutputRoot,
    [Parameter(Mandatory=$true)][string]$DeploymentManifestPath,
    [ValidateSet(800,3000)][int]$Participants=800
)
$ErrorActionPreference='Stop'
$source=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$output=[IO.Path]::GetFullPath($OutputRoot)
if ($MoodleRoot -ne 'C:/dev/Moodle 51 Perf/moodle' -or $output.StartsWith($source,[StringComparison]::OrdinalIgnoreCase)) {
    throw 'Explicit Perf copy and external artifact root required.'
}
New-Item -ItemType Directory -Force $output | Out-Null
$id='sm-browser-perf-'+[Guid]::NewGuid().ToString('N')
$fixture=Join-Path $output ($id+'-fixture.json')
$result=Join-Path $output ($id+'-browser.json')
$setting=Join-Path $output ($id+'-setting.json')
$names=@('PATH','EASYEDU_PERF_MANIFEST','EASYEDU_PERF_PARTICIPANTS','EASYEDU_SM_BROWSER_RESULT',
    'EASYEDU_SM_MODE_STATE','EASYEDU_PERF_PHP','EASYEDU_PERF_MOODLE_ROOT','EASYEDU_PERF_DEPLOYMENT_MANIFEST')
$previous=@{};foreach($n in $names){$previous[$n]=[Environment]::GetEnvironmentVariable($n,'Process')}
$leases=@();$exitCode=1
try {
    [Environment]::SetEnvironmentVariable('PATH',(Split-Path -Parent $PhpPath)+';'+$previous.PATH,'Process')
    $values=@{EASYEDU_PERF_MANIFEST=$fixture;EASYEDU_PERF_PARTICIPANTS=[string]$Participants;
        EASYEDU_SM_BROWSER_RESULT=$result;EASYEDU_SM_MODE_STATE=$setting;EASYEDU_PERF_PHP=$PhpPath;
        EASYEDU_PERF_MOODLE_ROOT=$MoodleRoot;EASYEDU_PERF_DEPLOYMENT_MANIFEST=$DeploymentManifestPath}
    foreach($n in $values.Keys){[Environment]::SetEnvironmentVariable($n,$values[$n],'Process')}
    $argsForRunner=@{CredentialLoaderPath=$CredentialLoaderPath;OrchestrationModulePath=$OrchestrationModulePath;
        Spec='sm-browser-performance.spec.js';Grep='SM browser measures both modes and native list interactions';
        AllowedSpecRoot=(Join-Path $source 'tools/playwright');MoodleRoot=$MoodleRoot;
        FixtureHelperPath=(Join-Path $PSScriptRoot 'create-fixture.php');MoodleUrl='http://localhost:8051/local/groupimport/manage.php?id=5';
        ArtifactRoot=$output;LeaseResource='moodle51-perf-fixture-write';WaitForLease=$true;WatchdogSeconds=1800}
    & $RuntimeRunnerPath @argsForRunner -DiscoveryOnly
    if($LASTEXITCODE -ne 0){throw 'Exact-one discovery failed.'}
    Import-Module $OrchestrationModulePath -Force -DisableNameChecking
    foreach($resource in @('groupimport-perf-runtime-write','moodle51-perf-cache-write')){
        Wait-EasyEduResourceLease -Resource $resource -ProjectNamespace easystud -RunId $id -Repository $source `
            -Purpose 'SM browser measurement; no principal access' -LeaseSeconds 3600 -OwnerPid $PID -MaxWaitSeconds 900 -PollSeconds 5 | Out-Null
        $leases+=$resource
    }
    & $RuntimeRunnerPath @argsForRunner
    $exitCode=$LASTEXITCODE
} finally {
    if(Test-Path $setting){& $PhpPath (Join-Path $PSScriptRoot 'rendering-mode.php') --moodle-root $MoodleRoot --state $setting --action restore}
    if(Test-Path $fixture){
        $owned=Get-Content $fixture -Raw | ConvertFrom-Json
        if(-not $owned.cleanup.complete){
            $cleanupId=$id+'-cleanup'
            Wait-EasyEduResourceLease -Resource moodle51-perf-fixture-write -ProjectNamespace easystud -RunId $cleanupId `
                -Repository $source -Purpose 'Exact partial fixture cleanup' -LeaseSeconds 1800 -OwnerPid $PID -MaxWaitSeconds 900 -PollSeconds 5 | Out-Null
            try{& $PhpPath (Join-Path $PSScriptRoot 'create-fixture.php') --moodle-root $MoodleRoot --manifest $fixture --purge}
            finally{Release-EasyEduResourceLease -Resource moodle51-perf-fixture-write -RunId $cleanupId}
        }
        $metadataId=$id+'-metadata'
        Wait-EasyEduResourceLease -Resource moodle51-perf-fixture-write -ProjectNamespace easystud -RunId $metadataId `
            -Repository $source -Purpose 'Remove exact owned orphan state row' -LeaseSeconds 300 -OwnerPid $PID -MaxWaitSeconds 900 -PollSeconds 5 | Out-Null
        try {
            & $PhpPath (Join-Path $PSScriptRoot 'cleanup-sm-metadata.php') --moodle-root $MoodleRoot --manifest $fixture --output ($fixture+'.metadata-cleanup.json')
            if($LASTEXITCODE -ne 0){$exitCode=1}
        } finally {Release-EasyEduResourceLease -Resource moodle51-perf-fixture-write -RunId $metadataId}
    }
    foreach($resource in $leases){Release-EasyEduResourceLease -Resource $resource -RunId $id}
    foreach($n in $names){[Environment]::SetEnvironmentVariable($n,$previous[$n],'Process')}
}
exit $exitCode
