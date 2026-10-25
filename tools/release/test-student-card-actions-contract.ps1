param([Parameter(Mandatory = $true)][string]$KitRoot, [string]$BaselineCss)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/components/_card-actions.scss'
$local = Get-Content -Raw -LiteralPath (Join-Path $root $module)
$canonical = Get-Content -Raw -LiteralPath (Join-Path $KitRoot $module)
if ($local.Replace("`r`n", "`n") -cne $canonical.Replace("`r`n", "`n")) {
    throw 'Card action source differs from the canonical Kit.'
}
$css = Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css')
$names = @('user__detail-button', 'group__mail-button', 'group__duplicate-button',
    'group__member-search-button', 'group__settings-button', 'container-search__toggle',
    'rename__toggle', 'group__unlink-button')
foreach ($name in $names) {
    $selector = '.local-groupimport-easystud-' + $name
    $rule = ''
    foreach ($match in [regex]::Matches($css, '([^{}]+)\{([^{}]+)\}')) {
        $selectors = @($match.Groups[1].Value.Split(',') | ForEach-Object { $_.Trim() })
        if ($selectors -contains $selector) { $rule += $match.Groups[2].Value }
    }
    foreach ($declaration in @('border: 1px solid transparent;', 'height: 1.85rem;',
        'width: 1.85rem;', 'font-size: 0.95rem;', 'color: var(--easyedu-primary);')) {
        if (-not $rule.Contains($declaration)) { throw "${name}: missing $declaration" }
    }
    foreach ($state in @(':hover', ':focus-visible', ':active', '[aria-disabled=true]')) {
        if (-not $css.Contains($selector + $state)) { throw "${name}: missing $state" }
    }
}
foreach ($paint in @('#f7fbff', '#bdd0e5', '#eaf4ff', '#b8d5ef', '#f0f4f8', '#d7e1ea', '#9aa9b8')) {
    if (-not $local.Contains($paint)) { throw "Missing measured Foundations paint $paint" }
}
if ($local -match 'transition:|animation:|transform:') {
    throw 'This migration must not alter existing motion.'
}
if ($BaselineCss) {
    $baseline = Get-Content -Raw -LiteralPath $BaselineCss
    # Remove only flat rules containing an explicitly migrated action selector.
    # All other CSS, including media wrappers and disclosure motion, must match.
    $actionPattern = 'local-groupimport-easystud-(?:' + ($names -join '|') + ')(?![\w-])'
    function Without-ActionRules([string]$Content) {
        [regex]::Replace($Content.Replace("`r`n", "`n"), '[^{}]+\{[^{}]*\}', {
            param($Match)
            $selector = $Match.Value.Split('{')[0]
            if ($selector -match $actionPattern) { return '' }
            return $Match.Value
        }).Trim()
    }
    if ((Without-ActionRules $css) -cne (Without-ActionRules $baseline)) {
        throw 'CSS outside the migrated action families changed.'
    }
}
Write-Output 'PASS: migrated action families, measured states, canonical parity and bounded CSS scope.'
