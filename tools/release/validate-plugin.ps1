[CmdletBinding()]
param(
    [string]$LegacyTag = 'v1.0-groupimport-csv',
    [switch]$BuildArchive,
    [string]$OutputDirectory = (Join-Path ([System.IO.Path]::GetTempPath()) 'easyedu-plugin-release')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$pluginRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$failures = [System.Collections.Generic.List[string]]::new()

function Add-CheckResult {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if ($Condition) {
        Write-Host "[OK] $Message" -ForegroundColor Green
        return
    }

    $script:failures.Add($Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Get-PluginMetadata {
    param([string]$Contents)

    $component = [regex]::Match($Contents, "\`$plugin->component\s*=\s*'([^']+)'")
    $version = [regex]::Match($Contents, '\$plugin->version\s*=\s*(\d+)')
    $release = [regex]::Match($Contents, "\`$plugin->release\s*=\s*'([^']+)'")

    if (!$component.Success -or !$version.Success -or !$release.Success) {
        throw 'Unable to read component, version or release from version.php.'
    }

    return [pscustomobject]@{
        Component = $component.Groups[1].Value
        Version = [int64]$version.Groups[1].Value
        Release = $release.Groups[1].Value
    }
}

function Get-ExportIgnorePaths {
    param([string]$AttributesPath)

    $paths = [System.Collections.Generic.List[string]]::new()
    foreach ($line in Get-Content -LiteralPath $AttributesPath) {
        if ($line -match '^\s*(\S+)\s+export-ignore(?:\s|$)') {
            $paths.Add($Matches[1].TrimStart('/').TrimEnd('/'))
        }
    }
    return $paths
}

function Test-ExportIgnored {
    param(
        [string]$RelativePath,
        [string[]]$IgnoredPaths
    )

    $normalised = $RelativePath.Replace('\', '/')
    foreach ($ignoredPath in $IgnoredPaths) {
        $ignored = $ignoredPath.Replace('\', '/')
        if ($normalised -eq $ignored -or $normalised.StartsWith("$ignored/", [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

Write-Host 'EasyStud release validation' -ForegroundColor Cyan
Write-Host "Plugin root: $pluginRoot"

$currentMetadata = Get-PluginMetadata (Get-Content (Join-Path $pluginRoot 'version.php') -Raw)
Add-CheckResult ($currentMetadata.Component -eq 'local_groupimport') 'Technical component remains local_groupimport.'

$legacyVersionContents = & git -C $pluginRoot show "${LegacyTag}:version.php" 2>$null
if ($LASTEXITCODE -ne 0 -or !$legacyVersionContents) {
    throw "Unable to read version.php from legacy tag '$LegacyTag'."
}
$legacyMetadata = Get-PluginMetadata ($legacyVersionContents -join "`n")

Add-CheckResult ($legacyMetadata.Component -eq $currentMetadata.Component) "Legacy tag and current plugin use the same component."
Add-CheckResult ($legacyMetadata.Version -lt $currentMetadata.Version) "Current version is newer than legacy tag $LegacyTag."

$upgradeContents = Get-Content (Join-Path $pluginRoot 'db\upgrade.php') -Raw
$savepointMatches = [regex]::Matches(
    $upgradeContents,
    "upgrade_plugin_savepoint\(true,\s*(\d+),\s*'local',\s*'groupimport'\)"
)
$savepoints = @($savepointMatches | ForEach-Object { [int64]$_.Groups[1].Value })
$sortedSavepoints = @($savepoints | Sort-Object)

Add-CheckResult ($savepoints.Count -gt 0) 'Upgrade savepoints are present.'
Add-CheckResult (($savepoints -join ',') -eq ($sortedSavepoints -join ',')) 'Upgrade savepoints are chronological.'
Add-CheckResult (($savepoints | Select-Object -Unique).Count -eq $savepoints.Count) 'Upgrade savepoints are unique.'
Add-CheckResult ($savepoints[-1] -eq $currentMetadata.Version) 'Final upgrade savepoint matches version.php.'
Add-CheckResult (($savepoints | Where-Object { $_ -gt $legacyMetadata.Version }).Count -gt 0) 'Legacy installations have a forward upgrade path.'

[xml]$installXml = Get-Content (Join-Path $pluginRoot 'db\install.xml') -Raw
$xmlVersion = [int64]$installXml.XMLDB.VERSION
Add-CheckResult ($xmlVersion -eq $currentMetadata.Version) 'install.xml version matches version.php.'

$installContents = Get-Content (Join-Path $pluginRoot 'db\install.php') -Raw
Add-CheckResult ($installContents -match "set_config\('enablesimplifiedview',\s*1,\s*'local_groupimport'\)") 'Fresh installs enable simplified management.'
Add-CheckResult ($upgradeContents -match "set_config\('enablesimplifiedview',\s*0,\s*'local_groupimport'\)") 'Legacy upgrades preserve Mass Import-only mode.'

$tourPath = Join-Path $pluginRoot 'db\tours\local_groupimport_teacher_guide.json'
$tour = Get-Content $tourPath -Raw | ConvertFrom-Json
$tourTargets = @($tour.steps | ForEach-Object { $_.targetvalue })
$obsoleteTargets = @('#local_groupimport-page', '#id_userfield', '#id_submitbutton')
Add-CheckResult (!(Compare-Object $tourTargets $obsoleteTargets -IncludeEqual -ExcludeDifferent)) 'Mass Import tour no longer contains obsolete targets.'

$requiredFiles = @(
    'version.php',
    'db/install.xml',
    'db/upgrade.php',
    'classes/form/import_form.php',
    'index.php',
    'manage.php',
    'export.php',
    'styles.css'
)
foreach ($requiredFile in $requiredFiles) {
    Add-CheckResult (Test-Path (Join-Path $pluginRoot $requiredFile)) "Required package file exists: $requiredFile"
}

$ignoredPaths = @(Get-ExportIgnorePaths (Join-Path $pluginRoot '.gitattributes'))
$developmentPaths = @(
    'easyedu-kit-docs',
    'easyedu-guide-kit',
    'easyedu-motion-kit',
    'easyedu-navigation-kit',
    'tools',
    'docs'
)
foreach ($developmentPath in $developmentPaths) {
    Add-CheckResult ($ignoredPaths -contains $developmentPath) "Production package excludes $developmentPath/."
}

$archivePath = $null
if ($BuildArchive) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("easyedu-package-" + [guid]::NewGuid().ToString('N'))
    $packageRoot = Join-Path $stagingRoot 'groupimport'
    New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

    try {
        $repositoryFiles = @(& git -C $pluginRoot ls-files --cached --others --exclude-standard)
        if ($LASTEXITCODE -ne 0) {
            throw 'Unable to list repository files.'
        }

        foreach ($relativePath in $repositoryFiles) {
            if (Test-ExportIgnored $relativePath $ignoredPaths) {
                continue
            }

            $source = Join-Path $pluginRoot $relativePath
            if (!(Test-Path -LiteralPath $source -PathType Leaf)) {
                continue
            }

            $destination = Join-Path $packageRoot $relativePath
            $destinationDirectory = Split-Path -Parent $destination
            New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
            Copy-Item -LiteralPath $source -Destination $destination
        }

        $safeRelease = $currentMetadata.Release -replace '[^A-Za-z0-9._-]', '-'
        $archivePath = Join-Path $OutputDirectory "local_groupimport-$safeRelease.zip"
        if (Test-Path $archivePath) {
            Remove-Item -LiteralPath $archivePath
        }
        Compress-Archive -Path $packageRoot -DestinationPath $archivePath -CompressionLevel Optimal

        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
        try {
            $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
            Add-CheckResult ($entries -contains 'groupimport/version.php') 'Archive has the expected Moodle plugin root.'
            foreach ($developmentPath in $developmentPaths) {
                $prefix = "groupimport/$developmentPath/"
                Add-CheckResult (!($entries | Where-Object { $_.StartsWith($prefix) })) "Archive excludes $developmentPath/."
            }
            $privateNames = @('AGENTS.md', '.codex', '.claude', 'ai', '.gitattributes', '.gitignore')
            foreach ($privateName in $privateNames) {
                Add-CheckResult (
                    !($entries | Where-Object { $_ -match "(^|/)$([regex]::Escape($privateName))(/|$)" })
                ) "Archive excludes private agent path $privateName."
            }
            $kitScssEntries = @($entries | Where-Object { $_.StartsWith('groupimport/scss/easyedu/') })
            Add-CheckResult ($kitScssEntries.Count -gt 0) 'Archive contains the embedded EasyEdu SCSS source.'
            Add-CheckResult (
                !($kitScssEntries | Where-Object { $_ -notmatch '\.scss$' })
            ) 'Embedded EasyEdu Kit archive entries are SCSS-only.'
        } finally {
            $archive.Dispose()
        }
    } finally {
        $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        $resolvedStagingRoot = [System.IO.Path]::GetFullPath($stagingRoot)
        if ($resolvedStagingRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
                (Test-Path -LiteralPath $resolvedStagingRoot)) {
            Remove-Item -LiteralPath $resolvedStagingRoot -Recurse -Force
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Host "`n$($failures.Count) release validation check(s) failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nAll release validation checks passed." -ForegroundColor Green
Write-Host "Legacy baseline: $LegacyTag ($($legacyMetadata.Version))"
Write-Host "Current release: $($currentMetadata.Release) ($($currentMetadata.Version))"
if ($archivePath) {
    Write-Host "Archive: $archivePath"
}
