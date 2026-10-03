param([Parameter(Mandatory = $true)][string]$KitRoot,
    [Parameter(Mandatory = $true)][string]$BaselineCssPath)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$baseline = 'efbad079a4f9595fd15db6153e7bca5a62b05781'
$manifest = Get-Content -Raw (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $manifest.consumerSync.studentSelectionActions20261003
if (!$pin -or $pin.consumerBehaviorBaseline -ne $baseline -or $pin.humanAccepted -or $pin.nativeTransferVerified) {
    throw 'Missing explicit successor baseline or proof boundary.'
}
foreach ($entry in $pin.modules.PSObject.Properties) {
    if ((& git -C $root hash-object $entry.Name) -ne $entry.Value) { throw "Selection-action asset drift: $($entry.Name)" }
}
foreach ($file in @('scss/easyedu/components/_buttons.scss', 'scss/easyedu/_foundation-classes.scss')) {
    if ((& git -C $root hash-object $file) -ne (& git -C $KitRoot hash-object $file)) {
        throw "Canonical recipe differs: $file"
    }
}
$controller = (Get-Content -Raw (Join-Path $root 'amd/src/course_manager.js')).Replace("`r`n", "`n").TrimEnd()
$oldController = ((& git -C $root show "${baseline}:amd/src/course_manager.js") -join "`n").TrimEnd()
$controller = $controller.Replace("    clone.classList.remove('foundation-selection-action');`n", '')
$newClasses = "        button.className = 'btn btn-sm foundation-selection-action foundation-selection-action--tray ' +`n" +
    "            (isdanger ? 'btn-outline-danger' : (isprimary ? 'btn-primary' : 'btn-outline-secondary'));"
$oldClasses = "        button.className = 'btn btn-sm ' + (isdanger ? 'btn-outline-danger' : (isprimary ? 'btn-primary' : 'btn-outline-secondary'));"
if (!$controller.Contains($newClasses)) { throw 'Expected class-only tray adapter missing.' }
if ($controller.Replace($newClasses, $oldClasses) -cne $oldController) { throw 'Business/controller/Motion drift.' }
$template = (Get-Content -Raw (Join-Path $root 'templates/manage.mustache')).Replace("`r`n", "`n").TrimEnd()
$oldTemplate = ((& git -C $root show "${baseline}:templates/manage.mustache") -join "`n").TrimEnd()
if ([regex]::Matches($template, 'class="\{\{class\}\} foundation-selection-action"').Count -ne 2 -or
    $template.Replace('class="{{class}} foundation-selection-action"', 'class="{{class}}"') -cne $oldTemplate) {
    throw 'Mustache change exceeds the two public-class additions.'
}
foreach ($file in @('ajax.php','classes/service/membership_transfer.php','amd/src/motion.js')) {
    if ((& git -C $root hash-object $file) -ne (& git -C $root rev-parse "${baseline}:$file")) {
        throw "Business API/Motion drift: $file"
    }
}
function Get-CssContract([string]$Css) {
    $result = @{}
    # Git snapshots may use CRLF while Dart Sass emits LF. Normalize only line
    # endings; retain declaration values and their order for the paint gate.
    $Css = $Css.Replace("`r`n", "`n")
    $withoutComments = [regex]::Replace($Css, '(?s)/\*.*?\*/', '')
    foreach ($block in [regex]::Matches($withoutComments, '(?ms)([^{}]+)\{([^{}]*)\}')) {
        $selector = [regex]::Replace($block.Groups[1].Value.Trim(), '\s+', ' ')
        foreach ($item in [regex]::Matches($block.Groups[2].Value, '(?m)^\s*([\w-]+):\s*([^;]+);')) {
            $key = "$selector | $($item.Groups[1].Value)"
            $value = $item.Groups[2].Value.Trim()
            if ($result.ContainsKey($key)) { $result[$key] += "`n$value" } else { $result[$key] = $value }
        }
    }
    return $result
}
if ((& git -C $root hash-object $BaselineCssPath) -ne (& git -C $root rev-parse "${baseline}:styles.css")) {
    throw 'Wrong immutable CSS baseline.'
}
$before = Get-CssContract (Get-Content -Raw -LiteralPath $BaselineCssPath)
$after = Get-CssContract (Get-Content -Raw (Join-Path $root 'styles.css'))
$changes = @(@($before.Keys) + @($after.Keys) | Sort-Object -Unique | Where-Object { $before[$_] -cne $after[$_] })
$unexpected = @($changes | Where-Object {
    $_ -notmatch 'foundation-selection-action|local-groupimport-easystud__panel-actions \.btn|local-groupimport-easystud-mobile-actions__buttons \.btn'
})
if ($unexpected.Count) { throw "Unrelated compiled CSS drift: $($unexpected | Select-Object -First 4)" }
if (!$changes.Count) { throw 'Expected opt-in action paint missing.' }
Write-Output "PASS: canonical recipes, class-only DOM adapters, unchanged commands/API/Motion; $($changes.Count) scoped CSS sequences."
