$ErrorActionPreference='Stop'
$repo='C:/dev/worktrees/easystud-codex2-perf-v2-20261017'
$root='C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017'
$runtime='C:/dev/Moodle 51 Perf/moodle'
$php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe'
$env:Path=(Split-Path $php)+';'+$env:Path
Import-Module 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -DisableNameChecking
if(Test-Path -LiteralPath $root){
    if(@(Get-ChildItem -LiteralPath $root -Force).Count){throw 'Fresh campaign root required; preserve previous evidence'}
}else{New-Item -ItemType Directory -Path $root|Out-Null}
$run='perf-config-campaign-'+$PID
$held=@();$snapshot=$false;$runtimeHeld=$false
function Own-Runtime {
    Acquire-EasyEduResourceLease -Resource groupimport-perf-runtime-write -ProjectNamespace easystud -RunId $run -Repository ($runtime+'/local/groupimport') -Purpose 'Own8051 production-like configuration experiment' -LeaseSeconds 1200 -OwnerPid $PID|Out-Null
    $script:runtimeHeld=$true
}
function Free-Runtime {
    Release-EasyEduResourceLease -Resource groupimport-perf-runtime-write -RunId $run|Out-Null
    $script:runtimeHeld=$false
}
try {
    foreach($resource in @('moodle51-perf-config-write','moodle51-perf-fixture-write')){
        Acquire-EasyEduResourceLease -Resource $resource -ProjectNamespace easystud -RunId $run -Repository ($runtime+'/local/groupimport') -Purpose 'Three-phase owned configuration performance campaign' -LeaseSeconds 3600 -OwnerPid $PID|Out-Null
        $held+=$resource
    }
    Own-Runtime
    & ($repo+'/tools/playwright/perf-v2-config-control.ps1') -Action snapshot -ExpectedRunId $run
    $snapshot=$true
    & ($repo+'/tools/playwright/perf-v2-config-sync.ps1') -Version a5d0ffab -Evidence $root -ExpectedRunId $run -Phase deploy-a5d0ffab
    $fixture=@(& $php ($repo+'/tools/playwright/perf-v2-config-fixture.php') --moodle-root $runtime --action setup --manifest ($root+'/shared-fixture.json') --run-id $run)
    if($LASTEXITCODE){throw 'Shared fixture setup failed'}
    Free-Runtime
    foreach($phase in @('A','B','C')){
        foreach($resource in $held){Refresh-EasyEduResourceLease -Resource $resource -RunId $run -LeaseSeconds 3600|Out-Null}
        Own-Runtime
        & ($repo+'/tools/playwright/perf-v2-config-control.ps1') -Action $phase -ExpectedRunId $run
        Free-Runtime
        $env:EASYEDU_PERF_CONFIG=$phase
        & ($runtime+'/local/groupimport/tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1') -CredentialLoaderPath 'C:/Users/kj220291/AppData/Local/EasyEdu/secrets/easystud-moodle51-qa/Load-EasyStudMoodleQaEnvironment.ps1' -OrchestrationModulePath 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -Spec 'perf-v2-config-native.spec.js' -AllowedSpecRoot ($repo+'/tools/playwright') -Grep 'Performance V2 configuration native own8051' -MoodleUrl 'http://localhost:8051/local/groupimport/manage.php?id=71' -ArtifactRoot ($root+'/'+$phase) -LeaseResource groupimport-perf-runtime-write -WatchdogSeconds 1800 -MoodleRoot $runtime -FixtureHelperPath ($repo+'/tools/playwright/perf-v2-config-shared-fixture.php') *> ($root+'/phase-'+$phase+'.log')
        if($LASTEXITCODE){throw ('Phase '+$phase+' incomplete; retain partial data')}
        "Phase $phase finished"
    }
} finally {
    [Environment]::SetEnvironmentVariable('EASYEDU_PERF_CONFIG',$null,'Process')
    if(!$runtimeHeld){Own-Runtime}
    try {
        if($snapshot){& ($repo+'/tools/playwright/perf-v2-config-control.ps1') -Action restore -ExpectedRunId $run}
        if(Test-Path -LiteralPath ($root+'/shared-fixture.json')){
            $cleanup=@(& $php ($repo+'/tools/playwright/perf-v2-config-fixture.php') --moodle-root $runtime --action cleanup --manifest ($root+'/shared-fixture.json'))
            if($LASTEXITCODE){throw 'Final owned fixture cleanup failed'}
            [IO.File]::WriteAllText(($root+'/cleanup.json'),($cleanup -join "`n"),[Text.UTF8Encoding]::new($false))
        }
    } finally {
        if($runtimeHeld){Free-Runtime}
        for($i=$held.Count-1;$i -ge 0;$i--){Release-EasyEduResourceLease -Resource $held[$i] -RunId $run|Out-Null}
    }
}
