[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$KitRoot)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
foreach($file in @('scss/easyedu/components/_forms.scss','scss/easyedu/components/_responsive.scss')){
    if((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $file)){throw "Kit paint drift: $file"}
}
$pins=Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
foreach($entry in $pins.consumerSync.studentMoreFilters20261003.modules.PSObject.Properties){
    if((& git -C $root hash-object $entry.Name) -ne $entry.Value){throw "More-filters successor pin drift: $($entry.Name)"}
}
foreach($file in @('amd/src/course_manager.js','amd/build/course_manager.min.js','amd/src/motion.js',
    'templates/manage.mustache','ajax.php','classes/service/membership_transfer.php')){
    if((& git -C $root hash-object $file) -ne (& git -C $root rev-parse "d0083b54f07d7cd5324ae7cc8da978e14cd91f13:$file")){
        throw "Native behavior/template/Motion drift: $file"
    }
}
& (Join-Path $KitRoot 'scripts/test-filter-disclosure-typography-contract.ps1')
Write-Output 'PASS: canonical More-filters paint and exact native behavior/template/Motion retained; runtime proof separate.'
