# EED-UI-2026-0069 - EasyStud French localisation

## Scope

This source batch removes visible English fallbacks from the dynamic EasyStud
manager and keeps the French language pack authoritative for the active Moodle
language. It covers selection and empty states, sorting, action menus,
Participant, Group and Grouping details/settings modals, Filepicker text,
notifications and the Guide visual examples.

The Moodle component remains local_groupimport. Product identifiers, URLs,
database fields, capability names, CSV header identifiers and API contracts
remain unchanged. CCB and the previously accepted UI 0040 work are excluded.

## Localisation contract

- English and French packs keep exact key parity and identical placeholders.
- PHP, Mustache and AMD source remain strict UTF-8 without a BOM, replacement
  characters or common mojibake markers.
- Dynamic controls consume server-provided get_string values through the
  existing data-easystud-detail-labels payload. They no longer inject English
  fallback labels.
- Generated AMD is rebuilt only from amd/src and must remain a RequireJS
  define module without top-level ESM syntax.

## Validation protocol

1. Lint changed PHP and language files.
2. Compare English/French language keys, duplicate keys and placeholders.
3. Decode the changed language files as strict UTF-8, reject BOM and mojibake
   markers, then check French accents and apostrophes with the reusable
   `php tests/localisation_contract_test.php` contract. This replaces inline
   interpreter payloads and keeps endpoint-security telemetry readable.
4. Rebuild affected AMD source and run syntax/AMD-format checks.
5. On a separately authorised managed preview, switch Moodle to French and
   review Administration, Student Management, Mass Import, Import history,
   Guide, Participant, Group and Grouping modals at desktop and narrow widths.
   Return to English and confirm unchanged behavior.

## Current evidence boundary

This source candidate has no cache purge, runtime lease, fixture mutation,
browser execution or preview promotion. The final human check therefore
remains required after a managed preview is explicitly queued.
