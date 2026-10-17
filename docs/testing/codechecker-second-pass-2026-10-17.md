# Second mechanical codechecker pass

Base108f0b2c. Full counts by file/rule and remaining review items are in PRE-AUDIT-CODECHECKER-2026-10-17.md under the shared review artifact directory; machine results in C:/dev/artifacts/codechecker-2-20261017/.

MoodleCS1231errors/124warnings →191/47; zero automatic fixes proposed. PHP56files: all executable tokens unchanged except170 brace delimiters inserted by the official inline-control fixer in9 fixtures; all files lint. Four AMD sources preserve Babel tokens and executable builds (maps only). No CSS, templates, languages or runtime changed.

Required targeted tests and isolated13-suite smoke PASS. Remaining findings are not waived: fixture architecture/loading, native-name/property documentation policies, logging/internal guards, literal contracts and shared Guide/Kit or JS behavior choices. Raw ESLint CRLF counts are separated from non-EOL errors in the JSON.
