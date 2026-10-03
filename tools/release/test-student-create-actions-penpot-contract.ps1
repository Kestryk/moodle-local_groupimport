$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ledger = Get-Content -Raw -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') | ConvertFrom-Json
$pin = $ledger.consumerSync.studentCompletion20261003
$foundations = Get-Content -Raw -LiteralPath (Join-Path $root $pin.createFoundationReadback) | ConvertFrom-Json
$products = Get-Content -Raw -LiteralPath (Join-Path $root $pin.createProductReadback) | ConvertFrom-Json
if ($foundations.components.Count -ne 16 -or $products.actions.Count -ne 12) {
    throw 'Create catalogue/product coverage incomplete.'
}
foreach ($component in $foundations.components) {
    $expectedHeight = if ($component.density -eq 'Narrow') { 42.4 } else { 38 }
    foreach ($shape in @($component.library, $component.standard)) {
        if ($shape.rootFills.Count -ne 0 -or -not $shape.centered -or -not $shape.proportional -or
            [math]::Abs($shape.w - 38) -gt .01 -or [math]::Abs($shape.h - $expectedHeight) -gt .01) {
            throw 'Workspace Create root/density/paint drift.'
        }
        foreach ($paint in $shape.paint) {
            if ([math]::Abs($paint.w - 16) -gt .01 -or [math]::Abs($paint.h - 16) -gt .01) {
                throw 'Create Plus is not proportional 16px paint.'
            }
        }
    }
}
foreach ($action in $products.actions) {
    if ($action.provider -notin $foundations.components.component -or
        [math]::Abs($action.fieldCenterDelta) -gt .01 -or [math]::Abs($action.gap - 8) -gt .01 -or
        [math]::Abs($action.height - $action.fieldHeight) -gt .01) {
        throw 'Create action provider/field alignment drift.'
    }
    foreach ($paint in $action.paths) {
        if ([math]::Abs($paint.width - 16) -gt .01 -or [math]::Abs($paint.height - 16) -gt .01 -or
            [math]::Abs($paint.centerX) -gt .01 -or [math]::Abs($paint.centerY) -gt .01) {
            throw 'Product Create Plus paint is not centred.'
        }
    }
}
Write-Output 'PASS: sixteen paired Workspace Create states and twelve inherited product controls; readback proof only.'
