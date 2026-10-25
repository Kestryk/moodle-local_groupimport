param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runnerPath = Join-Path $root 'tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1'
$tokens = $null
$errors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile(
    $runnerPath,
    [ref]$tokens,
    [ref]$errors
)
if ($errors.Count -gt 0) {
    throw "Runner PowerShell parse failed: $($errors[0].Message)"
}

$runner = Get-Content -LiteralPath $runnerPath -Raw
foreach ($fragment in @(
    '$script:RuntimePlaywrightRoot = $runtimePlaywrightRoot',
    "Join-Path `$runtimePlaywrightRoot 'node_modules\@playwright\test\cli.js'",
    'New-ExternalSpecConfiguration',
    'testDir: $allowedSpecRootJson',
    '$specArgument = $specPath.Replace',
    "SetEnvironmentVariable('NODE_PATH', `$previousDiscoveryNodePath, 'Process')",
    "SetEnvironmentVariable('NODE_PATH', `$previousExecutionNodePath, 'Process')",
    '$protectedPluginRoots = @($runtimePluginRoot, $sourcePluginRoot) | Select-Object -Unique',
    'ArtifactRoot must be external to, and must not contain, either EasyStud checkout.',
    "'--list'",
    'Playwright discovery must select exactly one test.'
)) {
    if (-not $runner.Contains($fragment)) {
        throw "Runner is missing required external-spec contract fragment: $fragment"
    }
}

Write-Host 'External Playwright runner contract passed: runtime dependencies, external spec root, NODE_PATH cleanup and one-test discovery.'
