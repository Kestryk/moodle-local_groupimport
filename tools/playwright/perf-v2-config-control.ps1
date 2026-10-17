param([ValidateSet('snapshot','A','B','C','restore')][string]$Action,[string]$ExpectedRunId)
$ErrorActionPreference='Stop'
$root='C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017'
$config='C:/dev/Moodle 51 Perf/config.php'
$shim='C:/dev/Moodle 51 Perf/moodle/config.php'
$php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe'
$helper='C:/dev/worktrees/easystud-codex2-perf-v2-20261017/tools/playwright/perf-v2-config-state.php'
Import-Module 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -DisableNameChecking
$lease=Get-EasyEduResourceState|Where-Object resource -eq 'groupimport-perf-runtime-write'
if(!$lease.ownerAlive -or $lease.runId -ne $ExpectedRunId){throw 'Owned runtime lease required'}
$cacheRun='perf-config-cache-'+$PID
Acquire-EasyEduResourceLease -Resource moodle51-perf-cache-write -ProjectNamespace easystud -RunId $cacheRun -Repository 'C:/dev/Moodle 51 Perf/moodle/local/groupimport' -Purpose 'Own8051 reversible configuration experiment' -LeaseSeconds 600 -OwnerPid $PID|Out-Null
try {
    if($Action -eq 'snapshot'){
        if(Test-Path -LiteralPath ($root+'/config.original.bin')){throw 'Preserve original snapshot'}
        Copy-Item -LiteralPath $config -Destination ($root+'/config.original.bin')
        Copy-Item -LiteralPath $shim -Destination ($root+'/shim.original.bin')
        $state=@(& $php $helper);if($LASTEXITCODE){throw 'Config inspection failed'}
        [IO.File]::WriteAllText(($root+'/settings.original.json'),($state -join "`n"),[Text.UTF8Encoding]::new($false))
    } elseif($Action -eq 'restore') {
        Copy-Item -LiteralPath ($root+'/config.original.bin') -Destination $config
        if((Get-FileHash -LiteralPath $config).Hash -ne (Get-FileHash -LiteralPath ($root+'/config.original.bin')).Hash){throw 'Configuration byte mismatch'}
        if((Get-FileHash -LiteralPath $shim).Hash -ne (Get-FileHash -LiteralPath ($root+'/shim.original.bin')).Hash){throw 'Shim unexpectedly changed'}
    } else {
        $original=[Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($root+'/config.original.bin'))
        $anchor="require_once(__DIR__ . '/moodle/lib/setup.php');"
        if(($original.Split(@($anchor),[StringSplitOptions]::None)).Length -ne 2){throw 'Unique pre-bootstrap anchor required'}
        $lines=@('// BEGIN CODEX2 TEMPORARY OWN8051 PERFORMANCE CONFIG','$CFG->debug = 0;')
        if($Action -in @('B','C')){$lines+='$CFG->enable_read_only_sessions = true;'}
        if($Action -eq 'C'){$lines+=@('$CFG->cachejs = true;','$CFG->cachetemplates = true;','$CFG->slasharguments = true;','$CFG->themedesignermode = false;')}
        $lines+='// END CODEX2 TEMPORARY OWN8051 PERFORMANCE CONFIG'
        $text=$original.Replace($anchor,(($lines -join "`r`n")+"`r`n"+$anchor))
        [IO.File]::WriteAllText($config,$text,[Text.UTF8Encoding]::new($false))
        & $php -l $config|Out-Null;if($LASTEXITCODE){throw 'Temporary config syntax failed'}
    }
    if($Action -ne 'snapshot'){
        & $php 'C:/dev/worktrees/easystud-codex2-perf-v2-20261017/tools/playwright/perf-v2-runtime.php' --action purge|Out-Null
        if($LASTEXITCODE){throw 'Config cache purge failed'}
        $state=@(& $php $helper);if($LASTEXITCODE){throw 'Effective config read failed'}
        [IO.File]::WriteAllText(($root+'/settings.'+$Action+'.json'),($state -join "`n"),[Text.UTF8Encoding]::new($false))
    }
    if($Action -eq 'restore'){
        $before=Get-Content -LiteralPath ($root+'/settings.original.json') -Raw -Encoding UTF8
        $after=Get-Content -LiteralPath ($root+'/settings.restore.json') -Raw -Encoding UTF8
        if($before -ne $after){throw 'Effective/database configuration not restored'}
        $proof=@{configByteIdentical=$true;shimByteIdentical=$true;settingsIdentical=$true;configDiff='';configSha256=(Get-FileHash -LiteralPath $config).Hash;shimSha256=(Get-FileHash -LiteralPath $shim).Hash;servicesRestarted=$false}
        [IO.File]::WriteAllText(($root+'/restoration-proof.json'),($proof|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
    }
    "Configuration $Action verified"
} finally {Release-EasyEduResourceLease -Resource moodle51-perf-cache-write -RunId $cacheRun|Out-Null}
