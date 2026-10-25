[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$pluginRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Assert-Contains {
    param(
        [string]$Label,
        [string]$Content,
        [string]$Expected
    )

    if (-not $Content.Contains($Expected)) {
        throw "$Label must contain: $Expected"
    }
}

$structure = Get-Content -LiteralPath (Join-Path $pluginRoot 'scss\components\_structure.scss') -Raw
$scenario = Get-Content -LiteralPath (Join-Path $pluginRoot 'tools\playwright\group-expanded-menu-stack.spec.js') -Raw
$documentation = Get-Content -LiteralPath (Join-Path $pluginRoot 'docs\nested-group-card-action-count-containment.md') -Raw

Assert-Contains 'Expanded Group source' $structure '&-group:has(> &-group__members.is-expanded):not(.is-actions-menu-open)'
Assert-Contains 'Expanded Group source' $structure 'z-index: 12;'
Assert-Contains 'Focused scenario' $scenario 'expanded Group More-actions menu stays above revealed participant members'
Assert-Contains 'Focused scenario' $scenario '[data-easystud-group-members-toggle]:visible'
Assert-Contains 'Focused scenario' $scenario '[data-easystud-group-actions-menu]:not([hidden])'
Assert-Contains 'Focused scenario' $scenario "toBe('35')"
Assert-Contains 'Focused scenario' $scenario "keyboard.press('Escape')"
Assert-Contains 'Documentation' $documentation 'EED-UI-2026-0028-B expanded-menu stacking'

Write-Host 'Expanded Group menu stack source contract passed.'
