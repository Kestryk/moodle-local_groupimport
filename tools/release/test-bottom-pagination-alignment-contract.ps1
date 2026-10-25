$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$structure = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss')
$styles = Get-Content -Raw -LiteralPath (Join-Path $pluginRoot 'styles.css')

if ($structure -notmatch '(?s)&--structure-focus &-tree \{.*?align-items: stretch;.*?grid-template-rows: minmax\(0, 1fr\);' -or
        $structure -notmatch '(?s)&--structure-focus &-tree__groupings \{.*?align-self: stretch;' -or
        $structure -notmatch '(?s)&-tree__groupings\.is-easystud-paginated > &-pagination--bottom \{.*?margin-top: auto;') {
    throw 'Missing bottom-pagination source geometry contract.'
}

if ($styles -notmatch '(?s)\.local-groupimport-easystud--structure-focus \.local-groupimport-easystud-tree \{.*?align-items: stretch;.*?grid-template-rows: minmax\(0, 1fr\);' -or
        $styles -notmatch '(?s)\.local-groupimport-easystud--structure-focus \.local-groupimport-easystud-tree__groupings \{.*?align-self: stretch;' -or
        $styles -notmatch '(?s)\.local-groupimport-easystud-tree__groupings\.is-easystud-paginated > \.local-groupimport-easystud-pagination--bottom \{.*?margin-top: auto;') {
    throw 'Missing generated bottom-pagination geometry contract.'
}

Write-Output 'EasyStud bottom-pagination alignment contract passed.'
