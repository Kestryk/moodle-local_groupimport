[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$KitRoot)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pairs=@{
    'amd/src/searchable_choices.js'='choices/searchable_choices.js'
    'scss/easyedu/components/_searchable-choices.scss'='scss/easyedu/components/_searchable-choices.scss'
    'scss/easyedu/components/_text-fields.scss'='scss/easyedu/components/_text-fields.scss'
}
foreach($file in $pairs.Keys){
    if((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $pairs[$file])){throw "Kit drift: $file"}
}
$pins=Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
foreach($entry in $pins.consumerSync.studentSearchableMultiple20261003.modules.PSObject.Properties){
    if((& git -C $root hash-object $entry.Name) -ne $entry.Value){throw "SM-14 successor pin drift: $($entry.Name)"}
}
$source=(Get-Content -LiteralPath (Join-Path $root 'amd/src/course_manager.js') -Raw).Replace("`r`n","`n")
$old=((& git -C $root show 'f27f88dbf30843b4d10d85e12b35e47228c5d2a3:amd/src/course_manager.js') -join "`n")
function Get-Block([string]$text,[string]$start,[string]$end){
    $a=$text.IndexOf($start);$b=$text.IndexOf($end,$a)
    if($a -lt 0 -or $b -le $a){throw 'Missing native block.'}
    $text.Substring($a,$b-$a).TrimEnd()
}
foreach($markers in @(
    @('const applyFilters = ','const bindFilters = '),
    @('const bindMoveModal = ','const bindParticipantMessaging = '),
    @('const getSelectedFilterValues = ','const syncRoleFilterState = ')
)){
    if((Get-Block $source $markers[0] $markers[1]) -cne (Get-Block $old $markers[0] $markers[1])){throw "Native semantic drift: $($markers[0])"}
}
foreach($file in @('amd/src/motion.js','ajax.php','classes/service/membership_transfer.php')){
    if((& git -C $root hash-object $file) -ne (& git -C $root rev-parse "f27f88dbf30843b4d10d85e12b35e47228c5d2a3:$file")){
        throw "Original Motion/business drift: $file"
    }
}
& (Join-Path $KitRoot 'scripts/test-searchable-choice-contract.ps1')
& (Join-Path $KitRoot 'scripts/test-foundation-text-field-contract.ps1')
Write-Output 'PASS: canonical single/multiple paint/controller, native filtering/Move/API/Motion retained; preview is a separate gate.'
