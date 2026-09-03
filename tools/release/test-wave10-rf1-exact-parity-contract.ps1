[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$reference = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'fixtures\ccb-slideshow-controls-201edaf.json') -Raw |
    ConvertFrom-Json
$manager = Get-Content -LiteralPath (Join-Path $root 'amd\src\course_manager.js') -Raw
$modal = Get-Content -LiteralPath (Join-Path $root 'scss\components\_settings-modal.scss') -Raw
$tooltips = Get-Content -LiteralPath (Join-Path $root 'scss\easyedu\components\_tooltips.scss') -Raw
$settings = Get-Content -LiteralPath (Join-Path $root 'settings.php') -Raw
$manage = Get-Content -LiteralPath (Join-Path $root 'manage.php') -Raw
$admin = Get-Content -LiteralPath (Join-Path $root 'scss\views\_admin-settings.scss') -Raw
$english = Get-Content -LiteralPath (Join-Path $root 'lang\en\local_groupimport.php') -Raw
$french = Get-Content -LiteralPath (Join-Path $root 'lang\fr\local_groupimport.php') -Raw

function Assert-Literal([string]$label, [string]$contents, [string]$fragment) {
    if (-not $contents.Contains($fragment)) {
        throw "$label is missing: $fragment"
    }
}

Assert-Literal 'CCB reference provenance' $reference.sourceCommit '201edafc0efa228c9784c44787b05ef83048f2de'
Assert-Literal 'Canonical Help mixin adoption' $modal '@include easyedu.contextual-help-control;'
Assert-Literal 'Help reference diameter' $tooltips ("flex: 0 0 {0} !important;" -f $reference.help.diameter)
Assert-Literal 'Help reference font size' $tooltips ("font-size: {0} !important;" -f $reference.help.fontSize)
if ($manager.Contains($reference.help.classList)) {
    throw 'EasyStud must not retain the historical cross-plugin CCB help class.'
}
Assert-Literal 'Canonical toggle check' $modal '@include easyedu.toggle-check;'
Assert-Literal 'Canonical Slideshow row' $modal '@include easyedu.slideshow-toggle-row(var(--local-groupimport-easystud-group));'
Assert-Literal 'Toggle native checkbox' $manager 'type="checkbox" name="deletepicture" value="1"'
Assert-Literal 'Toggle visible state' $manager 'data-easystud-settings-toggle-state="1"'
if ($manager.Contains($reference.toggle.rowClass) -or $manager.Contains($reference.toggle.buttonClass)) {
    throw 'EasyStud must consume the shared Kit mixins instead of copying CCB product classes.'
}
if ($modal.Contains('transform: rotate(180deg) scale(1.06);')) {
    throw 'EasyStud must not restore the rejected consumer-owned toggle animation.'
}

Assert-Literal 'Admin Mass Import eyebrow class' $settings 'local-groupimport-import__eyebrow local-groupimport-admin-settings__page-eyebrow'
Assert-Literal 'Admin Mass Import title class' $settings 'local-groupimport-import__title local-groupimport-admin-settings__page-title'
Assert-Literal 'Admin Mass Import intro class' $settings 'local-groupimport-import__intro local-groupimport-admin-settings__page-description'
Assert-Literal 'Native duplicate heading selector' $admin '#adminsettings > .settingsform > h2'
Assert-Literal 'Native duplicate heading hidden' $admin 'display: none;'

Assert-Literal 'Compact enrolment help source' $manage "get_string('advancedsettingsenrolmentkeyhelp', 'local_groupimport')"
Assert-Literal 'Compact English enrolment help' $english "`$string['advancedsettingsenrolmentkeyhelp']"
Assert-Literal 'Compact French enrolment help' $french "`$string['advancedsettingsenrolmentkeyhelp']"
if ($manage.Contains("get_string('enrolmentkey_help', 'group')")) {
    throw 'The modal must not restore the long core enrolment-key help text.'
}

Write-Host 'EasyStud Wave 10 RF1 exact reference/consumer parity contract passed.' -ForegroundColor Green
