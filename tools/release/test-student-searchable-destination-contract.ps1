param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pairs = @{
    'scss/easyedu/components/_searchable-choices.scss' = 'scss/easyedu/components/_searchable-choices.scss'
    'scss/easyedu/_components.scss' = 'scss/easyedu/_components.scss'
    'scss/easyedu/_dialog-classes.scss' = 'scss/easyedu/_dialog-classes.scss'
    'amd/src/searchable_choices.js' = 'choices/searchable_choices.js'
}
foreach ($file in $pairs.Keys) {
    $consumer = & git -C $root hash-object $file
    $canonical = & git -C $KitRoot hash-object $pairs[$file]
    if ($consumer -ne $canonical) { throw "Canonical choice drift: $file" }
}
$source = Get-Content -LiteralPath (Join-Path $root 'amd/src/course_manager.js') -Raw
$baseline = (& git -C $root show '57b83d70a20d8db135a6ff4cd94773360a6f32c1:amd/src/course_manager.js') -join "`n"
$marker = "    confirmButton.addEventListener('click', () => {"
function Get-MoveCommand([string]$text) {
    $start = $text.IndexOf('const bindMoveModal = ')
    $end = $text.IndexOf('const bindParticipantMessaging = ', $start)
    $block = $text.Substring($start, $end - $start).Replace("`r`n", "`n")
    $command = $block.IndexOf($marker)
    if ($command -lt 0) { throw 'Native Move confirmation handler not found.' }
    return $block.Substring($command).TrimEnd()
}
if ((Get-MoveCommand $source) -cne (Get-MoveCommand $baseline)) {
    throw 'Searchable presentation changed native membership command semantics.'
}
foreach ($file in @('ajax.php', 'amd/src/motion.js', 'templates/manage.mustache')) {
    $current = & git -C $root hash-object $file
    $original = & git -C $root rev-parse ("57b83d70a20d8db135a6ff4cd94773360a6f32c1:{0}" -f $file)
    if ($current -ne $original) { throw "Search-only tranche changed native business/template/Motion source: $file" }
}
& (Join-Path $KitRoot 'scripts/test-searchable-choice-contract.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Canonical choice contract failed.' }
$manifest = Get-Content -LiteralPath (Join-Path $root 'easyedu-kit-docs/easyedu-kit.json') -Raw | ConvertFrom-Json
$pin = $manifest.consumerSync.studentSearchableDestinations20261003
if (!$pin -or $manifest.version -ne '0.4.59') { throw 'Searchable-choice successor pin is absent.' }
foreach ($property in $pin.modules.PSObject.Properties) {
    if ((& git -C $root hash-object $property.Name) -ne $property.Value) {
        throw "Searchable-choice source pin drift: $($property.Name)"
    }
}
$assetPins = @{
    'styles.css' = $pin.generatedCssBlob
    'amd/src/course_manager.js' = $pin.courseManagerSourceBlob
    'amd/build/course_manager.min.js' = $pin.courseManagerAmdBlob
    'amd/build/searchable_choices.min.js' = $pin.choiceAmdBlob
    'tools/playwright/student-move-dialog-audit.spec.js' = $pin.nativeScenarioBlob
}
foreach ($file in $assetPins.Keys) {
    if ((& git -C $root hash-object $file) -ne $assetPins[$file]) { throw "Choice asset/scenario pin drift: $file" }
}
$cssDiff = & git -C $root diff $pin.nativeBusinessBaseline -- styles.css
if (@($cssDiff | Where-Object { $_ -match '^-[^-]' }).Count -ne 0) {
    throw 'Opt-in choice changed or removed existing compiled CSS.'
}
Write-Output 'PASS: byte-identical Kit recipe/controller, native Move confirmation handler, AJAX/template/Motion unchanged. No membership transfer or preview certification implied.'
