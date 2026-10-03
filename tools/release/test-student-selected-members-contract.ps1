[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$manifest = Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
$pin = $manifest.consumerSync.studentSelectedMembers20261003
if (!$pin -or $pin.nativeTransferVerified -or $pin.humanAccepted) { throw 'Missing candidate/native/human boundary.' }
foreach ($property in $pin.modules.PSObject.Properties) {
    if ((& git -C $root hash-object $property.Name) -ne $property.Value) { throw "Member asset drift: $($property.Name)" }
}
$pairs = @{
    'amd/src/searchable_choices.js' = 'choices/searchable_choices.js'
    'scss/easyedu/components/_searchable-choices.scss' = 'scss/easyedu/components/_searchable-choices.scss'
    'scss/easyedu/_components.scss' = 'scss/easyedu/_components.scss'
    'scss/easyedu/_dialog-classes.scss' = 'scss/easyedu/_dialog-classes.scss'
}
foreach ($file in $pairs.Keys) {
    if ((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $pairs[$file])) { throw "Kit recipe drift: $file" }
}
foreach ($file in @('styles.css', 'amd/src/motion.js')) {
    if ((& git -C $root hash-object $file) -ne (& git -C $root rev-parse ("{0}:{1}" -f $pin.historicalSearchOnlyRevision, $file))) {
        throw "Private CSS/original Motion drift: $file"
    }
}
Write-Output 'PASS: current member candidate pins, canonical choices, unchanged CSS/Motion; NOT native transfer or human acceptance.'
