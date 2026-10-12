[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$TargetPlugin,
    [Parameter(Mandatory = $true)][string]$ArtifactRoot,
    [switch]$MilestoneSnapshot
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$target = (Resolve-Path -LiteralPath $TargetPlugin).Path
# This helper is deliberately restricted to Kevin's dedicated, non-Git copy.
if ($target -ne 'C:\dev\Moodle 51 Perf\moodle\local\groupimport' -or
    (Test-Path -LiteralPath (Join-Path $target '.git')) -or
    ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'Deployment refused outside the dedicated simple Perf plugin directory.'
}
$dirty = @(& git -C $source status --porcelain)
if ($LASTEXITCODE -ne 0 -or $dirty.Count -ne 0) { throw 'Deploy only a clean committed source branch.' }
$head = ((& git -C $source rev-parse HEAD) -join '').Trim()
$output = [IO.Path]::GetFullPath($ArtifactRoot).TrimEnd('\')
foreach ($boundary in @($source, $target)) {
    if ($output.Equals($boundary, [StringComparison]::OrdinalIgnoreCase) -or
        $output.StartsWith($boundary + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Deployment evidence must be outside source and runtime.'
    }
}
New-Item -ItemType Directory -Path $output -Force | Out-Null
$snapshot = if ($MilestoneSnapshot) { Join-Path $output 'previous-plugin.tar' } else { $null }
$archive = Join-Path $output 'source-plugin.tar'
$manifest = Join-Path $output 'deployment.json'
$staging = Join-Path $output 'committed-source'
foreach ($file in @($archive, $manifest, $staging) + @($snapshot | Where-Object { $_ })) {
    if (Test-Path -LiteralPath $file) { throw 'Use a new artifact directory; retain prior deployments.' }
}
if ($MilestoneSnapshot) {
    & tar.exe --exclude='./tools/playwright/node_modules' --exclude='./node_modules' -cf $snapshot -C $target .
    if ($LASTEXITCODE -ne 0) { throw 'Previous plugin snapshot failed; no deployment.' }
}
$files = @(& git -C $source ls-tree -r --name-only HEAD)
if ($LASTEXITCODE -ne 0) { throw 'Unable to enumerate committed source files.' }
New-Item -ItemType Directory -Path $staging | Out-Null
# git archive intentionally export-ignores tools and documentation for public
# releases. This private QA copy needs its tracked harness as well. Snapshot
# exactly the clean checkout's tracked files, preserving Windows checkout EOL.
foreach ($file in $files) {
    $stagedFile = Join-Path $staging $file
    New-Item -ItemType Directory -Path (Split-Path -Parent $stagedFile) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination $stagedFile
}
& tar.exe -cf $archive -C $staging .
if ($LASTEXITCODE -ne 0) { throw 'Tracked source snapshot failed; no deployment.' }
foreach ($file in $files) {
    $parent = Join-Path $target $file
    while ($parent -ne $target) {
        if ((Test-Path -LiteralPath $parent) -and
            ((Get-Item -LiteralPath $parent -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw "Refuse deployment through a linked path: $file"
        }
        $parent = Split-Path -Parent $parent
    }
}
# No mirror/delete: retain local dependencies and all untracked runtime files.
& tar.exe -xf $archive -C $target
if ($LASTEXITCODE -ne 0) { throw 'Deployment extraction failed; retain snapshot for recovery.' }
$hashes = [ordered]@{}
foreach ($file in $files) {
    # Compare snapshot bytes, including the clean checkout's EOL convention.
    $expected = (Get-FileHash -LiteralPath (Join-Path $staging $file) -Algorithm SHA256).Hash.ToLowerInvariant()
    $actual = (Get-FileHash -LiteralPath (Join-Path $target $file) -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expected -ne $actual) { throw "Deployed hash differs: $file" }
    $hashes[$file] = $actual
}
$record = [ordered]@{
    source = $source; sourceHead = $head; sourceDirty = $false
    target = $target; url = 'http://localhost:8051'; snapshot = $snapshot
    archive = $archive; snapshotKind = 'clean-HEAD-tracked-files-with-checkout-EOL'
    deployedAt = [DateTime]::UtcNow.ToString('o'); hashes = $hashes
}
[IO.File]::WriteAllText($manifest, ($record | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
Write-Output "Verified $($files.Count) committed files; deployment manifest: $manifest"
