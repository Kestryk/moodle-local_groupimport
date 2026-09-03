[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$manager = Get-Content -LiteralPath (Join-Path $root 'amd\src\course_manager.js') -Raw
$managerBuild = Get-Content -LiteralPath (Join-Path $root 'amd\build\course_manager.min.js') -Raw
$modal = Get-Content -LiteralPath (Join-Path $root 'scss\components\_settings-modal.scss') -Raw
$forms = Get-Content -LiteralPath (Join-Path $root 'scss\components\_forms.scss') -Raw
$tooltips = Get-Content -LiteralPath (Join-Path $root 'scss\easyedu\components\_tooltips.scss') -Raw
$css = Get-Content -LiteralPath (Join-Path $root 'styles.css') -Raw

function Assert-Literal([string]$label, [string]$contents, [string]$fragment) {
    if (-not $contents.Contains($fragment)) {
        throw "$label is missing: $fragment"
    }
}

function Assert-Absent([string]$label, [string]$contents, [string]$fragment) {
    if ($contents.Contains($fragment)) {
        throw "$label must not contain: $fragment"
    }
}

Assert-Literal 'Kit canonical mixin' $tooltips '@mixin contextual-help-control {'
Assert-Literal 'Kit canonical diameter' $tooltips 'flex: 0 0 1.15rem !important;'
Assert-Literal 'Kit non-underlined interaction' $tooltips 'text-decoration: none !important;'
Assert-Literal 'Kit shared focus ring' $tooltips '@include focus.ring($border-color: var(--easyedu-control-focus-border));'
Assert-Literal 'EasyStud consumer mixin' $modal '@include easyedu.contextual-help-control;'
Assert-Absent 'EasyStud local modal diameter' $modal 'height: 1.15rem !important;'
Assert-Absent 'EasyStud retired local help dot' $forms '&-help-dot {'

Assert-Literal 'Native help button' $manager '<button type="button" class="btn p-0 icon-no-margin '
Assert-Absent 'Native help button link utility' $manager '<button type="button" class="btn btn-link p-0 icon-no-margin local-groupimport-easystud-settings-modal__help'
Assert-Literal 'EasyStud help hook' $manager 'local-groupimport-easystud-settings-modal__help" '
Assert-Literal 'Accessible help name' $manager "aria-label=`"' + escapeHtml(help) + '`" data-easystud-hover-help=`"' + escapeHtml(help) + '`">?</button>"
Assert-Literal 'Enrollment help consumer' $manager 'labels.advancedsettingsenrolmentkeyhelp || '''
Assert-Literal 'Group image help consumer' $manager 'renderFieldHelp(labels.advancedsettingsimagehelp || '''
Assert-Absent 'Cross-plugin CCB help class' $manager 'local-course-banner-builder-help-dot '
Assert-Absent 'Cross-plugin CCB help class build' $managerBuild 'local-course-banner-builder-help-dot '

Assert-Literal 'Hover popover discovery' $manager "event.target.closest('[data-easystud-hover-help]')"
Assert-Literal 'Hover popover role' $manager "activeTip.setAttribute('role', 'tooltip')"
Assert-Literal 'Generated canonical diameter' $css 'flex: 0 0 1.15rem'
Assert-Absent 'Generated retired EasyStud help dot' $css '.local-groupimport-easystud-help-dot'

Write-Host 'EasyStud Wave 13 contextual-help contract passed.' -ForegroundColor Green
