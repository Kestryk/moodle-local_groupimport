[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-RequiredFile([string]$relativePath) {
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing Wave 10 contract file: $relativePath"
    }
    return Get-Content -LiteralPath $path -Raw
}

function Assert-Contains([string]$label, [string]$text, [string]$fragment) {
    if (-not $text.Contains($fragment)) {
        throw "$label is missing required contract fragment: $fragment"
    }
}

$settings = Read-RequiredFile 'settings.php'
$manage = Read-RequiredFile 'templates\manage.mustache'
$layout = Read-RequiredFile 'scss\components\_layout.scss'
$adminstyles = Read-RequiredFile 'scss\views\_admin-settings.scss'
$typography = Read-RequiredFile 'scss\components\_typography-identity.scss'
$generatedstyles = Read-RequiredFile 'styles.css'
$english = Read-RequiredFile 'lang\en\local_groupimport.php'
$french = Read-RequiredFile 'lang\fr\local_groupimport.php'

Assert-Contains 'Administration identity markup' $settings "'data-easystud-page-identity' => 'administration'"
Assert-Contains 'Administration identity heading' $settings "'local_groupimport/pageidentity'"
Assert-Contains 'Administration exact Mass Import eyebrow class' $settings 'local-groupimport-import__eyebrow local-groupimport-admin-settings__page-eyebrow'
Assert-Contains 'Administration exact Mass Import title class' $settings 'local-groupimport-import__title local-groupimport-admin-settings__page-title'
Assert-Contains 'Administration exact Mass Import description class' $settings 'local-groupimport-import__intro local-groupimport-admin-settings__page-description'
Assert-Contains 'Administration duplicate native heading suppression' $adminstyles '#adminsettings > .settingsform > h2'
Assert-Contains 'Administration identity title string' $english "`$string['adminpageidentitytitle']"
Assert-Contains 'Administration identity description string' $english "`$string['adminpageidentitydescription']"
Assert-Contains 'French Administration identity title string' $french "`$string['adminpageidentitytitle']"
Assert-Contains 'French Administration identity description string' $french "`$string['adminpageidentitydescription']"

Assert-Contains 'Administration four-section skeleton map' $settings '$adminloadingskeletonspec = ['
Assert-Contains 'Administration identifier skeleton geometry' $settings "['overview-wide', 'control-tall']"
Assert-Contains 'Administration participant-display skeleton geometry' $settings "['overview', 'control', 'control', 'control', 'control', 'control']"
Assert-Contains 'Administration overview skeleton source' $adminstyles '.local-groupimport-admin-settings__loading-overview'
Assert-Contains 'Administration control-card skeleton source' $adminstyles '.local-groupimport-admin-settings__loading-form-row'
Assert-Contains 'Generated Administration identity styles' $generatedstyles '.local-groupimport-admin-settings__page-identity'
Assert-Contains 'Generated Administration overview styles' $generatedstyles '.local-groupimport-admin-settings__loading-overview'

$titlePosition = $manage.IndexOf('local-groupimport-easystud__participant-navigation')
$descriptionPosition = $manage.IndexOf('local-groupimport-easystud__intro')
$navigationPosition = $manage.IndexOf('class="local-groupimport-easystud__navigation"')
if ($titlePosition -lt 0 -or $descriptionPosition -lt 0 -or $navigationPosition -lt 0) {
    throw 'Student Management title, description or Navigation markup is missing.'
}
if (-not ($titlePosition -lt $descriptionPosition -and $descriptionPosition -lt $navigationPosition)) {
    throw 'Student Management must render title, description and Navigation in that order.'
}
Assert-Contains 'Student Management description spacing' $layout '&__intro {'
Assert-Contains 'Student Management description typography' $typography '&__intro {'
Assert-Contains 'Generated Student Management description styles' $generatedstyles '.local-groupimport-easystud__intro'

if ($settings.Contains('$adminloadingskeletoncards')) {
    throw 'Administration must not retain the unrelated three-card Skeleton dashboard.'
}

Write-Host 'EasyStud Wave 10 Administration identity, Skeleton and page-order contract passed.'
