[CmdletBinding()]
param(
    [string]$PluginRoot = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($PluginRoot)) {
    $PluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

function Read-RequiredFile {
    param([Parameter(Mandatory)][string]$RelativePath)

    $path = Join-Path $PluginRoot $RelativePath
    if (!(Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing Navigation/Guide contract file: $RelativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-ContainsLiteral {
    param(
        [Parameter(Mandatory)][string]$Content,
        [Parameter(Mandatory)][string]$Expected,
        [Parameter(Mandatory)][string]$Message
    )

    if (!$Content.Contains($Expected)) {
        throw $Message
    }
}

$tokens = Read-RequiredFile 'scss\easyedu\_tokens.scss'
$navigation = Read-RequiredFile 'scss\easyedu\components\_navigation.scss'
$guide = Read-RequiredFile 'scss\easyedu\components\_guide.scss'
$template = Read-RequiredFile 'templates\easyedu_navigation.mustache'
$documentation = Read-RequiredFile 'docs\navigation.md'
$componentContract = Read-RequiredFile 'easyedu-kit-docs\ai\COMPONENT_CONTRACT.md'
$generatedStyles = Read-RequiredFile 'styles.css'

foreach ($token in @(
    '--easyedu-navigation-drawer-surface',
    '--easyedu-navigation-drawer-border',
    '--easyedu-navigation-drawer-shadow',
    '--easyedu-guide-launcher-resting-surface',
    '--easyedu-guide-launcher-resting-border'
)) {
    Assert-ContainsLiteral $tokens $token "Missing public surface token '$token'."
    Assert-ContainsLiteral $generatedStyles $token "Generated CSS is missing public surface token '$token'."
}

foreach ($contract in @(
    '@use "typography"',
    '.easyedu-navigation__panel-scroll',
    'block-size: 100dvh',
    'overflow-y: auto',
    'overscroll-behavior: contain',
    'env(safe-area-inset-top)',
    'font-family: var(--easyedu-font-family-ui)',
    'font-weight: var(--easyedu-font-weight-medium)',
    '@include typography.type-section-title',
    '@include typography.type-eyebrow'
)) {
    Assert-ContainsLiteral $navigation $contract "Navigation surface is missing '$contract'."
}

foreach ($contract in @(
    'align-items: center',
    'background: transparent',
    'border: 0',
    'padding: 0',
    '@include focus.ring'
)) {
    Assert-ContainsLiteral $guide $contract "Guide launcher surface is missing '$contract'."
}

foreach ($contract in @(
    '.easyedu-navigation__guide-slot:not(:empty)',
    'margin-block-end: 1rem',
    'border: 0.0625rem solid var(--easyedu-guide-launcher-resting-border)',
    '@include buttons.close-button'
)) {
    Assert-ContainsLiteral $navigation $contract "Responsive Guide/Close composition is missing '$contract'."
}

foreach ($contract in @(
    'class="easyedu-navigation__panel-scroll"',
    'data-easyedu-navigation-panel-scroll="1"',
    'data-easyedu-navigation-guide-slot="1"',
    'data-easyedu-navigation-participant-links="1"'
)) {
    Assert-ContainsLiteral $template $contract "Navigation template is missing '$contract'."
}

Assert-ContainsLiteral $documentation 'EED-KIT-2026-0006' 'Consumer documentation does not identify the Kit source batch.'
Assert-ContainsLiteral $componentContract 'Navigation and Guide surfaces (`EED-KIT-2026-0006`)' 'AI contract is missing the surface adoption boundary.'
Assert-ContainsLiteral $generatedStyles '.local-groupimport-easystud__navigation .easyedu-navigation__panel-scroll' 'Generated CSS is missing drawer scroll-body output.'

Write-Host 'EasyStud Navigation/Guide surface contract checks passed.' -ForegroundColor Green
