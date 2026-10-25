[CmdletBinding()]
param(
    [string]$SourceDatabase = 'moodle',
    [string]$DatabaseHost = '127.0.0.1',
    [string]$DatabaseUser = 'root',
    [string]$DatabasePassword = '',
    [string]$TablePrefix = 'mdl_'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$pluginRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$moodleRoot = (Resolve-Path (Join-Path $pluginRoot '..\..')).Path
$serverRoot = Split-Path -Parent $moodleRoot
$php = Join-Path $serverRoot 'php\php.exe'
$mysql = Join-Path $serverRoot 'mysql\bin\mysql.exe'
$mysqldump = Join-Path $serverRoot 'mysql\bin\mysqldump.exe'

foreach ($binary in @($php, $mysql, $mysqldump)) {
    if (!(Test-Path -LiteralPath $binary -PathType Leaf)) {
        throw "Required local runtime is missing: $binary"
    }
}

if ($SourceDatabase -notmatch '^[A-Za-z0-9_]+$') {
    throw 'SourceDatabase may contain only letters, numbers and underscores.'
}
if ($TablePrefix -notmatch '^[A-Za-z0-9_]+$') {
    throw 'TablePrefix may contain only letters, numbers and underscores.'
}

$suffix = (Get-Date -Format 'yyyyMMddHHmmss') + '_' + (Get-Random -Minimum 1000 -Maximum 9999)
$testDatabase = "moodle_easystud_upgrade_$suffix"
$workingRoot = Join-Path ([System.IO.Path]::GetTempPath()) "easyedu-upgrade-$suffix"
$testDataRoot = Join-Path $workingRoot 'moodledata'
$dumpPath = Join-Path $workingRoot 'source.sql'
$configPath = Join-Path $workingRoot 'config.php'
$runnerPath = Join-Path $workingRoot 'run-upgrade.php'
$importErrorPath = Join-Path $workingRoot 'import-error.log'
$importOutputPath = Join-Path $workingRoot 'import-output.log'
$databaseCreated = $false

function Get-DatabaseArguments {
    $arguments = @(
        "--host=$DatabaseHost",
        "--user=$DatabaseUser",
        '--default-character-set=utf8mb4'
    )
    if ($DatabasePassword -ne '') {
        $arguments += "--password=$DatabasePassword"
    }
    return $arguments
}

function Invoke-DatabaseSql {
    param(
        [string]$Sql,
        [string]$Database = ''
    )

    $arguments = @(Get-DatabaseArguments)
    if ($Database -ne '') {
        $arguments += "--database=$Database"
    }
    $arguments += "--execute=$Sql"

    & $mysql @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "MariaDB command failed with exit code $LASTEXITCODE."
    }
}

function ConvertTo-PhpSingleQuotedString {
    param([string]$Value)

    return $Value.Replace('\', '\\').Replace("'", "\'")
}

Write-Host 'EasyStud disposable legacy-upgrade rehearsal' -ForegroundColor Cyan
Write-Host "Source database: $SourceDatabase"
Write-Host "Disposable database: $testDatabase"

New-Item -ItemType Directory -Path $testDataRoot -Force | Out-Null

try {
    $dumpArguments = @(Get-DatabaseArguments) + @(
        '--single-transaction',
        '--skip-lock-tables',
        '--routines=false',
        "--result-file=$dumpPath",
        $SourceDatabase
    )
    & $mysqldump @dumpArguments
    if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $dumpPath)) {
        throw 'Unable to create the disposable database dump.'
    }

    Invoke-DatabaseSql "CREATE DATABASE ``$testDatabase`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    $databaseCreated = $true

    $importArguments = @(Get-DatabaseArguments) + @("--database=$testDatabase")
    $importProcess = Start-Process -FilePath $mysql -ArgumentList $importArguments -Wait -PassThru `
        -WindowStyle Hidden -RedirectStandardInput $dumpPath -RedirectStandardOutput $importOutputPath `
        -RedirectStandardError $importErrorPath
    if ($importProcess.ExitCode -ne 0) {
        $importError = ''
        if (Test-Path -LiteralPath $importErrorPath) {
            $importError = Get-Content -LiteralPath $importErrorPath -Raw
        }
        throw "Unable to import the disposable database. $importError"
    }

    $legacySql = @"
DELETE FROM ${TablePrefix}config_plugins
 WHERE plugin = 'local_groupimport'
   AND name <> 'version';
INSERT INTO ${TablePrefix}config_plugins (plugin, name, value)
VALUES ('local_groupimport', 'version', '2026010503')
ON DUPLICATE KEY UPDATE value = '2026010503';
INSERT INTO ${TablePrefix}config_plugins (plugin, name, value)
VALUES ('local_groupimport', 'defaultuserfield', 'email')
ON DUPLICATE KEY UPDATE value = 'email';
INSERT INTO ${TablePrefix}config_plugins (plugin, name, value)
VALUES ('local_groupimport', 'enableanimations', '0')
ON DUPLICATE KEY UPDATE value = '0';
DROP TABLE IF EXISTS ${TablePrefix}local_groupimport_history;
SET @easystudtourid = (
    SELECT id
      FROM ${TablePrefix}tool_usertours_tours
     WHERE name = 'tour_groupimport_teacher_name,local_groupimport'
       AND pathmatch = '/local/groupimport/index.php%'
     LIMIT 1
);
UPDATE ${TablePrefix}tool_usertours_steps
   SET targetvalue = CASE sortorder
       WHEN 0 THEN '#local_groupimport-page'
       WHEN 1 THEN '#local_groupimport-templatebtn'
       WHEN 2 THEN '#id_importfile'
       WHEN 3 THEN '#id_userfield'
       WHEN 4 THEN '#id_submitbutton'
       ELSE '#local_groupimport-results'
   END
 WHERE tourid = @easystudtourid;
"@
    Invoke-DatabaseSql $legacySql $testDatabase

    $phpMoodleRoot = ConvertTo-PhpSingleQuotedString $moodleRoot
    $phpDataRoot = ConvertTo-PhpSingleQuotedString $testDataRoot
    $phpDatabaseHost = ConvertTo-PhpSingleQuotedString $DatabaseHost
    $phpDatabaseName = ConvertTo-PhpSingleQuotedString $testDatabase
    $phpDatabaseUser = ConvertTo-PhpSingleQuotedString $DatabaseUser
    $phpDatabasePassword = ConvertTo-PhpSingleQuotedString $DatabasePassword
    $phpTablePrefix = ConvertTo-PhpSingleQuotedString $TablePrefix

    $configContents = @"
<?php
unset(`$CFG);
global `$CFG;
`$CFG = new stdClass();
`$CFG->dbtype = 'mariadb';
`$CFG->dblibrary = 'native';
`$CFG->dbhost = '$phpDatabaseHost';
`$CFG->dbname = '$phpDatabaseName';
`$CFG->dbuser = '$phpDatabaseUser';
`$CFG->dbpass = '$phpDatabasePassword';
`$CFG->prefix = '$phpTablePrefix';
`$CFG->dboptions = [
    'dbpersist' => 0,
    'dbport' => '',
    'dbsocket' => '',
    'dbcollation' => 'utf8mb4_unicode_ci',
];
`$CFG->wwwroot = 'http://localhost/easystud-upgrade-test';
`$CFG->dataroot = '$phpDataRoot';
`$CFG->admin = 'admin';
`$CFG->directorypermissions = 0777;
require_once('$phpMoodleRoot/lib/setup.php');
"@

    $runnerContents = @"
<?php
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/config.php');
require_once(`$CFG->libdir . '/upgradelib.php');

function local_groupimport_upgrade_test_start(...`$arguments): void {
    // Intentionally silent: the JSON result below is the test contract.
}

function local_groupimport_upgrade_test_end(...`$arguments): void {
    // Intentionally silent: the JSON result below is the test contract.
}

upgrade_started();
try {
    upgrade_plugins('local', 'local_groupimport_upgrade_test_start', 'local_groupimport_upgrade_test_end', false);
} finally {
    upgrade_finished();
}

`$dbman = `$DB->get_manager();
`$historytable = new xmldb_table('local_groupimport_history');
`$columns = `$dbman->table_exists(`$historytable) ? array_keys(`$DB->get_columns('local_groupimport_history')) : [];
sort(`$columns);
`$tour = `$DB->get_record('tool_usertours_tours', [
    'name' => 'tour_groupimport_teacher_name,local_groupimport',
    'pathmatch' => '/local/groupimport/index.php%',
]);
`$targets = `$tour ? array_values(`$DB->get_fieldset_select(
    'tool_usertours_steps',
    'targetvalue',
    'tourid = :tourid',
    ['tourid' => `$tour->id]
)) : [];

`$result = [
    'version' => (int)get_config('local_groupimport', 'version'),
    'simplifiedview' => get_config('local_groupimport', 'enablesimplifiedview'),
    'defaultuserfield' => get_config('local_groupimport', 'defaultuserfield'),
    'motionlevel' => get_config('local_groupimport', 'motionlevel'),
    'legacyanimations' => get_config('local_groupimport', 'enableanimations'),
    'historytable' => `$dbman->table_exists(`$historytable),
    'historycolumns' => `$columns,
    'tourtargets' => `$targets,
];
echo 'EASYSTUD_UPGRADE_RESULT:' . json_encode(`$result, JSON_UNESCAPED_SLASHES) . PHP_EOL;
"@

    $utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($configPath, $configContents, $utf8WithoutBom)
    [System.IO.File]::WriteAllText($runnerPath, $runnerContents, $utf8WithoutBom)

    $runnerOutput = @(& $php $runnerPath 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw "Moodle upgrade runner failed:`n$($runnerOutput -join "`n")"
    }

    $resultLine = $runnerOutput | Where-Object { $_ -like 'EASYSTUD_UPGRADE_RESULT:*' } | Select-Object -Last 1
    if (!$resultLine) {
        throw "Moodle upgrade runner returned no result contract:`n$($runnerOutput -join "`n")"
    }
    $result = ($resultLine -replace '^EASYSTUD_UPGRADE_RESULT:', '') | ConvertFrom-Json

    $expectedColumns = @(
        'changesjson',
        'courseid',
        'errorcount',
        'filehash',
        'filename',
        'id',
        'replacepolicy',
        'rollbackuserid',
        'rowcount',
        'successcount',
        'timecreated',
        'timerolledback',
        'userid'
    )
    $legacyTargets = @('#local_groupimport-page', '#id_userfield', '#id_submitbutton')
    $missingColumns = @($expectedColumns | Where-Object { $_ -notin $result.historycolumns })
    $remainingLegacyTargets = @($legacyTargets | Where-Object { $_ -in $result.tourtargets })

    if ($result.version -ne 2026101501) {
        throw "Unexpected upgraded version: $($result.version)"
    }
    if ($result.simplifiedview -ne '0') {
        throw 'Legacy upgrade unexpectedly enabled simplified student management.'
    }
    if ($result.defaultuserfield -ne 'email') {
        throw 'Legacy default user field was not preserved.'
    }
    if (!$result.historytable -or $missingColumns.Count -gt 0) {
        throw "History schema is incomplete. Missing: $($missingColumns -join ', ')"
    }
    if ($remainingLegacyTargets.Count -gt 0) {
        throw "Legacy tour targets remain: $($remainingLegacyTargets -join ', ')"
    }

    if ($result.motionlevel -ne 'minimal' -or $result.legacyanimations -ne $false) {
        throw 'Legacy disabled animations did not migrate to minimal with the old key removed.'
    }

    Write-Host '[OK] Upgrade reached version 2026101501.' -ForegroundColor Green
    Write-Host '[OK] Disabled legacy animations migrated to minimal; old key removed.' -ForegroundColor Green
    Write-Host '[OK] Legacy Mass Import-only mode was preserved.' -ForegroundColor Green
    Write-Host '[OK] Existing default user-field configuration was preserved.' -ForegroundColor Green
    Write-Host '[OK] Complete import-history schema was created.' -ForegroundColor Green
    Write-Host '[OK] Obsolete Mass Import tour targets were replaced.' -ForegroundColor Green
    Write-Host 'Disposable legacy-upgrade rehearsal passed.' -ForegroundColor Green
} finally {
    if ($databaseCreated -and $testDatabase.StartsWith('moodle_easystud_upgrade_', [System.StringComparison]::Ordinal)) {
        try {
            Invoke-DatabaseSql "DROP DATABASE IF EXISTS ``$testDatabase``"
            Write-Host "Removed disposable database: $testDatabase"
        } catch {
            Write-Warning "Unable to remove disposable database $testDatabase. Remove it manually."
        }
    }

    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    $resolvedWorkingRoot = [System.IO.Path]::GetFullPath($workingRoot)
    if ($resolvedWorkingRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
            (Test-Path -LiteralPath $resolvedWorkingRoot)) {
        Remove-Item -LiteralPath $resolvedWorkingRoot -Recurse -Force
    }
}
