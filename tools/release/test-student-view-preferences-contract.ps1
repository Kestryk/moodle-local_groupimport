$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$lib = Get-Content -Raw -LiteralPath (Join-Path $root 'lib.php')
$settings = Get-Content -Raw -LiteralPath (Join-Path $root 'settings.php')
$manage = Get-Content -Raw -LiteralPath (Join-Path $root 'manage.php')
$template = Get-Content -Raw -LiteralPath (Join-Path $root 'templates/manage.mustache')
$controller = Get-Content -Raw -LiteralPath (Join-Path $root 'amd/src/course_manager.js')

foreach ($setting in @('local_groupimport/showcompleteview', 'local_groupimport/defaultlayoutmode')) {
    if (-not $settings.Contains($setting)) {
        throw "Missing administrator setting: $setting"
    }
}

foreach ($needle in @(
    'function local_groupimport_get_workspace_layout_preferences(): array',
    "'showcompleteview' => `$showcompleteview",
    "'defaultlayoutmode' => `$defaultlayoutmode",
    "'defaultmobileview' => `$defaultlayoutmode === 'structure' ? 'groups' : 'participants'"
)) {
    if (-not $lib.Contains($needle)) {
        throw "Missing normalized workspace preference contract: $needle"
    }
}

if (-not $manage.Contains("unset(`$layoutmodedefinitions['both'])")) {
    throw 'Complete view is not removed when the administrator disables it.'
}
if (-not $manage.Contains("'layoutmodetoggles' => `$layoutmodetoggles")) {
    throw 'Template data does not use the availability-aware view controls.'
}

foreach ($attribute in @(
    'data-easystud-default-layout-mode="{{defaultlayoutmode}}"',
    'data-easystud-default-mobile-view="{{defaultmobileview}}"',
    '{{#showcompleteview}}'
)) {
    if (-not $template.Contains($attribute)) {
        throw "Missing workspace template contract: $attribute"
    }
}

if ($controller.Contains("applyMode('both', false);")) {
    throw 'Desktop workspace initialization is still hard-coded to Complete view.'
}
foreach ($needle in @('data-easystud-default-layout-mode', 'data-easystud-default-mobile-view', 'applyMode(initialMode, false)')) {
    if (-not $controller.Contains($needle)) {
        throw "Missing preference-aware controller behavior: $needle"
    }
}

Write-Output 'PASS: administrator availability/default settings, safe server fallback and desktop/mobile initialization are wired.'
