param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $root $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing Navigation Skeleton contract file: $RelativePath"
    }

    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains {
    param(
        [string]$Label,
        [string]$Contents,
        [string]$Fragment
    )

    if (-not $Contents.Contains($Fragment)) {
        throw "$Label is missing required contract fragment: $Fragment"
    }
}

$snapshot = '45c5cb1a0c8364bd77c343b14af2ee71416a4bcb'
$component = Read-RequiredFile 'scss\easyedu\components\_navigation-skeleton.scss'
$loadingComponent = Read-RequiredFile 'scss\easyedu\components\_loading.scss'
$tokens = Read-RequiredFile 'scss\easyedu\_tokens.scss'
$components = Read-RequiredFile 'scss\easyedu\_components.scss'
$kitReadme = Read-RequiredFile 'scss\easyedu\README.md'
$studentMarkup = Read-RequiredFile 'templates\manage.mustache'
$massImport = Read-RequiredFile 'index.php'
$studentStyles = Read-RequiredFile 'scss\components\_layout.scss'
$massImportStyles = Read-RequiredFile 'scss\views\_mass-import.scss'
$adminStyles = Read-RequiredFile 'scss\views\_admin-settings.scss'
$documentation = Read-RequiredFile 'docs\testing\navigation-skeleton-parity.md'
$coverage = Read-RequiredFile 'docs\testing\skeleton-k3-coverage.md'
$agents = Read-RequiredFile 'AGENTS.md'
$zoomScenario = Read-RequiredFile 'tools\playwright\navigation-skeleton-zoom.spec.js'
$loadingBootstrap = Read-RequiredFile 'js\loading_state_bootstrap.js'

foreach ($fragment in @(
    '@mixin navigation-skeleton-frame',
    '@mixin navigation-skeleton-compact-frame',
    '@mixin navigation-skeleton-guide-start-cue',
    '@mixin navigation-skeleton-cue',
    '@mixin navigation-skeleton-cue-overlay',
    '@mixin navigation-skeleton-cue-stack',
    '@mixin navigation-skeleton-single-line',
    '@mixin navigation-skeleton-compact-cue',
    '@mixin navigation-skeleton-compact-mobile',
    'skeleton-shimmer-direct',
    'skeleton-shimmer-overlay',
    ':dir(rtl)',
    '[dir="rtl"]',
    'forced-colors: active',
    'loading.skeleton-section-frame',
    'flex-flow: row nowrap'
)) {
    Assert-Contains 'Vendored Navigation Skeleton component' $component $fragment
}

$frameStart = $component.IndexOf('@mixin navigation-skeleton-frame')
$frameEnd = $component.IndexOf('@mixin navigation-skeleton-compact-frame', $frameStart)
if ($frameStart -lt 0 -or $frameEnd -le $frameStart) {
    throw 'Navigation Skeleton frame mixin boundary is missing.'
}
$frameMixin = $component.Substring($frameStart, $frameEnd - $frameStart)
if ($frameMixin.Contains('animation') -or $frameMixin.Contains('shimmer')) {
    throw 'Navigation Skeleton frame must remain static; animation belongs to internal cues only.'
}

Assert-Contains 'Kit aggregator' $components '@forward "components/navigation-skeleton";'
Assert-Contains 'Embedded Kit README' $kitReadme $snapshot
foreach ($fragment in @(
    '@mixin skeleton-section-frame',
    '@mixin skeleton-section-inline-accent',
    '@mixin skeleton-structural-container-block-accent',
    '@mixin skeleton-structural-container-frame',
    '@mixin skeleton-cue-stack',
    '@mixin skeleton-section-compact',
    'animation: none'
)) {
    Assert-Contains 'Vendored Loading component' $loadingComponent $fragment
}
foreach ($fragment in @(
    '--easyedu-loading-section-accent',
    '--easyedu-loading-section-surface',
    '--easyedu-loading-section-compact-icon-slot-size'
    '--easyedu-loading-container-accent',
    '--easyedu-loading-container-border-width',
    '--easyedu-navigation-skeleton-compact-line-inline-size',
    '--easyedu-navigation-skeleton-compact-min-block-size',
    '--easyedu-navigation-skeleton-compact-mobile-min-block-size'
)) {
    Assert-Contains 'Vendored Loading tokens' $tokens $fragment
}
Assert-Contains 'Student Management markup' $studentMarkup 'data-easyedu-navigation-skeleton="1"'
Assert-Contains 'Student Management markup' $studentMarkup 'aria-hidden="true"'
Assert-Contains 'Mass Import markup' $massImport "'data-easyedu-navigation-skeleton' => '1'"
Assert-Contains 'Mass Import markup' $massImport "'aria-hidden' => 'true'"
Assert-Contains 'Mass Import no-script fallback' $massImport "html_writer::tag('noscript'"
Assert-Contains 'Mass Import no-script fallback' $massImport '[data-easystud-loading-skeleton] { display: none !important; }'
Assert-Contains 'Mass Import no-script fallback' $massImport '[data-easystud-real-content] { display: block !important; }'
Assert-Contains 'Mass Import JavaScript busy lifecycle' $loadingBootstrap "root.setAttribute('aria-busy', 'true');"
if ($massImport.Contains("'aria-busy' => 'true'")) {
    throw 'Mass Import must not emit aria-busy when its no-script fallback reveals usable content.'
}
Assert-Contains 'Student Management styles' $studentStyles 'navigation-skeleton-cue-overlay'
Assert-Contains 'Student Management K3 styles' $studentStyles 'navigation-skeleton-compact-frame'
Assert-Contains 'Student Management K3 styles' $studentStyles 'navigation-skeleton-guide-start-cue'
Assert-Contains 'Student Management K3.1 styles' $studentStyles 'navigation-skeleton-single-line'
Assert-Contains 'Student Management K3 styles' $studentStyles 'navigation-skeleton-compact-cue'
Assert-Contains 'Student Management K3.1 styles' $studentStyles 'skeleton-structural-container-frame'
Assert-Contains 'Student Management K3.1 styles' $studentStyles 'skeleton-structural-container-block-accent'
Assert-Contains 'Student Management K3.1 styles' $studentStyles 'skeleton-section-frame'
$viewToggleStart = $studentStyles.IndexOf('&__loading-view-toggle {')
$viewToggleEnd = $studentStyles.IndexOf('&__loading-view-toggle-item {', $viewToggleStart)
if ($viewToggleStart -lt 0 -or $viewToggleEnd -le $viewToggleStart) {
    throw 'Student Management Navigation Skeleton frame boundary is missing.'
}
$viewToggle = $studentStyles.Substring($viewToggleStart, $viewToggleEnd - $viewToggleStart)
Assert-Contains 'Student Management Navigation Skeleton frame' $viewToggle 'box-sizing: border-box'
Assert-Contains 'Student Management Navigation Skeleton frame' $viewToggle 'max-inline-size: 100%'
if ($viewToggle.Contains('skeleton-')) {
    throw 'Student Management view toggle must not receive a Skeleton frame or border.'
}
Assert-Contains 'Student Management styles' $studentStyles '@media (max-width: 20rem)'
Assert-Contains 'Student Management compact Navigation Skeleton frame' $studentStyles 'block-size: var(--easyedu-navigation-skeleton-compact-min-block-size);'
Assert-Contains 'Student Management compact Navigation Skeleton frame' $studentStyles 'box-sizing: border-box;'
Assert-Contains 'Student Management styles' $studentStyles '&__loading-header-actions,'
Assert-Contains 'Student Management styles' $studentStyles '&__loading-pagination-rail {'
Assert-Contains 'Mass Import styles' $massImportStyles 'navigation-skeleton-cue'
Assert-Contains 'Mass Import K3 styles' $massImportStyles 'navigation-skeleton-compact-frame'
Assert-Contains 'Mass Import K3 styles' $massImportStyles 'navigation-skeleton-guide-start-cue'
Assert-Contains 'Mass Import K3.1 styles' $massImportStyles 'navigation-skeleton-single-line'
Assert-Contains 'Mass Import K3 styles' $massImportStyles 'navigation-skeleton-compact-cue'
Assert-Contains 'Mass Import K3.1 styles' $massImportStyles 'skeleton-structural-container-frame'
Assert-Contains 'Mass Import styles' $massImportStyles '@media (max-width: 20rem)'
Assert-Contains 'Mass Import compact Navigation Skeleton frame' $massImportStyles 'block-size: var(--easyedu-navigation-skeleton-compact-min-block-size);'
Assert-Contains 'Mass Import compact Navigation Skeleton frame' $massImportStyles 'box-sizing: border-box;'
Assert-Contains 'Mass Import styles' $massImportStyles '&__loading-actions {'
Assert-Contains 'Mass Import styles' $massImportStyles '&__loading-action {'
Assert-Contains 'Mass Import styles' $massImportStyles 'flex: 1 1 0;'
Assert-Contains 'Mass Import compact busy indicator' $massImportStyles '&.is-action-busy::after {'
Assert-Contains 'Mass Import compact busy indicator' $massImportStyles 'height: 1.6rem;'
Assert-Contains 'Mass Import compact busy indicator' $massImportStyles 'width: 1.6rem;'
Assert-Contains 'Mass Import compact busy indicator' $massImportStyles 'bottom: 1.95rem;'
Assert-Contains 'Mass Import compact busy indicator' $massImportStyles 'right: 2.1rem;'
Assert-Contains 'Mass Import Skeleton grid' $massImportStyles '&__loading-grid {'
Assert-Contains 'Mass Import Skeleton grid' $massImportStyles 'inline-size: 100%'
Assert-Contains 'Mass Import Skeleton grid' $massImportStyles 'grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);'
Assert-Contains 'Mass Import Skeleton fields' $massImportStyles '&__loading-field {'
Assert-Contains 'Mass Import Skeleton fields' $massImportStyles 'box-sizing: border-box'
if ($adminStyles.Contains('navigation-skeleton-frame')) {
    throw 'Administration must remain outside the visual Skeleton consumer lot.'
}

foreach ($consumer in @(
    @{Label = 'Student Management styles'; Contents = $studentStyles},
    @{Label = 'Mass Import styles'; Contents = $massImportStyles}
)) {
    if ($consumer.Contents.Contains('skeleton-shimmer-direct') -or
        $consumer.Contents.Contains('skeleton-shimmer-overlay')) {
        throw "$($consumer.Label) must use the Navigation Skeleton cue primitive rather than a local shimmer mixin."
    }
}

$studentCueCount = [regex]::Matches(
    $studentMarkup,
    'class="[^"]*local-groupimport-easystud__loading-surface[^"]*"'
).Count
if ($studentCueCount -ne 50) {
    throw "Student Management must retain 50 animated internal cues; found $studentCueCount."
}

$loopStart = $massImport.IndexOf('for ($skeletoncard = 0;')
if ($loopStart -lt 0) {
    throw 'Mass Import Skeleton card loop is missing.'
}
$loopEnd = $massImport.IndexOf('echo html_writer::end_div();', $loopStart)
if ($loopEnd -lt 0) {
    throw 'Mass Import Skeleton card loop terminator is missing.'
}
$massImportHeader = $massImport.Substring(0, $loopStart)
$massImportCard = $massImport.Substring($loopStart, $loopEnd - $loopStart)
$massImportHeaderCueCount = [regex]::Matches(
    $massImportHeader,
    'local-groupimport-import__loading-surface'
).Count
$massImportCuePerCard = [regex]::Matches(
    $massImportCard,
    'local-groupimport-import__loading-surface'
).Count
if ($massImportHeaderCueCount -ne 7 -or $massImportCuePerCard -ne 7 -or
    -not $massImportCard.Contains('$skeletoncard < 2')) {
    throw 'Mass Import Skeleton cue formula must remain eight header cues plus two cards with seven cues each.'
}
$massImportCueCount = $massImportHeaderCueCount + (2 * $massImportCuePerCard)
if ($massImportCueCount -ne 21) {
    throw "Mass Import must retain 21 animated internal cues; found $massImportCueCount."
}

Assert-Contains 'Navigation Skeleton documentation' $documentation '| Student Management | 48 | 50 |'
Assert-Contains 'Navigation Skeleton documentation' $documentation '| Mass Import | 19 | 21 |'
Assert-Contains 'Navigation Skeleton documentation' $documentation $snapshot
Assert-Contains 'K3 coverage matrix' $coverage '| Student Management (`manage.php`, `templates/manage.mustache`) | Yes'
Assert-Contains 'K3 coverage matrix' $coverage '| Mass Import (`index.php`) | Yes'
Assert-Contains 'K3 coverage matrix' $coverage '| Administration/settings (`settings.php`) | No'
Assert-Contains 'Local K3.1 agent rule' $agents 'K3.1 Navigation Skeleton consumers'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'documentScrollWidth'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'documentClientWidth + 1'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'skeleton?.getBoundingClientRect()'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'skeletonScrollWidth'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'skeleton.clientWidth + 1'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'EASYEDU_CHROMIUM_EXECUTABLE'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'per_host_zoom_levels: {'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'x: {'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'navigationCueCount'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'realNavigationHeight'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'structuralBorders'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'cardBorders'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'toggleBorder'
Assert-Contains 'Navigation Skeleton zoom scenario' $zoomScenario 'focusableCount'

Write-Host "Navigation Skeleton K3.1 source contract passed: Student Management 48 -> 50 cues; Mass Import 19 -> 21 cues."
