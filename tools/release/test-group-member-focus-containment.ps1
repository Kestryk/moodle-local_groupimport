[CmdletBinding()]
param(
    [string]$PluginRoot = ''
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($PluginRoot)) {
    $PluginRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

$requiredFiles = @{
    'amd/src/course_manager.js' = @(
        'const syncCollapsedMemberFocus',
        "member\.toggleAttribute\('inert', collapsed\)",
        'data-easystud-member-collapsed-tabindex',
        "control\.setAttribute\('tabindex', '-1'\)",
        "control\.removeAttribute\('tabindex'\)",
        'member\.contains\(document\.activeElement\)',
        'toggle\.focus\(\{preventScroll: true\}\)',
        'syncCollapsedMemberFocus\(member, collapsedmembers\.includes\(member\)\)',
        'list\.classList\.add\(''is-easyedu-disclosing''\)',
        'data-easystud-members-motion-token',
        'Motion\.resize\(list'
    )
    'amd/build/course_manager.min.js' = @(
        'local_groupimport/course_manager',
        'data-easystud-member-collapsed-tabindex',
        'toggleAttribute\("inert",collapsed\)'
    )
    'tools/playwright/member-list-focus-containment.spec.js' = @(
        'collapsed nested group members stay out of keyboard focus and restore on open',
        'data-easystud-grouping-id',
        'Tab must bypass clipped member actions',
        'is-easyedu-disclosing',
        'collapsed-nested-group-member-focus\.png'
    )
}

$failures = [System.Collections.Generic.List[string]]::new()
foreach ($entry in $requiredFiles.GetEnumerator()) {
    $path = Join-Path $PluginRoot $entry.Key
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("$($entry.Key): missing required file")
        continue
    }
    $content = Get-Content -LiteralPath $path -Raw
    foreach ($pattern in $entry.Value) {
        if ($content -notmatch $pattern) {
            $failures.Add("$($entry.Key): missing contract $pattern")
        }
    }
}

if ($failures.Count) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'Group member focus containment static contract passed.'
