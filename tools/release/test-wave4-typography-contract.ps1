[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$helpSource = Get-Content (Join-Path $root 'amd\src\course_manager.js') -Raw
$modalSource = Get-Content (Join-Path $root 'scss\components\_settings-modal.scss') -Raw
$identitySource = Get-Content (Join-Path $root 'scss\components\_typography-identity.scss') -Raw
$css = Get-Content (Join-Path $root 'styles.css') -Raw
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains {
    param([string]$Contents, [string]$Needle, [string]$Message)
    if ($Contents -notmatch [regex]::Escape($Needle)) {
        $failures.Add($Message)
    }
}

Assert-Contains $helpSource 'class="btn p-0 icon-no-margin ' 'Group/Grouping help controls must not use Bootstrap btn-link.'
Assert-Contains $modalSource 'text-decoration: none !important;' 'Help controls must explicitly suppress theme link underlines.'
Assert-Contains $modalSource 'text-decoration-line: none !important;' 'Help controls must suppress underline decoration lines.'
Assert-Contains $modalSource 'easyedu.ring($border-color: var(--easyedu-control-focus-border))' 'Help controls must retain a visible keyboard focus ring.'
Assert-Contains $modalSource 'min-height: 1.45rem;' 'Group/Grouping count pills must match Participant density.'
Assert-Contains $modalSource 'gap: 0.7rem;' 'Group/Grouping count pills must have a clear title gap.'
Assert-Contains $modalSource 'font-size: 0.78rem;' 'Group/Grouping count pills must use the Participant-sized compact label.'
Assert-Contains $identitySource '.formsettingheading .form-description,' 'Administration descriptions must be explicitly mapped.'
Assert-Contains $identitySource '@include easyedu.type-caption;' 'Administration operational descriptions must use the compact paragraph role.'
Assert-Contains $css '.local-groupimport-easystud-settings-modal__help' 'Generated CSS must include the contextual help control.'
Assert-Contains $css 'text-decoration-line: none !important;' 'Generated CSS must preserve no-underline help controls.'
Assert-Contains $css 'min-height: 1.45rem;' 'Generated CSS must include the compact count pill height.'

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'EasyStud wave 4 typography contract passed.' -ForegroundColor Green
