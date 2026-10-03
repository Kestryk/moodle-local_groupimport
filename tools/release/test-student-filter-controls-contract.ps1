param(
    [string] $PluginRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [Parameter(Mandatory = $true)]
    [string] $KitRoot
)

$template = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot 'templates/manage.mustache')
$structure = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot 'scss/components/_structure.scss')
$styles = Get-Content -Raw -LiteralPath (Join-Path $PluginRoot 'styles.css')
$kitManifest = Get-Content -Raw -LiteralPath (Join-Path $KitRoot 'easyedu-kit.json') | ConvertFrom-Json

if ($kitManifest.version -ne '0.4.73') {
    throw "Expected Kit 0.4.73, found $($kitManifest.version)."
}

foreach ($className in @('easyedu-filter-disclosure', 'easyedu-toggle-check', 'easyedu-filter-reset')) {
    if (-not $template.Contains($className)) {
        throw "Missing public Kit class in Student Management template: $className"
    }
    if (-not ($styles.Contains('.easyedu-ui .' + $className) -or
            $styles.Contains('.easyedu-ui :where(.' + $className + ')'))) {
        throw "Missing generated public Kit class: $className"
    }
}

$toggleLayout = [regex]::Match(
    $structure,
    '(?s)&-group-catalog-filters &-toggle-check \{(?<body>.*?)\r?\n  \}'
).Groups['body'].Value
if (-not $toggleLayout -or $toggleLayout -match '(background|border-radius|box-shadow|input:checked|span::before)') {
    throw 'Consumer SCSS still redraws the shared toggle-check component.'
}

if ($structure -notmatch 'grid-template-columns: minmax\(0, 1fr\) auto' -or
        $structure -notmatch '(?s)&-group-catalog-filters > &__filter-group \{.*?grid-column: 1 / -1;.*?grid-row: 1;' -or
        $structure -notmatch '(?s)&-group-catalog-filters &-toggle-check \{.*?grid-column: 1;.*?grid-row: 2;' -or
        $structure -notmatch '(?s)&-group-catalog-filters &__filters-reset--catalog \{.*?grid-column: 2;.*?grid-row: 2;') {
    throw 'Catalog More Filters layout does not keep the full-width choice above the Toggle/Reset action row.'
}

Write-Host 'PASS: Student More Filters consume canonical disclosure/toggle/reset roles with the intended action-row layout.'
