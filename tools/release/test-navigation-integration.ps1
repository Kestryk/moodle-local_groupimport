[CmdletBinding()]
param(
    [string]$PluginRoot = ''
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($PluginRoot)) {
    $PluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains {
    param(
        [string]$Name,
        [string]$Content,
        [string]$Pattern,
        [string]$Message
    )

    if ($Content -notmatch $Pattern) {
        $failures.Add("${Name}: $Message")
    }
}

function Assert-NotContains {
    param(
        [string]$Name,
        [string]$Content,
        [string]$Pattern,
        [string]$Message
    )

    if ($Content -match $Pattern) {
        $failures.Add("${Name}: $Message")
    }
}

function Read-RequiredFile {
    param([string]$RelativePath)

    $path = Join-Path $PluginRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("${RelativePath}: required integration file is missing")
        return ''
    }
    return Get-Content -LiteralPath $path -Raw
}

$manage = Read-RequiredFile 'manage.php'
$import = Read-RequiredFile 'index.php'
$library = Read-RequiredFile 'lib.php'
$template = Read-RequiredFile 'templates/manage.mustache'
$wrapper = Read-RequiredFile 'templates/easyedu_navigation.mustache'
$items = Read-RequiredFile 'templates/easyedu_navigation_items.mustache'
$controller = Read-RequiredFile 'amd/src/easyedu_navigation.js'
$navigationBuild = Read-RequiredFile 'amd/build/easyedu_navigation.min.js'
$courseManager = Read-RequiredFile 'amd/src/course_manager.js'
$navigationStyles = Read-RequiredFile 'scss/easyedu/components/_navigation.scss'
$layoutStyles = Read-RequiredFile 'scss/components/_layout.scss'
$massImportNavigationStyles = Read-RequiredFile 'scss/components/_mass-import-navigation.scss'
$generatedStyles = Read-RequiredFile 'styles.css'
$guideComponentStyles = Read-RequiredFile 'scss/easyedu/components/_guide.scss'
$guideStyles = Read-RequiredFile 'scss/components/_easyedu-guide.scss'
$guideTemplate = Read-RequiredFile 'templates/easyedu_guide.mustache'
$responsiveAudit = Read-RequiredFile 'tools/playwright/responsive-audit.spec.js'
$nativeDrawerClearanceAudit = Read-RequiredFile 'tools/playwright/easystud-navigation-native-drawer-clearance.spec.js'
$playwrightRunner = Read-RequiredFile 'tools/playwright/Invoke-EasyStudPlaywrightWithSavedCredentials.ps1'
$playwrightConfig = Read-RequiredFile 'tools/playwright/playwright.config.js'

Assert-Contains 'manage.php' $manage 'participants_action_bar' 'navigation must use Moodle''s server-owned action bar export'
Assert-Contains 'manage.php' $manage 'local_groupimport_build_navigation_context' 'navigation context builder must be called'
Assert-Contains 'manage.php' $manage 'hasparticipantdropdown' 'native participant select state must remain in the normalized context'
Assert-Contains 'manage.php' $manage 'participantdropdown' 'native participant select export must remain server-owned'
Assert-Contains 'manage.php' $manage 'easystudmanager.*,.*local_groupimport' 'native participant select must show the current EasyStud destination'
Assert-Contains 'manage.php' $manage "'viewGroups'" 'Guide must name the mobile Groups workspace explicitly'
Assert-Contains 'manage.php' $manage "'viewGroupings'" 'Guide must name the mobile Groupings workspace explicitly'
Assert-Contains 'manage.php' $manage "'viewParticipants'" 'Guide must name the mobile Participants workspace explicitly'
Assert-Contains 'manage.php' $manage "'highlightview' => 'groups'" 'group Guide slides must route to the Groups workspace'
Assert-Contains 'manage.php' $manage "'highlightview' => 'groupings'" 'grouping Guide slides must route to the Groupings workspace'
Assert-Contains 'manage.php' $manage "'participantCardActions'" 'responsive participant guided steps must target the card action control'
Assert-Contains 'manage.php' $manage "'target' => 'participantCardActions'" 'adding a participant must not stop at the Participants view'
Assert-NotContains 'manage.php' $manage 'htmlspecialchars_decode|moodle-item|moodle-section' 'native action-bar options must not be flattened into generic links'
Assert-NotContains 'manage.php' $manage 'DOMDocument|prepare_navigation_html|render_participants_tertiary_nav' 'legacy HTML parsing or tertiary renderer must be absent'

Assert-Contains 'index.php' $import 'local_groupimport_build_mass_import_navigation_context' 'Mass Import must prepare its owned navigation context'
Assert-Contains 'index.php' $import "render_from_template\('local_groupimport/easyedu_navigation'" 'Mass Import must render the shared navigation template'
Assert-Contains 'index.php' $import "js_call_amd\('local_groupimport/easyedu_navigation'" 'Mass Import must initialise the shared navigation controller'
Assert-Contains 'index.php' $import 'local-groupimport-import-navigation' 'Mass Import navigation requires a stable consumer root'
Assert-Contains 'index.php' $import 'local-groupimport-easystud__navigation' 'Mass Import must reuse the established shared Navigation presentation'
Assert-Contains 'index.php' $import 'local-groupimport-easystud local-groupimport-easystud__navigation' 'Mass Import must inherit the EasyStud token scope in the shared action rail'
Assert-Contains 'index.php' $import 'The shared navigation replaces the legacy Mass Import action row only' 'Mass Import must replace, rather than duplicate, the legacy action rail'
Assert-Contains 'index.php' $import "'data-easyedu-loading-bootstrap' => '1'" 'Mass Import must preserve the Skeleton bootstrap contract'
Assert-Contains 'index.php' $import "'data-easystud-real-content' => '1'" 'Mass Import must preserve the real-content wrapper contract'
Assert-NotContains 'index.php' $import 'local-groupimport-import__header-actions' 'Mass Import must not retain a duplicate legacy action rail'
Assert-Contains 'lib.php' $library 'function local_groupimport_build_mass_import_navigation_context' 'Mass Import navigation context helper is missing'
Assert-Contains 'lib.php' $library "'id' => 'easystud-manager'" 'Mass Import navigation must retain the Simplified Student Management destination'
Assert-Contains 'lib.php' $library "'id' => 'easystud-import'" 'Mass Import navigation must expose its current destination'
Assert-Contains 'lib.php' $library "'id' => 'mass-import-download-template'" 'Mass Import navigation must retain the existing template download action'
Assert-Contains 'lib.php' $library "'id' => 'mass-import-history'" 'Mass Import navigation must retain the existing import history action'
Assert-Contains 'lib.php' $library "'action' => 'mass-import-history'" 'Mass Import history must use the shared stable action hook'
Assert-Contains 'lib.php' $library "'hasparticipantdropdown' => false" 'Mass Import must not copy the Simplified-only participant selector'
Assert-Contains 'lib.php' $library "'current' => true" 'Mass Import navigation must expose a current-page destination'
Assert-Contains 'amd/src/csv_import.js' (Read-RequiredFile 'amd/src/csv_import.js') 'data-easyedu-navigation-action="mass-import-history"' 'Mass Import history must bind shared navigation action triggers'
Assert-Contains 'amd/src/csv_import.js' (Read-RequiredFile 'amd/src/csv_import.js') 'openButtons' 'Mass Import history must bind desktop and compact action triggers'

Assert-Contains 'manage.mustache' $template '\{\{>\s*local_groupimport/easyedu_navigation\s*\}\}' 'consumer must render the namespaced shared navigation wrapper'
if ([regex]::Matches($template, 'local_groupimport/easyedu_navigation').Count -ne 1) {
    $failures.Add('manage.mustache: navigation wrapper must be included exactly once')
}
Assert-Contains 'manage.mustache' $template 'data-easystud-participant-navigation' 'native participant dropdown must remain in the EasyStud header'
Assert-Contains 'manage.mustache' $template '\{\{>\s*core/select_menu\s*\}\}' 'header must render Moodle native select_menu'
Assert-NotContains 'manage.mustache' $template 'navigationhtml|data-easystud-mobile-nav|data-easystud-mobile-nav-panel' 'old duplicated navigation markup must be absent'
Assert-Contains 'easyedu_guide.mustache' $guideTemplate 'guidehoverlabel' 'guide capsule must use a localized visual label'
Assert-Contains 'easyedu_guide.mustache' $guideTemplate 'aria-hidden="true"' 'guide capsule label must not duplicate the button accessible name'
Assert-NotContains 'easyedu_guide.mustache' $guideTemplate 'data-easystud-hover-help' 'responsive Guide launcher must not add a redundant hover-help bubble'

Assert-Contains 'easyedu_navigation.mustache' $wrapper 'data-easyedu-navigation="1"' 'wrapper root contract is missing'
Assert-Contains 'easyedu_navigation.mustache' $wrapper 'data-easyedu-navigation-panel="1"' 'compact panel contract is missing'
Assert-Contains 'easyedu_navigation.mustache' $wrapper 'data-easyedu-navigation-trigger-row="1"' 'compact trigger must have a reserved flow row'
Assert-Contains 'easyedu_navigation.mustache' $wrapper 'easyedu-navigation__trigger-label' 'compact trigger must expose its localized hover label'
Assert-Contains 'easyedu_navigation.mustache' $wrapper '\{\{triggerlabel\}\}' 'compact trigger hover label must remain localized'
Assert-Contains 'easyedu_navigation.mustache' $wrapper '\{\{>\s*local_groupimport/easyedu_navigation_items\s*\}\}' 'desktop and compact wrappers must use the namespaced item partial'
Assert-Contains 'easyedu_navigation.mustache' $wrapper 'data-easyedu-navigation-participant-links="1"' 'compact panel must expose the isolated Moodle participant destination slot'
if ([regex]::Matches($wrapper, 'local_groupimport/easyedu_navigation_items').Count -ne 2) {
    $failures.Add('easyedu_navigation.mustache: shared item partial must be used once by each presentation')
}
Assert-Contains 'easyedu_navigation_items.mustache' $items 'data-easyedu-navigation-action' 'utility action hook is missing'
Assert-Contains 'easyedu_navigation_items.mustache' $items 'aria-current="page"' 'current destination semantics are missing'

Assert-Contains 'easyedu_navigation.js' $controller 'export const init' 'source controller must expose init'
Assert-Contains 'easyedu_navigation.js' $controller 'aria-hidden' 'controller must manage compact visibility'
Assert-Contains 'easyedu_navigation.js' $controller 'Escape' 'controller must close on Escape'
Assert-Contains 'easyedu_navigation.js' $controller 'easyedu:guide-interface-transition' 'controller must close when the Guide leaves for the interface'
Assert-Contains 'easyedu_navigation.js' $controller 'Spacebar' 'compact trigger must support explicit keyboard activation'
Assert-NotContains 'easyedu_navigation.mustache' $wrapper 'data-easyedu-navigation-participant-source|data-easyedu-navigation-participant-slot' 'native participant dropdown must not be owned by canonical navigation'
Assert-Contains 'course_manager.js' $courseManager "local_groupimport/easyedu_navigation" 'consumer must initialize the canonical controller'
Assert-Contains 'course_manager.js' $courseManager 'bindResponsiveParticipantNavigation' 'consumer must restore the isolated responsive Moodle participant category'
Assert-Contains 'course_manager.js' $courseManager 'data-easyedu-navigation-participant-item' 'consumer must copy Moodle participant destinations as accessible links'
Assert-Contains 'course_manager.js' $courseManager 'MutationObserver' 'consumer must resync links when Moodle populates the native participant menu'
Assert-Contains 'course_manager.js' $courseManager 'easyedu-guide-responsive-anchor' 'responsive Guide must preserve its desktop insertion point'
Assert-Contains 'course_manager.js' $courseManager 'document\.body\.appendChild\(guideNode\)' 'responsive Guide overlays must be portalled outside the closable drawer'
Assert-Contains 'course_manager.js' $courseManager 'preserveGuidePortalTheme' 'the portalled Guide must retain product theme tokens'
Assert-Contains 'course_manager.js' $courseManager 'data-easyedu-guide-portal-theme' 'the portal must expose its preserved-theme state for runtime validation'
Assert-Contains 'course_manager.js' $courseManager 'data-easyedu-responsive-guide-launcher' 'compact navigation must expose a dedicated Guide launcher clone'
Assert-Contains 'course_manager.js' $courseManager 'guideLauncher\.cloneNode\(true\)' 'only the compact launcher may be cloned while the initialized Guide root remains unique'
Assert-NotContains 'course_manager.js' $courseManager 'easyedu-participant-menu|data-easyedu-navigation-participant-source|data-easyedu-navigation-participant-slot' 'consumer must not move participant dropdown into navigation'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'position: absolute' 'guide capsule must stay out of navigation layout flow'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles '(?s)\.easyedu-navigation__guide-source\s*\{[^}]*position:\s*absolute' 'guide launcher wrapper must stay out of the desktop centering flow'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'flex:\s*1 1 100%' 'desktop destinations must use the full navigation width for centering'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'transform:' 'guide capsule must animate spatial motion without width changes'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'is-guide-label-top' 'guide capsule must have a collision placement state'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'local-groupimport-easystud-guide-launcher-gradient' 'guide capsule must consume the exact local launcher gradient'
Assert-Contains 'scss/components/_easyedu-guide.scss' $guideStyles 'linear-gradient\(135deg, var\(--easyedu-primary\) 0%, var\(--easyedu-accent\) 100%\)' 'launcher gradient token must match the established EasyStud button gradient'
Assert-Contains 'easyedu_navigation.js' $controller 'getBoundingClientRect' 'controller must measure placement before revealing the capsule'
Assert-Contains 'easyedu_navigation.js' $controller 'requestAnimationFrame' 'controller must debounce responsive placement recalculation'
Assert-Contains 'easyedu_navigation.js' $controller 'is-guide-label-suppressed' 'controller must suppress the capsule while the guide modal is open'
Assert-Contains 'easyedu_navigation.js' $controller 'easyedu-navigation-native-trigger-edge' 'controller must publish the Moodle drawer opener edge'
Assert-NotContains 'easyedu_navigation.js' $controller 'data-easystud-participant-navigation' 'Navigation trigger placement must not depend on participant workspace geometry'
Assert-Contains 'amd/build/easyedu_navigation.min.js' $navigationBuild 'easyedu-navigation-native-trigger-edge' 'generated Navigation AMD must publish the Moodle drawer opener edge'
Assert-NotContains 'amd/build/easyedu_navigation.min.js' $navigationBuild 'data-easystud-participant-navigation' 'generated Navigation AMD must not depend on participant workspace geometry'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'focus-visible' 'guide capsule must expose keyboard focus styling'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'is-guide-label-suppressed' 'navigation styles must remove the capsule from the modal paint layer'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'easyedu-navigation__trigger-row' 'compact trigger must use the reserved flow row'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'easyedu-navigation-native-trigger-edge' 'trigger styles must clear the measured Moodle drawer opener'
Assert-Contains 'styles.css' $generatedStyles 'easyedu-navigation-native-trigger-edge' 'generated trigger styles must clear the measured Moodle drawer opener'
Assert-Contains 'easystud-navigation-native-drawer-clearance.spec.js' $nativeDrawerClearanceAudit 'easystud-navigation-native-drawer-clearance' 'dedicated browser scenario identifier is missing'
Assert-Contains 'easystud-navigation-native-drawer-clearance.spec.js' $nativeDrawerClearanceAudit 'width: 390' 'dedicated browser scenario must run only at 390 px'
Assert-Contains 'easystud-navigation-native-drawer-clearance.spec.js' $nativeDrawerClearanceAudit 'data-region="drawer-toggle"' 'dedicated browser scenario must target Moodle''s native drawer opener'
Assert-Contains 'easystud-navigation-native-drawer-clearance.spec.js' $nativeDrawerClearanceAudit 'overlaps.*toBe\(false\)' 'dedicated browser scenario must reject native drawer overlap'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'position: fixed' 'compact trigger must remain persistent like Moodle''s drawer handle'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'border-radius: 0 999px 999px 0' 'compact trigger must use the Moodle-like left-edge half-pill shape'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles '50dvh' 'compact trigger must rest at the viewport vertical centre'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'max-width: 40rem' 'phone trigger must reserve its documented participant-selector clearance'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles '\$phone-trigger-clearance' 'phone trigger clearance must be consumer opt-in'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles '@if \$phone-trigger-clearance' 'participant-selector clearance must not affect every consumer'
Assert-Contains 'scss/components/_layout.scss' $layoutStyles 'navigation-component\(64rem, true\)' 'Simplified Student Management must retain participant-selector clearance'
Assert-Contains 'scss/components/_mass-import-navigation.scss' $massImportNavigationStyles '50dvh' 'Mass Import must retain a centred phone trigger without participant clearance'
Assert-Contains 'styles.css' $generatedStyles 'local-groupimport-import-navigation \.easyedu-navigation__trigger' 'generated Mass Import phone-trigger override is missing'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'translateY\(-50%\)' 'compact trigger must retain its vertical placement under reduced motion'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'easyedu-navigation__trigger-label' 'compact trigger must style its explicit hover label'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'inline-size var\(--easyedu-motion-fast\)' 'compact trigger must animate its hover expansion'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'easyedu-navigation__guide-slot .*easyedu-guide__launcher' 'compact guide must be styled as a navigation row'
Assert-NotContains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'guide-slot .*local-groupimport-easystud-easyedu-guide .*easyedu-guide__launcher' 'compact launcher styling must not depend on the root omitted by its safe clone'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles '(?s)easyedu-navigation__guide-slot .*easyedu-guide__launcher\s*\{.*--local-groupimport-easystud-guide-launcher-gradient' 'compact launcher must provide the gradient token no longer inherited from the portalled Guide root'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'easyedu-guide__launcher-label' 'compact guide must expose its visible gradient label'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'background-image:' 'compact guide must own its softened full-width gradient'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'rgba\(255, 255, 255, 0\.48\)' 'compact guide gradient must retain a controlled lighter overlay than the desktop launcher gradient'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'background-position: 0 0, 100% 50%' 'compact guide hover must reverse the gradient movement'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'linear-gradient\(var\(--easyedu-surface\), var\(--easyedu-surface\)\)' 'compact guide hover must use a white surface'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'background-clip: text' 'compact guide hover must move the gradient to icon and label text'
Assert-Contains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'font-size: 1rem' 'compact guide label must use the enlarged responsive size'
Assert-Contains 'scss/easyedu/components/_guide.scss' $guideComponentStyles 'var\(--easyedu-navigation-layer-panel, 1066\) \+ 1' 'the portalled Guide modal must paint above the compact navigation panel'
Assert-Contains 'scss/easyedu/components/_guide.scss' $guideComponentStyles 'inline-size: min\(26rem, calc\(100vw - 2\.5rem\)\)' 'desktop checklist width must remain within the viewport'
Assert-Contains 'scss/easyedu/components/_guide.scss' $guideComponentStyles 'max-inline-size: calc\(100vw - 2\.5rem\)' 'desktop checklist must not escape its fixed container'
Assert-NotContains 'scss/easyedu/components/_navigation.scss' $navigationStyles 'transition: max-inline-size' 'guide capsule must not animate layout width'
Assert-NotContains 'course_manager.js' $courseManager 'bindHeaderNavigation|bindMobilePrimaryNavigation|data-easystud-mobile-nav-panel' 'consumer must not retain the removed DOM reconstruction'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit '\.dropdown-toggle' 'browser audit must verify the visible native combobox value'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit '(?s)data-easyedu-navigation-item-id="easystud-manager".*toHaveAttribute\(''aria-current''' 'browser audit must verify the current EasyStud destination'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'desktopNavigationGeometry' 'browser audit must compare destination and full-rail centres'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'destinationGeometryAfterLabel' 'browser audit must prove guide-label reveal does not move the destination centre'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'desktop navigation remains centred at' 'browser audit must preserve reusable desktop centring cases'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'assertResponsiveGuideLauncher' 'browser audit must verify compact guide row visibility and alignment'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'compact Guide launcher portals its modal above navigation' 'browser audit must prove portal stacking at the compact breakpoint'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'guideRootIsBodyChild' 'browser audit must prove the Guide root escapes the transformed drawer'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'modalAbovePanel' 'browser audit must prove the modal paints above the navigation drawer'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'dialogOwnsCentrePoint' 'browser audit must prove the dialog owns its visible centre point'
Assert-Contains 'Invoke-EasyStudPlaywrightWithSavedCredentials.ps1' $playwrightRunner 'playwright.config.js' 'supervised Playwright must resolve its versioned discovery configuration'
Assert-Contains 'Invoke-EasyStudPlaywrightWithSavedCredentials.ps1' $playwrightRunner '--config=' 'supervised discovery and execution must use the same Playwright configuration'
Assert-Contains 'Invoke-EasyStudPlaywrightWithSavedCredentials.ps1' $playwrightRunner 'groupimport-active-runtime-write' 'EasyStud runtime checks must use the GroupImport runtime lease by default'
Assert-Contains 'playwright.config.js' $playwrightConfig 'testDir: __dirname' 'Playwright discovery must resolve EasyStud specs from its own directory'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit 'outerEdgeRadius' 'browser audit must verify the Moodle-like left-edge trigger shape'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit '(?s)\{name:\s*''1280''.*\{name:\s*''1440''.*\{name:\s*''1920''' 'browser audit must cover the approved desktop width matrix'
Assert-Contains 'responsive-audit.spec.js' $responsiveAudit '\{name:\s*''rtl-1440''.*direction:\s*''rtl''\}' 'browser audit must cover logical RTL centring'
Assert-NotContains 'responsive-audit.spec.js' $responsiveAudit 'participantMenu\.locator\(''\[data-selected-option\]''\)' 'browser audit must not depend on Moodle''s optional inline-label branch'
Assert-NotContains 'responsive-audit.spec.js' $responsiveAudit 'participantMenu\.locator\(''\[role="option"\]\[aria-selected="true"\]''\)' 'browser audit must not claim that the EasyStud title is one of Moodle''s native participant options'

try {
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $diffCheck = & git -C $PluginRoot diff --check 2>&1
    $gitExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($gitExitCode -ne 0) {
        $failures.Add("git diff --check: $($diffCheck -join ' ')")
    }
} catch {
    $ErrorActionPreference = $savedErrorActionPreference
    $failures.Add("git diff --check: $($_.Exception.Message)")
}

if ($failures.Count) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'Navigation integration contract: PASS'
