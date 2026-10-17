$ErrorActionPreference='Stop'
$repo='C:/dev/worktrees/easystud-codex2-perf-v2-20261017'
$root='C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017'
$runtime='C:/dev/Moodle 51 Perf/moodle'
$php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe'
Import-Module 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -DisableNameChecking
$other=@(Get-EasyEduResourceState | Where-Object { $_.resource -match 'perf' -and $_.ownerAlive })
if($other.Count){throw 'Another performance operation is active'}
$run='perf-config-final-proof-'+$PID
Acquire-EasyEduResourceLease -Resource groupimport-perf-runtime-write -ProjectNamespace easystud -RunId $run -Repository ($runtime+'/local/groupimport') -Purpose 'Final readonly configuration and fixture proofs' -LeaseSeconds 600 -OwnerPid $PID | Out-Null
try {
    $cleanup=@(& $php ($repo+'/tools/playwright/perf-v2-config-cleanup-proof.php'))
    if($LASTEXITCODE){throw 'Cleanup proof failed'}
    $clean=$cleanup -join "
"
    if(!(ConvertFrom-Json $clean).complete){throw 'Owned data remains'}
    [IO.File]::WriteAllText(($root+'/cleanup-proof.json'),$clean,[Text.UTF8Encoding]::new($false))
    $manifest=Get-Content ($root+'/deploy-a5d0ffab/manifest.json') -Raw | ConvertFrom-Json
    $bad=@($manifest.files | Where-Object { (Get-FileHash -LiteralPath ($runtime+'/local/groupimport/'+$_.file)).Hash -ne $_.sha256 })
    git diff --no-index --quiet -- ($root+'/config.original.bin') 'C:/dev/Moodle 51 Perf/config.php';$configExit=$LASTEXITCODE
    git diff --no-index --quiet -- ($root+'/shim.original.bin') ($runtime+'/config.php');$shimExit=$LASTEXITCODE
    if($bad.Count -or $configExit -or $shimExit){throw 'Runtime/configuration mismatch'}
    $state=@(& $php ($repo+'/tools/playwright/perf-v2-config-state.php')) -join "
"
    if($LASTEXITCODE -or $state -ne (Get-Content ($root+'/settings.original.json') -Raw -Encoding UTF8)){throw 'Original settings mismatch'}
    $proof=@{version='a5d0ffab';verifiedFiles=$manifest.files.Count;mismatches=$bad.Count;configDiffExitCode=$configExit;shimDiffExitCode=$shimExit}
    [IO.File]::WriteAllText(($root+'/runtime-proof.json'),($proof|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
    node ($repo+'/tools/playwright/perf-v2-config-blocked-report.cjs')
    if($LASTEXITCODE){throw 'Report generation failed'}
} finally { Release-EasyEduResourceLease -Resource groupimport-perf-runtime-write -RunId $run | Out-Null }
