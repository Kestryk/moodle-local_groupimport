param([string]$Version,[string]$Evidence,[string]$ExpectedRunId,[string]$Phase)
$ErrorActionPreference='Stop'
Import-Module 'C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1' -DisableNameChecking
$lease=Get-EasyEduResourceState|Where-Object {$_.resource-eq'groupimport-perf-runtime-write'}
if(!$lease.ownerAlive -or $lease.runId-ne$ExpectedRunId){throw 'Supervised own runtime lease required'}
$runtime='C:/dev/Moodle 51 Perf/moodle/local/groupimport';$candidate='C:/dev/worktrees/easystud-codex2-perf-v2-20261017';$old='C:/dev/worktrees/easystud-codex2-perf-baseline-20261017'
$source=if($Version-eq'74323514'){$candidate}elseif($Version-eq'6c3ac95f'){$old}else{throw 'Unknown version'}
$filter='^(amd/|js/|classes/|db/|lang/|templates/|scss/|styles/|pix/|thirdparty/|fonts/)|^[^/]+\.php$|^styles\.css$'
$files=@(& git -C $source ls-files|Where-Object {$_-match$filter});$union=@((& git -C $candidate ls-files)+(& git -C $old ls-files)|Where-Object {$_-match$filter}|Sort-Object -Unique)
$dest=Join-Path $Evidence $Phase;if(Test-Path -LiteralPath $dest){throw 'Fresh sync phase required'};New-Item -ItemType Directory -Path $dest|Out-Null
$run='perf-v2-cache-'+$PID
Acquire-EasyEduResourceLease -Resource moodle51-perf-cache-write -ProjectNamespace easystud -RunId $run -Repository $runtime -Purpose 'Pinned performance comparison' -LeaseSeconds 600 -OwnerPid $PID|Out-Null
try{
 foreach($file in $union){$target=[IO.Path]::GetFullPath((Join-Path $runtime $file));if(!$target.StartsWith([IO.Path]::GetFullPath($runtime)+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Path escaped own runtime'}
  if(Test-Path -LiteralPath $target){$backup=Join-Path $dest ('before/'+$file);New-Item -ItemType Directory -Path (Split-Path $backup) -Force|Out-Null;Copy-Item -LiteralPath $target -Destination $backup}
  if($files-contains$file){New-Item -ItemType Directory -Path (Split-Path $target) -Force|Out-Null;Copy-Item -LiteralPath (Join-Path $source $file) -Destination $target}
  elseif(Test-Path -LiteralPath $target){$quarantine=Join-Path $dest ('not-in-revision/'+$file);New-Item -ItemType Directory -Path (Split-Path $quarantine) -Force|Out-Null;Move-Item -LiteralPath $target -Destination $quarantine}
 }
 $hashes=foreach($file in $files){$a=(Get-FileHash -LiteralPath (Join-Path $source $file)).Hash;$b=(Get-FileHash -LiteralPath (Join-Path $runtime $file)).Hash;if($a-ne$b){throw 'Hash mismatch'};@{file=$file;sha256=$a}}
 [IO.File]::WriteAllText((Join-Path $dest 'manifest.json'),(@{version=$Version;files=$hashes}|ConvertTo-Json -Depth 4),[Text.UTF8Encoding]::new($false))
 $php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe';$helper=Join-Path $candidate 'tools/playwright/perf-v2-runtime.php'
 & $php $helper --action upgrade > (Join-Path $dest 'upgrade.json');if($LASTEXITCODE){throw 'Upgrade probe failed'}
 & $php $helper --action purge > (Join-Path $dest 'purge.json');if($LASTEXITCODE){throw 'Purge failed'}
 "Synced $Version ($($files.Count) verified files)"
}finally{Release-EasyEduResourceLease -Resource moodle51-perf-cache-write -RunId $run|Out-Null}
