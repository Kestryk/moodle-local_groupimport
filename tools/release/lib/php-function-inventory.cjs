'use strict';
const {execFileSync} = require('node:child_process');
// Token boundaries, not brace regexes: interpolated strings can contain braces.
const program = String.raw`
$source = file_get_contents($argv[1]); $tokens = PhpToken::tokenize($source); $result = [];
foreach ($tokens as $i => $token) {
    if ($token->id !== T_FUNCTION) continue;
    $j = $i + 1; while (isset($tokens[$j]) && $tokens[$j]->id === T_WHITESPACE) $j++;
    if (!isset($tokens[$j]) || $tokens[$j]->id !== T_STRING) continue;
    $name = $tokens[$j]->text; while ($tokens[$j]->text !== '{') $j++;
    $brace = $tokens[$j]->pos; $depth = 1;
    while ($depth) {
        $j++;
        if ($tokens[$j]->text === '{' || in_array($tokens[$j]->id, [T_CURLY_OPEN, T_DOLLAR_OPEN_CURLY_BRACES])) $depth++;
        if ($tokens[$j]->text === '}') $depth--;
    }
    $end = $tokens[$j]->pos + 1;
    $result[$name] = ['function' => substr($source, $token->pos, $end - $token->pos),
        'body' => substr($source, $brace + 1, $end - $brace - 2)];
}
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
`;
module.exports = (php, file) => JSON.parse(execFileSync(php, ['-r', program, file],
    {encoding: 'utf8', maxBuffer: 16e6}));
