# Run only after N1 announces complete publication; validates the exact own8051 sync manifest.
param(
    [Parameter(Mandatory=$true)][string]$ArtifactRoot,
    [Parameter(Mandatory=$true)][string]$PublishedCommit,
    [Parameter(Mandatory=$true)][string]$SyncManifest
)
$ErrorActionPreference='Stop'
$runtime='C:/dev/Moodle 51 Perf/moodle/local/groupimport'
$php='C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php/php.exe'
$qaRoot=$PSScriptRoot
if(Test-Path -LiteralPath $ArtifactRoot){throw 'Fresh external artifact directory required'}
$artifactPath=[IO.Path]::GetFullPath($ArtifactRoot)
if(!$artifactPath.StartsWith('C:\dev\artifacts\',[StringComparison]::OrdinalIgnoreCase)){throw 'External artifacts only'}
$sync=Get-Content -LiteralPath $SyncManifest -Raw -Encoding UTF8|ConvertFrom-Json
if($sync.commit -ne $PublishedCommit -or $sync.runtime -ne $runtime -or !$sync.files.Count){throw 'Explicit matching8051 publication manifest required'}
$runtimeFull=[IO.Path]::GetFullPath($runtime).TrimEnd('\')+'\'
foreach($entry in $sync.files){
    $file=[IO.Path]::GetFullPath((Join-Path $runtime $entry.file))
    if(!$file.StartsWith($runtimeFull,[StringComparison]::OrdinalIgnoreCase) -or (Get-FileHash -LiteralPath $file).Hash -ne $entry.sourceHash){throw 'Runtime changed since synchronization'}
}
foreach($gate in @(@('lib.php','easyedu_motion_level'),@('amd/src/motion.js','data-easyedu-motion-level'),@('amd/src/local/cm/selection_controls.js','event.altKey'))){
    if(!(Get-Content -LiteralPath (Join-Path $runtime $gate[0]) -Raw).Contains($gate[1])){throw ('M1 publication prerequisite absent: '+$gate[0])}
}
New-Item -ItemType Directory -Path $artifactPath|Out-Null
$jobs=@(
    @('s9','Complement5 S9 literal card tooltip CSV and harmony'),
    @('t020','Complement5 T020 strict settled two pixels and harmony'),
    @('mass','Complement5 Mass Import root sixteen pixels and harmony'),
    @('eye','Complement5 participant eye mobile geometry and harmony'),
    @('modifiers','Complement5 Alt Control Shift native selection and harmony'),
    @('animations','Complement5 mobile view lists selection actions dropdown motion harmony'),
    @('student','Complement5 K15-28 actual student native Participants no EasyStud'),
    @('m1','M1 three levels priority hot switch system ignored all surfaces CPU4')
)
$rows=@();$previousPath=$env:PATH
try{
    $env:PATH=(Split-Path $php)+';'+$previousPath
    foreach($job in $jobs){
        $out=Join-Path $artifactPath $job[0]
        $invocationFailed=$false
        try{if($job[0] -eq 'student'){
            & "$qaRoot/Invoke-EasyStudStudentRecipe.ps1" -ArtifactRoot $out *> (Join-Path $artifactPath ($job[0]+'.log'))
        }else{
            $spec=if($job[0] -eq 'm1'){'m1-levels-native.spec.js'}else{'complement5-served-recipes-native.spec.js'}
            & "$runtime/tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1" -CredentialLoaderPath 'C:/Users/kj220291/AppData/Local/EasyEdu/secrets/easystud-moodle51-qa/Load-EasyStudMoodleQaEnvironment.ps1' -OrchestrationModulePath C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1 -AllowedSpecRoot $qaRoot -Spec $spec -Grep $job[1] -FixtureHelperPath "$qaRoot/m1-course-fixture.php" -MoodleRoot 'C:/dev/Moodle 51 Perf/moodle' -MoodleUrl 'http://localhost:8051/local/groupimport/manage.php?id=5&lang=fr' -ArtifactRoot $out -LeaseResource groupimport-perf-runtime-write -WatchdogSeconds 1800 *> (Join-Path $artifactPath ($job[0]+'.log'))
        }}catch{$invocationFailed=$true}
        $exitCode=if($invocationFailed){1}else{$LASTEXITCODE}
        $runs=@(Get-ChildItem -LiteralPath (Join-Path $out 'easystud/authenticated') -Directory)
        if($runs.Count -ne 1){throw 'Exactly one supervised run expected per selected recipe'}
        $r=Get-Content -LiteralPath (Join-Path $runs[0].FullName 'runner-result.json') -Raw|ConvertFrom-Json
        & $php "$qaRoot/../perf/verify-owned-recipe-cleanup.php" $runs[0].FullName > (Join-Path $artifactPath ($job[0]+'-cleanup-db.json'))
        if($LASTEXITCODE -ne 0){throw 'Stop: fixture/configuration restoration is not verified'}
        $rows+=[pscustomobject]@{recipe=$job[0];run=$r.runId;status=$r.status;exitCode=$exitCode;cleanupDbVerified=$true}
        ConvertTo-Json -InputObject @($rows) -Depth 5|Set-Content -LiteralPath (Join-Path $artifactPath 'recipe-results.json') -Encoding UTF8
        # Independent failures are retained; no unchanged retry. Continue the remaining authorized recipes.
    }
}finally{$env:PATH=$previousPath}
$failed=@($rows|Where-Object {$_.status -ne 'passed'}).Count
"Recipes completed: $($rows.Count); failed: $failed; report: $(Join-Path $artifactPath 'recipe-results.json')"
if($failed){exit 1}
