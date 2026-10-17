param([string]$ExpectedRunId)
$ErrorActionPreference='Stop'
Import-Module 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -DisableNameChecking
$owner=Get-EasyEduResourceState|Where-Object resource -eq 'groupimport-perf-runtime-write'
if(!$owner.ownerAlive -or $owner.runId -ne $ExpectedRunId){throw 'Supervised own runtime lease required'}
$run='perf-v2-purge-'+$PID
Acquire-EasyEduResourceLease -Resource moodle51-perf-cache-write -ProjectNamespace easystud -RunId $run -Repository 'C:/dev/Moodle 51 Perf/moodle/local/groupimport' -Purpose 'Own8051 performance cold sample' -LeaseSeconds 600 -OwnerPid $PID|Out-Null
try {
    & 'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe' 'C:/dev/worktrees/easystud-codex2-perf-v2-20261017/tools/playwright/perf-v2-runtime.php' --action purge
    if($LASTEXITCODE){throw 'Native purge failed'}
} finally {
    Release-EasyEduResourceLease -Resource moodle51-perf-cache-write -RunId $run|Out-Null
}
