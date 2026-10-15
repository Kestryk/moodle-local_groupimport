$ErrorActionPreference = 'Stop'

# T050/T051 (Kevin 16/10/2026, decision 6, Penpot S6-D5b/c): the import history and restore
# dialogs join the T045 dialog family. Rows carry a 22px state pill and quiet text actions on one
# line (the former 1.9rem outlined action buttons are replaced); the footer is sticky.

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\views\_mass-import.scss')
$recipes = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_dialog-recipes.scss')
$styles = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'styles\mass-import.css')
$page = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'index.php')
$script = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\src\csv_import.js')

function Assert-Contains([string]$value, [string]$needle, [string]$message) {
    if (-not $value.Contains($needle)) {
        throw $message
    }
}

Assert-Contains $source '@include recipes.dialog-shell(48.75rem);' 'Import history must use the 780px dialog shell.'
Assert-Contains $source '@include recipes.dialog-footer;' 'Import dialogs must use the sticky family footer.'
Assert-Contains $source '@include recipes.dialog-pill(empty);' 'Import history states must be family pills.'
Assert-Contains $source '@include recipes.dialog-text-action;' 'Import history actions must be quiet text actions.'
Assert-Contains $source 'grid-template-columns: minmax(0, 1fr) auto auto;' 'History rows keep file, state and actions on one line.'
Assert-Contains $source '@media (max-width: 36rem)' 'History must become a full-height sheet at 390px.'
Assert-Contains $recipes 'block-size: 1.375rem;' 'Every label of the family is 22px.'
Assert-Contains $page "'data-local-groupimport-rollback-open' => (int)`$record->id" 'Restore stays available on each row.'
Assert-Contains $page "'historyid' => (int)`$record->id" 'The annotated Excel report stays available on each row.'
Assert-Contains $page "local_groupimport_count_string('importhistorycount', `$historycount)" 'The footer summarises the import count.'
Assert-Contains $page 'easyedu-button--danger' 'Restore confirmation uses the Kit danger button, not Bootstrap.'
Assert-Contains $script '[data-local-groupimport-history-dismiss]' 'The footer Close is bound with the header Close.'
Assert-Contains $styles '.local-groupimport-import-history__actions' 'Generated CSS must contain the Import history action selector.'
Assert-Contains $styles '.local-groupimport-import-modal__footer' 'Generated CSS must contain the sticky footer.'
Assert-Contains $styles '@media (max-width: 36rem)' 'Generated CSS must contain the 390 sheet.'
if ($page.Contains("'class' => 'btn btn-danger'") -or $page.Contains('btn btn-outline-danger btn-sm')) {
    throw 'Import dialogs must not keep Bootstrap 36px buttons.'
}

Write-Output 'Import history action contract passed.'
