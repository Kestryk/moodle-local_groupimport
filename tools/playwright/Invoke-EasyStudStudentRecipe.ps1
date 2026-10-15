param([Parameter(Mandatory=$true)][string]$ArtifactRoot)
$ErrorActionPreference='Stop'
$qaRoot = $PSScriptRoot
$runtimeRoot = 'C:/dev/Moodle 51 Perf/moodle'
$previousPath = $env:PATH
if ($env:EASYEDU_QA_STUDENT_PASSWORD) { throw 'Student secret variable must start empty' }
$secretBytes = New-Object byte[] 32
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $random.GetBytes($secretBytes)
    $env:EASYEDU_QA_STUDENT_PASSWORD = [Convert]::ToBase64String($secretBytes) + 'aA1!'
    $env:PATH = 'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/php;' + $previousPath
    & "$runtimeRoot/local/groupimport/tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1" -CredentialLoaderPath "$qaRoot/Load-EasyStudDisposableStudent.ps1" -OrchestrationModulePath C:/dev/easyedu-platform/tools/orchestration/EasyEduOrchestration.psm1 -AllowedSpecRoot $qaRoot -Spec complement5-student-native.spec.js -Grep 'Complement5 K15-28 actual student native Participants no EasyStud' -FixtureHelperPath "$qaRoot/complement5-student-fixture.php" -MoodleRoot $runtimeRoot -MoodleUrl 'http://localhost:8051/local/groupimport/manage.php?id=5&lang=fr' -ArtifactRoot $ArtifactRoot -LeaseResource groupimport-perf-runtime-write -WatchdogSeconds 600
    if ($LASTEXITCODE -ne 0) { throw 'Student recipe failed; inspect supervised report' }
} finally {
    $env:EASYEDU_QA_STUDENT_PASSWORD = $null
    [Array]::Clear($secretBytes, 0, $secretBytes.Length)
    $random.Dispose()
    $env:PATH = $previousPath
}
