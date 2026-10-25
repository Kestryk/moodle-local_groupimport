param(
    [string] $MoodleUrl = 'http://localhost/local/groupimport/manage.php?id=5',
    [string] $Username = 'Admin',
    [string] $Password = $env:EASYEDU_MOODLE_PASSWORD
)

$ErrorActionPreference = 'Stop'
$toolRoot = $PSScriptRoot
$artifactBase = if ($env:EASYEDU_PLAYWRIGHT_ARTIFACTS_ROOT) { $env:EASYEDU_PLAYWRIGHT_ARTIFACTS_ROOT } else {
    Join-Path $env:LOCALAPPDATA 'EasyEdu\artifacts'
}
$artifactBase = [IO.Path]::GetFullPath($artifactBase)
$runId = 'easystud-motion-{0}-{1}' -f [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'), $PID
$runRoot = Join-Path $artifactBase ('easystud\motion\' + $runId)
$playwrightOutput = Join-Path $runRoot 'playwright-output'
$manifestScript = if ($env:EASYEDU_ARTIFACT_MANIFEST_SCRIPT) { $env:EASYEDU_ARTIFACT_MANIFEST_SCRIPT } else {
    'C:\dev\easyedu-platform\tools\orchestration\Register-EasyEduArtifactManifest.ps1'
}
$exitCode = 1
New-Item -ItemType Directory -Path $playwrightOutput -Force | Out-Null

if (-not $Password) {
    $securePassword = Read-Host 'Moodle password' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

Push-Location $toolRoot
try {
    if (-not (Test-Path -LiteralPath '.\node_modules\@playwright\test')) {
        npm install --no-audit --no-fund
    }

    $env:EASYEDU_MOODLE_URL = $MoodleUrl
    $env:EASYEDU_MOODLE_USERNAME = $Username
    $env:EASYEDU_MOODLE_PASSWORD = $Password

    npx playwright test .\motion-audit.spec.js --reporter=line --workers=1 --timeout=90000 --output $playwrightOutput
    $exitCode = $LASTEXITCODE
} finally {
    if (Test-Path -LiteralPath $manifestScript -PathType Leaf) {
        $status = if ($exitCode -eq 0) { 'passed' } else { 'failed' }
        try {
            & $manifestScript -RunRoot $runRoot -ApprovedRoot $artifactBase `
                -ProjectNamespace 'easystud' -RunId $runId -Status $status | Out-Null
        } catch {
            Write-Warning "EasyStud artifact manifest registration failed: $($_.Exception.Message)"
        }
    }
    Pop-Location
}
exit $exitCode
