$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$source = (@('cards', 'filters', 'group_card_controls', 'list_controls', 'navigation', 'workspace', 'context_menu', 'pagination', 'layout') |
    ForEach-Object { Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $pluginRoot ('amd\src\local\cm\' + $_ + '.js')) }) -join "`n"
$build = (@('cards', 'filters', 'group_card_controls', 'list_controls', 'navigation', 'workspace', 'context_menu', 'pagination', 'layout') |
    ForEach-Object { Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $pluginRoot ('amd\build\local\cm\' + $_ + '.min.js')) }) -join "`n"
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss')
$responsive = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\responsive\_desktop.scss')
$controlTypography = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_control-typography.scss')
$sharedControlTreatment = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\components\_control-treatment.scss')
$tokens = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\_tokens.scss')

$requiredSource = @(
    'is-actions-menu-open',
    'event.stopImmediatePropagation()',
    'is-sort-menu-open',
    'pagination.classList.toggle',
    'placeManagedStateBeforeBottomPagination',
    'list.insertBefore(state, bottomPagination || null);',
    "inside && position === 'bottom'",
    'ResizeObserver',
    'data-easystud-group-actions-menu',
    'header.appendChild(trigger);'
)

foreach ($needle in $requiredSource) {
    if (-not $source.Contains($needle)) {
        throw "Missing source contract: $needle"
    }
}

foreach ($needle in @('is-actions-menu-open', 'is-sort-menu-open')) {
    if (-not $build.Contains($needle)) {
        throw "Missing generated AMD contract: $needle"
    }
    if (-not $structure.Contains($needle)) {
        throw "Missing SCSS contract: $needle"
    }
}

if (-not $build.Contains('placeManagedStateBeforeBottomPagination')) {
    throw 'Missing generated AMD pagination-order contract.'
}

if (-not $build.Contains('inside&&"bottom"===position&&list.appendChild(pagination)')) {
    throw 'Missing generated AMD bottom-pagination final-child contract.'
}

foreach ($needle in @(
    '&-card-menu {',
    '@include easyedu.mobile-card-menu-trigger;',
    '[data-easystud-group-actions-toggle][data-easystud-card-menu][hidden]'
)) {
    if (-not $responsive.Contains($needle)) {
        throw "Missing responsive More-actions contract: $needle"
    }
}

if (-not $tokens.Contains('--easyedu-font-family-ui: inherit;') -or
        -not $structure.Contains('[data-easystud-list-sort-label]') -or
        -not $structure.Contains('font: inherit;')) {
    throw 'Missing inherited typography contract for More filters, counters or Sort.'
}

# T055 moved these lifecycles into their actual owning modules.
$render = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\src\local\cm\render.js')
$navigation = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'amd\src\local\cm\navigation.js')
if ($render -notmatch 'scheduleGroupGroupingOverflow\(root\);' -or
        $navigation -notmatch 'scheduleResponsiveUiRefresh\(root, \{pagination: false\}\);\s+scheduleCompleteListAlignment\(root\);' -or
        $navigation -notmatch '(?s)trackLayoutSwap.*?then\(\(\) => \{.*?scheduleCompleteListAlignment\(root\);') {
    throw 'Missing Grouping-label resize recovery contract.'
}

if (-not $structure.Contains('margin-inline-start: auto;') -or
        -not $structure.Contains('order: 2;')) {
    throw 'Missing logical end-alignment contract for recovered More actions.'
}

if (-not $structure.Contains('[data-easystud-list-sort-dropdown].is-open') -or
        -not $structure.Contains('z-index: 42;')) {
    throw 'Missing opened Sort dropdown paint-owner contract.'
}

foreach ($needle in @(
    '[data-easystud-advanced-filters-toggle]',
    '&-pagination__sort > span',
    '[data-easystud-list-sort-dropdown] > &-dropdown__button',
    '&-pagination__count',
    '@include easyedu.control-regular-type;',
    '@include easyedu.control-count-type;'
)) {
    if (-not $controlTypography.Contains($needle)) {
        throw "Missing restrained controls typography contract: $needle"
    }
}

foreach ($needle in @(
    '[data-easystud-card-menu]',
    '[data-easystud-panel-actions-toggle]',
    '[data-easystud-context-action]',
    '&-group__actions-menu .btn',
    '@include easyedu.action-text-treatment($legacy-priority: true);'
)) {
    if (-not $controlTypography.Contains($needle)) {
        throw "Missing transversal More-actions Kit adapter: $needle"
    }
}

if ($source -notmatch 'const bindNestedGroupActionMenus = root => \{[\s\S]*?if \(toggle && root\.contains\(toggle\)\) \{(?:\s*//[^\r\n]*)*\s*if \(isResponsiveWorkspace\(\)\) \{\s*closeMenus\(null\);\s*return;\s*\}\s*event\.preventDefault\(\);') {
    throw 'Responsive Group menu clicks must reach the shared context-sheet controller before desktop interception.'
}

# Shared paint/typography was extracted earlier. Keep checking the actual
# contract, not stale literals that no longer belong in the selector adapter.
foreach ($needle in @(
    'font-family: inherit;',
    'font-weight: var(--easyedu-font-weight-regular);',
    'font-weight: var(--easyedu-font-weight-semibold);',
    '&:hover,',
    '&:active,',
    '&:focus-visible',
    'text-decoration: none !important;'
)) {
    if (-not $sharedControlTreatment.Contains($needle)) {
        throw "Missing shared More-actions treatment: $needle"
    }
}

Write-Output 'Card action overflow and Sort stacking contract passed.'
