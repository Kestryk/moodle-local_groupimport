param(
    [Parameter(Mandatory = $true)][string]$KitRoot,
    [string]$BaselineCssPath
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$module = 'scss/easyedu/components/_identity-card-surfaces.scss'
$embedded = & git -C $root hash-object $module
$canonical = & git -C $KitRoot hash-object $module
if ($LASTEXITCODE -ne 0 -or $embedded -ne $canonical) { throw 'Identity surface Kit drift.' }
$participants = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_participants.scss')
$structure = Get-Content -Raw -LiteralPath (Join-Path $root 'scss/components/_structure.scss')
foreach ($needle in @('identity-card-paint(person)', 'identity-card-paint(person, hover)',
    'identity-card-paint(person, selected)')) {
    if (-not $participants.Contains($needle)) { throw "Missing canonical person treatment: $needle" }
}
foreach ($needle in @('identity-card-paint(object)', 'identity-card-paint(object, hover)',
    'identity-card-paint(object, selected)', 'identity-card-paint(container)',
    'identity-card-paint(container, expanded)', 'identity-card-paint(container, selected)',
    'identity-card-paint(container, expanded-selected)', 'identity-card-paint(unassigned)',
    'identity-card-paint(unassigned, expanded)')) {
    if (-not $structure.Contains($needle)) { throw "Missing canonical object treatment: $needle" }
}
# Optional extraction baseline: compare all emitted leaf selector/property value
# sequences, ignoring only independent declaration order. Repeated property
# values stay ordered, so a fallback/cascade change cannot disappear.
function Get-CssContract([string]$Css) {
    $result = @{}
    $withoutComments = [regex]::Replace($Css, '(?s)/\*.*?\*/', '')
    foreach ($block in [regex]::Matches($withoutComments, '(?ms)([^{}]+)\{([^{}]*)\}')) {
        $selector = [regex]::Replace($block.Groups[1].Value.Trim(), '\s+', ' ')
        foreach ($item in [regex]::Matches($block.Groups[2].Value, '(?m)^\s*([\w-]+):\s*([^;]+);')) {
            $key = "$selector | $($item.Groups[1].Value)"
            $value = $item.Groups[2].Value.Trim()
            if ($result.ContainsKey($key)) { $result[$key] += "`n$value" }
            else { $result[$key] = $value }
        }
    }
    return $result
}
if ($BaselineCssPath) {
    $before = Get-CssContract (Get-Content -Raw -LiteralPath $BaselineCssPath)
    $after = Get-CssContract (Get-Content -Raw -LiteralPath (Join-Path $root 'styles.css'))
    $differences = @(@($before.Keys) + @($after.Keys) | Sort-Object -Unique | Where-Object {
        $before[$_] -cne $after[$_]
    })
    if ($differences.Count -ne 0) { throw "Extraction CSS drift ($($differences.Count)): $($differences | Select-Object -First 5)" }
    Write-Output "PASS: $($before.Count) emitted selector/property sequences preserved against the extraction baseline."
}
Write-Output 'PASS: twelve canonical identity-card paint states consumed; layout, predicates, focus and Motion remain consumer-owned. Source/compiled proof, not fresh browser paint.'
