[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9-]+$')][string]$Name,
    [Parameter(Mandatory = $true)][string[]]$File,
    [string]$SourceRoot
)
$ErrorActionPreference = 'Stop'
$sourceRoot = if ($SourceRoot) { [IO.Path]::GetFullPath($SourceRoot) } else {
    [IO.Path]::GetFullPath((Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
}
if (!(Test-Path -LiteralPath (Join-Path $sourceRoot '.git'))) { throw 'Snapshot requires an explicit Git worktree.' }
$snapshotRoot = Join-Path $env:LOCALAPPDATA 'EasyEdu\handoff-snapshots'
$targetRoot = [IO.Path]::GetFullPath((Join-Path $snapshotRoot $Name))
if (Test-Path -LiteralPath $targetRoot) { throw 'Snapshot already exists; never overwrite it.' }
if (!$targetRoot.StartsWith([IO.Path]::GetFullPath($snapshotRoot) + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Snapshot outside the approved external root.'
}
$resolved = foreach ($relative in $File) {
    $source = [IO.Path]::GetFullPath((Join-Path $sourceRoot $relative))
    if (!$source.StartsWith($sourceRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
        !(Test-Path -LiteralPath $source -PathType Leaf) -or $relative -match '^\.git[\\/]') {
        throw "Invalid exact source file: $relative"
    }
    [PSCustomObject]@{ relative = $relative.Replace('\', '/'); source = $source }
}
New-Item -ItemType Directory -Path $targetRoot | Out-Null
$records = foreach ($entry in $resolved) {
    $target = Join-Path $targetRoot $entry.relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $entry.source -Destination $target
    $sourceHash = (Get-FileHash -LiteralPath $entry.source -Algorithm SHA256).Hash
    if ($sourceHash -ne (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash) { throw 'Snapshot hash mismatch.' }
    [PSCustomObject]@{ file = $entry.relative; sha256 = $sourceHash }
}
$head = (& git -C $sourceRoot rev-parse HEAD).Trim()
[ordered]@{ root = $targetRoot; head = $head; files = @($records); verified = $true } |
    ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $targetRoot 'snapshot.json') -Encoding UTF8
Write-Output "Verified snapshot: $targetRoot ($($records.Count) exact files)."
