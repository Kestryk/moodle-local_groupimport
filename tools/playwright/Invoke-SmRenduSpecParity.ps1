[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CredentialLoaderPath,
    [Parameter(Mandatory = $true)][string]$OrchestrationModulePath,
    [Parameter(Mandatory = $true)][string]$MoodleRoot,
    [Parameter(Mandatory = $true)][string]$ArtifactRoot,
    [string]$PhpPath = 'php',
    [string]$AllowedSpecRoot = $PSScriptRoot,
    [string[]]$Spec,
    [string]$MoodleUrl = 'http://localhost:8051/local/groupimport/manage.php?id=5',
    [ValidateSet('before', 'after')][string]$Stage = 'after'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$runtime = Join-Path $MoodleRoot 'local\groupimport'
$runtimeTools = Join-Path $runtime 'tools\playwright'
$wrapper = Join-Path $runtimeTools 'Invoke-EasyStudPlaywrightWithSavedCredentials.ps1'
$php = (Get-Command $PhpPath -ErrorAction Stop).Source
$node = (Get-Command node -ErrorAction Stop).Source
$shell = (Get-Process -Id $PID).Path
$cli = Join-Path $runtimeTools 'node_modules\@playwright\test\cli.js'
$AllowedSpecRoot = (Resolve-Path -LiteralPath $AllowedSpecRoot).Path
$ArtifactRoot = [IO.Path]::GetFullPath($ArtifactRoot)
New-Item -ItemType Directory -Path $ArtifactRoot -Force | Out-Null
$root = Join-Path $ArtifactRoot $Stage
New-Item -ItemType Directory -Path $root -Force | Out-Null
$modeState = Join-Path $ArtifactRoot 'rendering-mode-state.json'
$guideState = Join-Path $ArtifactRoot 'guide-preference-state.json'
$records = [Collections.Generic.List[object]]::new()
$summaryPath = Join-Path $root 'matrix.json'
$runId = 'sm-rendu-parity-perf-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
Import-Module $OrchestrationModulePath -Force -DisableNameChecking

function Save-Matrix {
    param([string]$Status = 'running')
    $payload = @{stage=$Stage; status=$Status; sourceRoot=$AllowedSpecRoot; url=$MoodleUrl; records=$records.ToArray()}
    [IO.File]::WriteAllText($summaryPath, ($payload | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
}
function Invoke-CopySetting {
    param([string]$Mode, [switch]$Restore)
    $acquired = @()
    try {
        foreach ($resource in @('groupimport-perf-runtime-write', 'moodle51-perf-cache-write')) {
            Wait-EasyEduResourceLease -Resource $resource -ProjectNamespace easystud -RunId $runId `
                -Repository $runtime -Purpose 'SM-RENDU parity copy settings' -LeaseSeconds 300 `
                -OwnerPid $PID -MaxWaitSeconds 600 -PollSeconds 5 | Out-Null
            $acquired += $resource
        }
        $modeArgs = @((Join-Path $runtime 'tools\perf\rendering-mode.php'),
            "--moodle-root=$MoodleRoot", "--state=$modeState")
        $guideArgs = @((Join-Path $PSScriptRoot 'prepare-sm-rendu-perf.php'),
            "--moodle-root=$MoodleRoot", "--state=$guideState")
        if ($Restore) {
            & $php @modeArgs --action=restore | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Rendering mode restore failed.' }
            & $php @guideArgs --action=restore | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Guide preference restore failed.' }
        } else {
            & $php @modeArgs --action=set "--mode=$Mode" | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Rendering mode set failed.' }
        }
        & $php (Join-Path $runtime 'tools\perf\inspect-runtime.php') "--moodle-root=$MoodleRoot" `
            --expected-url=http://localhost:8051 --expected-db=moodle51perf --purge | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Perf cache purge failed.' }
    } finally {
        for ($i=$acquired.Count-1; $i -ge 0; $i--) {
            Release-EasyEduResourceLease -Resource $acquired[$i] -RunId $runId
        }
    }
}
function Quote-Argument {
    param([string]$Value)
    return '"' + $Value.Replace('"', '\"') + '"'
}

$previousNodePath = $env:NODE_PATH
$configPath = Join-Path $root 'discovery.config.cjs'
$specRootJson = $AllowedSpecRoot.Replace('\','/') | ConvertTo-Json -Compress
[IO.File]::WriteAllText($configPath, "module.exports = {testDir: $specRootJson, testMatch: '**/*.spec.js', workers: 1};", [Text.UTF8Encoding]::new($false))
try {
    $env:NODE_PATH = Join-Path $runtimeTools 'node_modules'
    if (!$Spec) { $Spec = @(Get-ChildItem $AllowedSpecRoot -Filter '*.spec.js' | Select-Object -ExpandProperty Name) }
    $cases = [Collections.Generic.List[object]]::new()
    foreach ($file in $Spec) {
        $fileArgument = (Join-Path $AllowedSpecRoot $file).Replace('\','/')
        $configArgument = $configPath.Replace('\','/')
        $discovery = & $node $cli test $fileArgument "--config=$configArgument" --list --reporter=json
        [IO.File]::WriteAllText((Join-Path $root ($file + '.discovery.json')), ($discovery -join "`n"), [Text.UTF8Encoding]::new($false))
        if ($LASTEXITCODE -ne 0) { throw "Discovery failed: $file" }
        $discovery = ($discovery -join "`n") | ConvertFrom-Json
        function Read-Suites {
            param($Suites)
            foreach ($suite in $Suites) {
                if ($suite.PSObject.Properties['specs']) {
                    foreach ($item in $suite.specs) { $cases.Add(@{spec=$file; title=$item.title}) }
                }
                if ($suite.PSObject.Properties['suites']) { Read-Suites $suite.suites }
            }
        }
        Read-Suites $discovery.suites
    }
    . $CredentialLoaderPath | Out-Null
    Wait-EasyEduResourceLease -Resource 'groupimport-perf-runtime-write' -ProjectNamespace easystud -RunId $runId `
        -Repository $runtime -Purpose 'SM-RENDU QA welcome preference' -LeaseSeconds 180 -OwnerPid $PID `
        -MaxWaitSeconds 600 -PollSeconds 5 | Out-Null
    try {
        & $php (Join-Path $PSScriptRoot 'prepare-sm-rendu-perf.php') "--moodle-root=$MoodleRoot" "--state=$guideState" --action=prepare
        if ($LASTEXITCODE -ne 0) { throw 'Guide preference preparation failed.' }
    } finally {
        Release-EasyEduResourceLease -Resource 'groupimport-perf-runtime-write' -RunId $runId
    }
    foreach ($name in @('EASYEDU_MOODLE_USERNAME','EASYEDU_MOODLE_PASSWORD','EASYEDU_CCB_MOODLE_USERNAME','EASYEDU_CCB_MOODLE_PASSWORD')) {
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
    foreach ($mode in @('legacy','reactive')) {
        Invoke-CopySetting -Mode $mode
        foreach ($case in $cases) {
            # Keep Windows paths below MAX_PATH even with Playwright's long
            # generated test directory names.
            $caseRoot = Join-Path $root ($mode + '-' + $records.Count)
            New-Item -ItemType Directory -Path $caseRoot -Force | Out-Null
            $logPath = Join-Path $caseRoot 'wrapper.log'
            $errorPath = Join-Path $caseRoot 'wrapper.stderr.log'
            $arguments = @('-NoProfile','-File',$wrapper,'-CredentialLoaderPath',$CredentialLoaderPath,
                '-OrchestrationModulePath',$OrchestrationModulePath,'-AllowedSpecRoot',$AllowedSpecRoot,
                '-Spec',$case.spec,'-Grep',([regex]::Escape($case.title) + '$'),
                '-MoodleUrl',$MoodleUrl,'-ArtifactRoot',$caseRoot,'-LeaseResource','groupimport-perf-runtime-write',
                '-WaitForLease','-WatchdogSeconds','360')
            $child = Start-Process -FilePath $shell -ArgumentList (($arguments | ForEach-Object {Quote-Argument $_}) -join ' ') `
                -WindowStyle Hidden -PassThru -RedirectStandardOutput $logPath -RedirectStandardError $errorPath
            $child.WaitForExit()
            $runs = Join-Path $caseRoot 'easystud\authenticated'
            $resultFile = if (Test-Path $runs) {
                Get-ChildItem $runs -Directory | ForEach-Object {
                    Get-Item (Join-Path $_.FullName 'runner-result.json') -ErrorAction SilentlyContinue
                } | Select-Object -First 1
            } else { $null }
            $runRoot = if ($resultFile) { $resultFile.DirectoryName } else { $null }
            $out = if ($runRoot) { Get-Content (Join-Path $runRoot 'playwright.stdout.log') -Raw -ErrorAction SilentlyContinue } else { Get-Content $errorPath -Raw }
            $firstError = [regex]::Match([string]$out, '(?m)^\s*(?:Error:|Test timeout|TimeoutError:).+$').Value.Trim()
            $line = [regex]::Match([string]$out, '(?m)^\s*>\s*(\d+)\s*\|').Groups[1].Value
            $result = if ($resultFile) { Get-Content $resultFile.FullName -Raw | ConvertFrom-Json } else { $null }
            $screenshots = if ($runRoot) { @(Get-ChildItem $runRoot -Recurse -Filter '*.png' | Select-Object -ExpandProperty FullName) } else { @() }
            $records.Add(@{spec=$case.spec; title=$case.title; mode=$mode;
                status=if($result){$result.status}else{'runner-error'}; exit=$child.ExitCode;
                firstError=$firstError; line=$line; runRoot=$runRoot; captures=$screenshots;
                sourceSha256=(Get-FileHash (Join-Path $AllowedSpecRoot $case.spec) -Algorithm SHA256).Hash})
            Save-Matrix
            Write-Output "$Stage $mode $($case.spec): $($records[-1].status) $firstError"
        }
    }
    Save-Matrix -Status completed
} finally {
    foreach ($name in @('EASYEDU_MOODLE_USERNAME','EASYEDU_MOODLE_PASSWORD','EASYEDU_CCB_MOODLE_USERNAME','EASYEDU_CCB_MOODLE_PASSWORD')) {
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
    $env:NODE_PATH = $previousNodePath
    if (Test-Path $guideState) { Invoke-CopySetting -Restore }
}
