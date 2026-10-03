$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss')
$styles = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'styles.css')
$tokens = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\easyedu\_tokens.scss')

if ($structure -notmatch '(?s)&-tree__section--ungrouped \{.*?--local-groupimport-easystud-ungrouped: #79506f;.*?identity-rail\(var\(--easyedu-icon-grouping\)\).*?&\.is-expanded:focus-within \{.*?card-focus-context' -or
        $structure -notmatch '(?s)&-tree__section--ungrouped > &-tree__toggle \{.*?card-title\(container, var\(--easyedu-card-identity-title-color\)\)' -or
        $structure -notmatch '(?s)\[data-easystud-grouping-id\]\.is-expanded:focus-within.*?card-focus-context\(\s*0 0\.42rem 0\.9rem -0\.28rem rgba\(106, 127, 152, 0\.18\)\s*\)') {
    throw 'Missing Complete-view ungrouped identity or expanded-card focus contract in source SCSS.'
}

if ($structure.Contains('--local-groupimport-easystud-icon-ungrouped') -or
        $tokens -notmatch '--easyedu-icon-grouping:\s*url\(') {
    throw 'Ungrouped must use the defined canonical grouping icon, not a missing local alias.'
}

$icon = [regex]::Match($styles,
    '(?s)\.local-groupimport-easystud-tree__section--ungrouped::before \{([^}]*)\}').Groups[1].Value
foreach ($rule in @('mask-image: var(--easyedu-icon-grouping);', 'mask-position: center;',
        'mask-size: contain;', 'top: 50%;', 'transform: translate(-50%, -50%);')) {
    if (-not $icon.Contains($rule)) { throw "Missing generated canonical icon/centre contract: $rule" }
}

if ($styles -notmatch '(?s)\.local-groupimport-easystud-tree__section--ungrouped \{.*?--local-groupimport-easystud-ungrouped: #79506f;.*?border-left-color: var\(--local-groupimport-easystud-ungrouped-rail\);' -or
        $styles -notmatch '(?s)\.local-groupimport-easystud-tree__section--ungrouped\.is-expanded:focus-within \{.*?box-shadow: inset 0 var\(--easyedu-focus-ring-width\) 0 var\(--easyedu-focus-ring\)') {
    throw 'Missing generated Complete-view ungrouped identity or inner focus rail contract.'
}

Write-Output 'PASS: defined canonical Ungrouped mask/centre, shared title role and contained expanded focus. Source/generated proof, not browser paint.'
