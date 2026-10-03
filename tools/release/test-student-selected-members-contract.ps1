[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
$pin = $manifest.consumerSync.studentSelectedMembers20261003
if (!$pin -or $pin.nativeTransferVerified -or $pin.humanAccepted) { throw 'Missing candidate/native/human boundary.' }
$pairs = @{
    'amd/src/searchable_choices.js' = 'choices/searchable_choices.js'
    'scss/easyedu/components/_searchable-choices.scss' = 'scss/easyedu/components/_searchable-choices.scss'
    'scss/easyedu/_components.scss' = 'scss/easyedu/_components.scss'
    'scss/easyedu/_dialog-classes.scss' = 'scss/easyedu/_dialog-classes.scss'
}
foreach ($file in $pairs.Keys) {
    if ((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $pairs[$file])) { throw "Kit recipe drift: $file" }
}

$controller = Get-Content -LiteralPath (Join-Path $root 'amd/src/course_manager.js') -Raw
$endpoint = Get-Content -LiteralPath (Join-Path $root 'ajax.php') -Raw
$service = Get-Content -LiteralPath (Join-Path $root 'classes/service/membership_transfer.php') -Raw
$manage = Get-Content -LiteralPath (Join-Path $root 'manage.php') -Raw
$build = Get-Content -LiteralPath (Join-Path $root 'amd/build/course_manager.min.js') -Raw

foreach ($needle in @(
    "getSelectedItems(root, 'member')",
    "button.disabled = selectedMembers.length === 0",
    "openModal('member'",
    "action: 'movemembers'",
    "data-easystud-move-selected-members",
    "data-easystud-delete-selected-members"
)) {
    if (!$controller.Contains($needle) -and !$manage.Contains($needle)) {
        throw "Selected-member contract missing: $needle"
    }
}
if (!$endpoint.Contains("'movemembers'") -or !$endpoint.Contains('membership_transfer::move_members')) {
    throw 'Selected-member endpoint no longer delegates one atomic transfer.'
}
foreach ($needle in @('start_delegated_transaction', 'groups_add_member', 'groups_remove_member')) {
    if (!$service.Contains($needle)) { throw "Membership transfer service missing: $needle" }
}
if (!$build.StartsWith('define("local_groupimport/course_manager"', [System.StringComparison]::Ordinal)) {
    throw 'Generated Course Manager is not a canonical AMD define bundle.'
}
if ($build -match '(?m)^\s*(?:import|export)\s') {
    throw 'Generated Course Manager contains a top-level ESM declaration.'
}
Write-Output 'PASS: selected-member routing, atomic service and canonical choices; NOT native transfer or human acceptance.'
