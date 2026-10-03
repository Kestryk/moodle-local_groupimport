[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pairs = @{
    'amd/src/searchable_choices.js' = 'choices/searchable_choices.js'
    'scss/easyedu/components/_searchable-choices.scss' = 'scss/easyedu/components/_searchable-choices.scss'
}
foreach ($consumer in $pairs.Keys) {
    if ((& git -C $root hash-object $consumer) -ne (& git -C $KitRoot hash-object $pairs[$consumer])) {
        throw "Canonical searchable-choice drift: $consumer"
    }
}
$controller = Get-Content -LiteralPath (Join-Path $root 'amd/src/course_manager.js') -Raw
$manage = Get-Content -LiteralPath (Join-Path $root 'manage.php') -Raw
$build = Get-Content -LiteralPath (Join-Path $root 'amd/build/searchable_choices.min.js') -Raw
foreach ($needle in @('clear: labels.clearfilterselection', "'clearfilterselection' => get_string('clearfilterselection'")) {
    if (!$controller.Contains($needle) -and !$manage.Contains($needle)) { throw "Consumer clear label missing: $needle" }
}
foreach ($needle in @('easyedu-searchable-choice__clear', 'selectedOptions', 'option.selected=!1')) {
    if (!$build.Contains($needle)) { throw "Generated clear-all contract missing: $needle" }
}
Write-Output 'PASS: EasyStud consumes Kit searchable multiple clear-all with localized native-select routing.'
