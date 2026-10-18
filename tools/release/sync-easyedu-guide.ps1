param(
    [Parameter(Mandatory = $true)]
    [string]$CanonicalKitRoot,

    [string]$PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,

    [switch]$Apply,
    [switch]$GuideOnly
)

$ErrorActionPreference = "Stop"

$kitRoot = (Resolve-Path -LiteralPath $CanonicalKitRoot).Path
$pluginRootPath = (Resolve-Path -LiteralPath $PluginRoot).Path

function Read-NormalizedText {
    param([string]$Path)

    return (Get-Content -LiteralPath $Path -Raw -Encoding UTF8) -replace "`r`n", "`n"
}

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Resolve-OwnedPath {
    param(
        [string]$Root,
        [string]$RelativePath
    )

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $RelativePath))
    $rootPrefix = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    if (-not $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Resolved path escapes the owned root: $fullPath"
    }
    return $fullPath
}

$canonicalJavascriptPath = Resolve-OwnedPath $kitRoot "guide\amd\src\easyedu_guide.js"
$canonicalTemplatePath = Resolve-OwnedPath $kitRoot "guide\templates\easyedu_guide.mustache"
$canonicalStylesPath = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_guide.scss"

$canonicalJavascript = Read-NormalizedText $canonicalJavascriptPath
if ($canonicalJavascript.Contains('Motion.clickFeedback(')) {
    # A Guide-only copy must never silently introduce an unavailable Motion API.
    $motionFiles = @(
        (Resolve-OwnedPath $kitRoot 'motion\amd\src\easyedu_motion.js'),
        (Resolve-OwnedPath $pluginRootPath 'amd\src\motion.js')
    )
    foreach ($motionFile in $motionFiles) {
        if ((Read-NormalizedText $motionFile) -notmatch '(?m)^export const clickFeedback =') {
            throw 'Synchronize the shared Motion clickFeedback primitive before the Guide.'
        }
    }
}
$fullscreenPath = Resolve-OwnedPath $kitRoot "guide\amd\src\easyedu_guide_fullscreen.js"
$fullscreenSource = Read-NormalizedText $fullscreenPath
$fullscreenImport = "import {createFullscreenController} from './easyedu_guide_fullscreen';"
if (-not $canonicalJavascript.Contains($fullscreenImport) -or
    -not $fullscreenSource.Contains('export const createFullscreenController =')) {
    throw 'Review changed canonical Fullscreen module boundary before synchronization.'
}
foreach ($marker in @("export const destroy =", "export const init =", "export default init;")) {
    if (-not $canonicalJavascript.Contains($marker)) {
        throw "Canonical guide source is missing required marker: $marker"
    }
}

$wrappedBody = $canonicalJavascript.Replace("export const destroy =", "const destroy =")
$wrappedBody = $wrappedBody.Replace($fullscreenImport, '')
$bubblePath = Resolve-OwnedPath $kitRoot 'guide\amd\src\easyedu_bubble.js'
$bubbleSource = Read-NormalizedText $bubblePath
$bubbleImport = "import * as EasyeduBubble from './easyedu_bubble';"
if (-not $canonicalJavascript.Contains($bubbleImport) -or
    -not $bubbleSource.Contains('export const createBubbleController =') -or
    $bubbleSource -match '(?m)^import\s') {
    throw 'Review changed canonical shared bubble module boundary before synchronization.'
}
$wrappedBody = $wrappedBody.Replace($bubbleImport + "`n", '')
$recapMotionImport = "import {disclosePanel, cancel as cancelRecapPanel} from '../../../motion/amd/src/easyedu_motion';"
if (-not $canonicalJavascript.Contains($recapMotionImport)) {
    throw 'Review changed canonical recap Motion boundary before synchronization.'
}
$wrappedBody = $wrappedBody.Replace($recapMotionImport, '')
$wrappedBody = $wrappedBody.Replace("import * as Motion from '../../../motion/amd/src/easyedu_motion';", '')
$wrappedBody = "const disclosePanel = Motion.disclosePanel;`nconst cancelRecapPanel = Motion.cancel;`n" + $wrappedBody
$wrappedBody = $fullscreenSource.Replace('export const createFullscreenController =', 'const createFullscreenController =') + "`n" + $wrappedBody
$wrappedBody = $wrappedBody.Replace("export const init =", "const init =")
$wrappedBody = $wrappedBody.Replace("export default init;", "")
$wrappedBody = $wrappedBody.TrimEnd()

# EasyStud supplies translated labels through its PHP configuration. Retain its
# existing empty fallbacks rather than reintroducing English during each sync.
$labelKeys = 'close|next|previous|start|hint|complete|guidedPath|visited|completedSteps|completeStepFirst'
$defaultsEnd = $wrappedBody.IndexOf('const SELECTORS =')
if ($defaultsEnd -lt 0) { throw 'Guide defaults boundary missing.' }
$defaults = $wrappedBody.Substring(0, $defaultsEnd)
$labelPattern = "(?m)^(    (?:$labelKeys): )'[^\r\n]*'(,?)$"
if ([regex]::Matches($defaults, $labelPattern).Count -ne 10) {
    throw 'Review changed Guide default labels before localization adaptation.'
}
$defaults = [regex]::Replace($defaults, $labelPattern, { param($match)
    $match.Groups[1].Value + "''" + $match.Groups[2].Value
})
$wrappedBody = $defaults + $wrappedBody.Substring($defaultsEnd)
foreach ($contextExport in @('getPathContext', 'getPathContextToken', 'setPathContext', 'guideModality')) {
    $exportMarker = "export const $contextExport ="
    if (-not $wrappedBody.Contains($exportMarker)) {
        throw "Canonical context export missing: $contextExport"
    }
    $wrappedBody = $wrappedBody.Replace($exportMarker, "const $contextExport =")
}
if ($wrappedBody -match '(?m)^export ') {
    throw 'Review unadapted canonical exports before building Moodle AMD.'
}
$wrappedBody = $wrappedBody.Replace("config.labels.guidedPath || 'Guided path'", "config.labels.guidedPath || ''")
$wrappedBody = $wrappedBody.Replace("config.labels.visited || 'visited'", "config.labels.visited || ''")
$wrappedBody = $wrappedBody.Replace("config.labels.completedSteps || 'steps completed'", "config.labels.completedSteps || ''")

$runtimeJavascript = @"
// This file is generated from the embedded EasyEdu guide kit source and adapted to Moodle AMD.
// Keep behaviour aligned with easyedu-guide-kit/amd/src/easyedu_guide.js, then pass
// selectors, paths and labels from plugin-specific PHP/Mustache data.

define(['local_groupimport/motion', 'local_groupimport/easyedu_bubble'], function(Motion, EasyeduBubble) {
$wrappedBody

return {
  destroy: destroy,
  getPathContext: getPathContext,
  getPathContextToken: getPathContextToken,
  setPathContext: setPathContext,
  init: init,
  guideModality: guideModality
};
});
"@
$runtimeJavascript = ($runtimeJavascript -replace "`r`n", "`n").TrimEnd() + "`n"

# Runtime markup consumes the canonical template, with only the existing
# translated hover/completion labels retained. Checking just the embedded
# package cannot prove that Moodle's rendered template has been updated.
$runtimeTemplate = Read-NormalizedText $canonicalTemplatePath
$runtimeTemplate = [regex]::Replace($runtimeTemplate, '{{> (guide_\w+)}}', '{{> local_groupimport/$1}}')
$runtimeTemplate = $runtimeTemplate.Replace('{{displaypreferenceslabel}}', '{{#str}}displaypreferences, local_groupimport{{/str}}')
$runtimeTemplate = $runtimeTemplate.Replace(
    '<span class="easyedu-guide__launcher-label">{{guideopenlabel}}</span>',
    '<span class="easyedu-guide__launcher-label" aria-hidden="true">{{guidehoverlabel}}</span>')
$runtimeTemplate = $runtimeTemplate.Replace(
    '<span class="easyedu-guided-panel__message-compact" aria-hidden="true">Everything is set</span>',
    '<span class="easyedu-guided-panel__message-compact" aria-hidden="true">{{guidechecklistdonelabel}}</span>')
$runtimeTemplate = $runtimeTemplate.Replace('data-complete-message="Everything is set"', 'data-complete-message="{{guidechecklistdonelabel}}"')
$runtimeTemplate = $runtimeTemplate.Replace('<span data-easyedu-guide-checklist-message-text>Everything is set</span>', '<span data-easyedu-guide-checklist-message-text>{{guidechecklistdonelabel}}</span>')
if (-not $runtimeTemplate.Contains('{{guidehoverlabel}}') -or
    -not $runtimeTemplate.Contains('aria-hidden="true">{{guidechecklistdonelabel}}</span>')) {
    throw 'Canonical template changed: review the EasyStud localization adaptations.'
}

$items = @(
    [pscustomobject]@{
        Name = "embedded simple-create Mustache"
        Source = Resolve-OwnedPath $kitRoot "guide\templates\guide_simplecreate.mustache"
        Target = Resolve-OwnedPath $pluginRootPath "easyedu-guide-kit\templates\guide_simplecreate.mustache"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "guide\templates\guide_simplecreate.mustache")
    },
    [pscustomobject]@{
        Name = "runtime simple-create Mustache"
        Source = Resolve-OwnedPath $kitRoot "guide\templates\guide_simplecreate.mustache"
        Target = Resolve-OwnedPath $pluginRootPath "templates\guide_simplecreate.mustache"
        Expected = (Read-NormalizedText (Resolve-OwnedPath $kitRoot "guide\templates\guide_simplecreate.mustache")).Replace('@template guide_simplecreate', '@template local_groupimport/guide_simplecreate')
    },
    [pscustomobject]@{
        Name = "canonical Guide animation SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_animations.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_animations.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\components\_animations.scss")
    },
    [pscustomobject]@{
        Name = "canonical native confirmation controller"
        Source = Resolve-OwnedPath $kitRoot "guide\amd\src\easyedu_confirmation.js"
        Target = Resolve-OwnedPath $pluginRootPath "amd\src\easyedu_confirmation.js"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "guide\amd\src\easyedu_confirmation.js")
    },
    [pscustomobject]@{
        Name = "embedded native fullscreen lifecycle"
        Source = $fullscreenPath
        Target = Resolve-OwnedPath $pluginRootPath "easyedu-guide-kit\amd\src\easyedu_guide_fullscreen.js"
        Expected = $fullscreenSource
    },
    [pscustomobject]@{
        Name = "runtime localized Mustache"
        Source = $canonicalTemplatePath
        Target = Resolve-OwnedPath $pluginRootPath "templates\easyedu_guide.mustache"
        Expected = $runtimeTemplate
    },
    [pscustomobject]@{
        Name = "canonical dialog primitives SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_modals.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_modals.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\components\_modals.scss")
    },
    [pscustomobject]@{
        Name = "canonical dialog classes SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\_dialog-classes.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\_dialog-classes.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\_dialog-classes.scss")
    },
    [pscustomobject]@{
        Name = "canonical dialog palette SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\_dialog-palette-classes.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\_dialog-palette-classes.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\_dialog-palette-classes.scss")
    },
    [pscustomobject]@{
        Name = "canonical data classes SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\_data-classes.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\_data-classes.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\_data-classes.scss")
    },
    [pscustomobject]@{
        Name = "canonical action buttons SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_buttons.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_buttons.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\components\_buttons.scss")
    },
    [pscustomobject]@{
        Name = "runtime discovery SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_guide-discovery.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_guide-discovery.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\components\_guide-discovery.scss")
    },
    [pscustomobject]@{
        Name = "canonical inspection textarea SCSS"
        Source = Resolve-OwnedPath $kitRoot "scss\easyedu\components\_textareas.scss"
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_textareas.scss"
        Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot "scss\easyedu\components\_textareas.scss")
    },
    [pscustomobject]@{
        Name = "embedded JavaScript"
        Source = $canonicalJavascriptPath
        Target = Resolve-OwnedPath $pluginRootPath "easyedu-guide-kit\amd\src\easyedu_guide.js"
        Expected = $canonicalJavascript
    },
    [pscustomobject]@{
        Name = "embedded Mustache"
        Source = $canonicalTemplatePath
        Target = Resolve-OwnedPath $pluginRootPath "easyedu-guide-kit\templates\easyedu_guide.mustache"
        Expected = Read-NormalizedText $canonicalTemplatePath
    },
    [pscustomobject]@{
        Name = "runtime shared SCSS"
        Source = $canonicalStylesPath
        Target = Resolve-OwnedPath $pluginRootPath "scss\easyedu\components\_guide.scss"
        Expected = Read-NormalizedText $canonicalStylesPath
    },
    [pscustomobject]@{
        Name = "runtime AMD source"
        Source = $null
        Target = Resolve-OwnedPath $pluginRootPath "amd\src\easyedu_guide.js"
        Expected = $runtimeJavascript
    }
)

# E1-E4 partials are public Guide templates, adapted only at the Moodle namespace boundary.
# GMI-C3: the Mass Import demonstration scenes follow the same public partial boundary.
foreach ($partial in @('guide_specimen', 'guide_specimen_group', 'guide_specimen_grouping', 'guide_specimen_participant', 'guide_anatomy', 'guide_mass_import_scene')) {
    $canonicalPartial = Resolve-OwnedPath $kitRoot ("guide\templates\" + $partial + '.mustache')
    $partialText = Read-NormalizedText $canonicalPartial
    $items += [pscustomobject]@{
        Name = "embedded $partial Mustache"
        Source = $canonicalPartial
        Target = Resolve-OwnedPath $pluginRootPath ("easyedu-guide-kit\templates\" + $partial + '.mustache')
        Expected = $partialText
    }
    $items += [pscustomobject]@{
        Name = "runtime $partial Mustache"
        Source = $canonicalPartial
        Target = Resolve-OwnedPath $pluginRootPath ("templates\" + $partial + '.mustache')
        Expected = [regex]::Replace($partialText.Replace('@template ' + $partial, '@template local_groupimport/' + $partial), '{{> (guide_\w+)}}', '{{> local_groupimport/$1}}')
    }
}
$items += [pscustomobject]@{
    Name = 'canonical specimen SCSS'
    Source = Resolve-OwnedPath $kitRoot 'scss\easyedu\components\_guide-specimen.scss'
    Target = Resolve-OwnedPath $pluginRootPath 'scss\easyedu\components\_guide-specimen.scss'
    Expected = Read-NormalizedText (Resolve-OwnedPath $kitRoot 'scss\easyedu\components\_guide-specimen.scss')
}

# The one shared bubble is import-free; Motion is injected by its callers.
foreach ($target in @('easyedu-guide-kit\amd\src\easyedu_bubble.js', 'amd\src\easyedu_bubble.js')) {
    $items += [pscustomobject]@{
        Name = "shared bubble $target"
        Source = $bubblePath
        Target = Resolve-OwnedPath $pluginRootPath $target
        Expected = $bubbleSource
    }
}
# Accepted PEN-K17 recipes also depend on the common tokens, overflow and responsive defaults.
foreach ($relative in @('scss\easyedu\_tokens.scss', 'scss\easyedu\components\_card-actions.scss', 'scss\easyedu\components\_responsive.scss')) {
    $canonicalShared = Resolve-OwnedPath $kitRoot $relative
    $items += [pscustomobject]@{
        Name = "PEN-K17 shared $relative"
        Source = $canonicalShared
        Target = Resolve-OwnedPath $pluginRootPath $relative
        Expected = Read-NormalizedText $canonicalShared
    }
}

$drift = New-Object System.Collections.Generic.List[object]
if ($GuideOnly) {
    # A Guide delivery must not adopt unrelated dialog changes from the Kit.
    $items = @($items | Where-Object { $_.Name -notin @('canonical dialog primitives SCSS', 'canonical dialog classes SCSS') })
}
foreach ($item in $items) {
    if (-not (Test-Path -LiteralPath $item.Target)) {
        throw "Required EasyStud target is missing: $($item.Target)"
    }
    $actual = Read-NormalizedText $item.Target
    if ($actual -cne $item.Expected) {
        $drift.Add($item) | Out-Null
        Write-Host "[DRIFT] $($item.Name): $($item.Target)"
    } else {
        Write-Host "[ALIGNED] $($item.Name): $($item.Target)"
    }
}

if (-not $Apply) {
    if ($drift.Count -gt 0) {
        throw "EasyStud guide synchronization check found $($drift.Count) drifted source file(s)."
    }
    Write-Host "EasyStud guide sources match the canonical UI Kit."
    return
}

foreach ($item in $drift) {
    Write-Utf8NoBom $item.Target ($item.Expected.TrimEnd() + "`n")
    Write-Host "[SYNCED] $($item.Name): $($item.Target)"
}

Write-Host "EasyStud guide source synchronization completed."
