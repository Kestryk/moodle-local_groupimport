$ErrorActionPreference='Stop'
$repo='C:/dev/worktrees/easystud-codex2-perf-v2-20261017'
$root='C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017'
$runtime='C:/dev/Moodle 51 Perf/moodle'
$run='perf-config-C-prerequisite-'+$PID
$held=$false;$configHeld=$false
Import-Module 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -DisableNameChecking
function Own-Runtime {
    Acquire-EasyEduResourceLease -Resource groupimport-perf-runtime-write -ProjectNamespace easystud -RunId $run -Repository ($runtime+'/local/groupimport') -Purpose 'Own8051 strict configuration C prerequisite diagnosis' -LeaseSeconds 1200 -OwnerPid $PID|Out-Null
    $script:held=$true
}
function Free-Runtime {
    Release-EasyEduResourceLease -Resource groupimport-perf-runtime-write -RunId $run|Out-Null
    $script:held=$false
}
try {
    Acquire-EasyEduResourceLease -Resource moodle51-perf-config-write -ProjectNamespace easystud -RunId $run -Repository ($runtime+'/local/groupimport') -Purpose 'Reversible strict configuration C check' -LeaseSeconds 1800 -OwnerPid $PID|Out-Null
    $configHeld=$true
    Own-Runtime
    & ($repo+'/tools/playwright/perf-v2-config-control.ps1') -Action C -ExpectedRunId $run
    Free-Runtime
    & ($runtime+'/local/groupimport/tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1') -CredentialLoaderPath 'C:/Users/kj220291/AppData/Local/EasyEdu/secrets/easystud-moodle51-qa/Load-EasyStudMoodleQaEnvironment.ps1' -OrchestrationModulePath 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -Spec 'perf-v2-config-static-native.spec.js' -AllowedSpecRoot ($repo+'/tools/playwright') -Grep 'Configuration C public HTTP cache native own8051' -MoodleUrl 'http://localhost:8051/local/groupimport/manage.php?id=71' -ArtifactRoot ($root+'/C') -LeaseResource groupimport-perf-runtime-write -WatchdogSeconds 600 *> ($root+'/static-C.log')
    if($LASTEXITCODE){throw 'C prerequisite diagnostic incomplete'}
} finally {
    if($configHeld){
        try {
            if(!$held){Own-Runtime}
            & ($repo+'/tools/playwright/perf-v2-config-control.ps1') -Action restore -ExpectedRunId $run
        } finally {
            if($held){Free-Runtime}
            Release-EasyEduResourceLease -Resource moodle51-perf-config-write -RunId $run|Out-Null
        }
    }
}
