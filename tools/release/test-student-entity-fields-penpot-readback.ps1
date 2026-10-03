param([Parameter(Mandatory = $true)][string]$KitRoot)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$record = Get-Content -Raw -LiteralPath (Join-Path $root 'docs/testing/student-entity-fields-penpot-2026-10-03.json') | ConvertFrom-Json
if ($record.humanVisualValidated -or $record.foundation.humanVisualValidated -or $record.product.humanVisualValidated) {
    throw 'Structural readback must not claim deferred human acceptance.'
}
foreach ($entry in @(
    @{Path = $record.source.fieldModule; Blob = $record.source.fieldBlob},
    @{Path = $record.source.metadataModule; Blob = $record.source.metadataBlob}
)) {
    if ((& git -C $root hash-object $entry.Path) -ne $entry.Blob -or
            (& git -C $KitRoot hash-object $entry.Path) -ne $entry.Blob) {
        throw "Canonical field/metadata source drift: $($entry.Path)"
    }
}
$pairs = @($record.foundation.items)
$fields = @($record.product.items)
if ($pairs.Count -ne 12 -or $fields.Count -ne 17 -or
        @($pairs.componentId | Select-Object -Unique).Count -ne 12 -or
        @($fields.id | Select-Object -Unique).Count -ne 17) {
    throw 'Expected twelve unique family pairs and seventeen product fields.'
}
foreach ($pair in $pairs) {
    $expectedWidth = if ($pair.name.StartsWith('Regular /')) { 378 } else { 324 }
    if (-not $pair.linked -or -not $pair.fingerprintMatch -or $pair.width -ne $expectedWidth) {
        throw "Shared field provider/geometry mismatch: $($pair.name)"
    }
    foreach ($text in @($pair.mainText) + @($pair.standardText)) {
        if (-not $text.paintContained -or $text.font -ne 'Inter') {
            throw "Shared field painted text invalid: $($pair.name)"
        }
    }
}
foreach ($entityBoard in $record.product.hosts) {
    $expected = if ($entityBoard.name -eq 'Participant details') { 7 } else { 5 }
    if (@($fields | Where-Object host -eq $entityBoard.id).Count -ne $expected) {
        throw "Native field composition count changed: $($entityBoard.name)"
    }
}
foreach ($field in $fields) {
    if (-not $field.visible -or -not $field.withinHost -or
            $field.libraryId -ne $record.foundation.file -or
            $field.componentId -notin $pairs.componentId) {
        throw "Product field provider/containment mismatch: $($field.name)"
    }
    foreach ($text in $field.texts) {
        $role = if ($text.role -eq 'Caption') { $record.roles.caption }
            elseif ($text.role -eq 'Text') { $record.roles.editing }
            elseif ($text.color -eq '#8a9bad') { $record.roles.empty }
            else { $record.roles.value }
        if (-not $text.paintContained -or $text.font -ne $role.font -or
                [double]$text.size -ne $role.size -or [int]$text.weight -ne $role.weight -or
                $text.color -ne $role.color) {
            throw "Product field typography/paint mismatch: $($field.name) / $($text.role)"
        }
    }
}
if ($record.captures.retention.deletedCount -ne 0 -or $record.captures.retention.protectedCount -ne 6) {
    throw 'Readback captures must remain preserved.'
}
Write-Output 'PASS: saved twelve Standard/Library fingerprints/providers and seventeen product field roles/paint. Snapshot contract only; not a live editor, all-state or human gate.'
