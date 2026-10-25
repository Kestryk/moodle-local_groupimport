# Portuguese and German translations

EasyStud includes complete European Portuguese (`pt`) and German (`de`)
translations alongside English and French. English is the canonical key list.
The two new files each contain all **1,409 keys**, in the same order as English.

## Language conventions

- Portuguese uses European Portuguese: *ficheiro*, *utilizador*, *ecrã*,
  *disciplina*, *grupo* and *agrupamento*. Instructions use formal imperatives
  such as *Selecione* and *Verifique*. This is the Moodle `pt` locale, not `pt_br`.
- German uses formal *Sie*, *Kurs*, *Gruppe*, *Gruppierung*, and *Teilnehmende*.
  Compact UI nouns include *Teilnehmerverwaltung* and *Teilnehmerdetails*.
  The illustrative student role uses Moodle's *Teilnehmer/in* label.
- Product names and technical identifiers remain unchanged. Example names that
  refer to existing illustrated memberships remain consistent with those cards.
  Creation examples have corresponding localized names and formulas.
- Portuguese uses «…» and German „…“ for interface labels. Accents, umlauts,
  ß, ellipses and arrows are stored as UTF-8 without a byte-order mark.

All distinct source messages were translated and reviewed, including Guide
instructions, deletion confirmations, privacy descriptions and import recovery
warnings. Changes are confined to new translations and supporting documentation;
the existing English and French files are untouched.

## Installation and fallback

Install or enable the corresponding **Moodle language pack** to make the language
available in Moodle's selector. The plugin files translate EasyStud; they do not
install or replace Moodle's core language packs. Standard Moodle language
inheritance and local language customizations continue to apply.

Do not translate parser tokens such as `email`, `username`, `groupname`,
`groupingname`, or `useridentifier` when they are shown as technical column
names. Preserve `{$a}`, `{$a->field}`, JavaScript substitution tokens such as
`__count__`, literal `{}`/`{name}` slots and HTML markup exactly.

## Validation

- PHP lint succeeds for both files.
- PHP evaluation confirms exact English/PT/DE key names, counts and order.
- All translated values round-trip through PHP unchanged.
- Interpolation token multisets and HTML tags match the English originals.
- UTF-8 is valid, with no BOM. New files use LF, matching the existing language
  files and the repository's `.gitattributes`; existing line endings are unchanged.
- Moodle 5.1's actual string manager loads and formats all 1,409 strings in
  **each** language. This CLI check uses official core language metadata and a
  candidate component path in the test process only. No served plugin file,
  persistent setting, core language pack or business data is changed.

The CLI check certifies loading and interpolation, not a browser-wide layout
review of the longer translated text. No build or deployment is required for
these source language files.
