/* eslint-env node */
// Security lot S9 (audit F3/F7): every value concatenated into an HTML string of the course
// manager (amd/src/local/cm) and of the SM-RENDU renderers (amd/src/local/sm) is escaped with
// the one shared helper, escapeHtml() in local/cm/shared.js.
//
// Usage: node tools/release/test-security-escaping.cjs [git-ref]
// Without a ref the working tree is checked; with one (e.g. HEAD~1) the committed sources are.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const ref = process.argv[2] || '';
const read = file => (ref ?
    execFileSync('git', ['show', `${ref}:${file}`], {cwd: root, maxBuffer: 8e6}).toString() :
    fs.readFileSync(path.join(root, file), 'utf8')).replace(/\r\n/g, '\n');
const list = dir => (ref ?
    execFileSync('git', ['ls-tree', '--name-only', `${ref}:${dir}`], {cwd: root}).toString().split('\n') :
    fs.readdirSync(path.join(root, dir))).filter(name => name.endsWith('.js')).map(name => `${dir}/${name}`);
const failures = [];

// 1. The helper: text and quoted attribute values, so a label like "<b>x</b> is shown literally.
const shared = read('amd/src/local/cm/shared.js');
const definition = shared.match(/^export const escapeHtml = (value => [\s\S]*?);\n/m);
if (!definition) {
    failures.push('amd/src/local/cm/shared.js: no exported escapeHtml helper');
} else {
    const escapeHtml = vm.runInNewContext(definition[1]);
    const decode = html => html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const label = '"<b>x</b>';
    assert.equal(escapeHtml(label), '&quot;&lt;b&gt;x&lt;/b&gt;');
    assert.equal(escapeHtml("l'équipe & co"), 'l&#039;équipe &amp; co');
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(0), '0');
    const html = '<button type="button" aria-label="' + escapeHtml(label) + '" data-x=\'' + escapeHtml(label) + '\'>' +
        escapeHtml(label) + '</button>';
    assert.equal((html.match(/</g) || []).length, 2, 'no element is injected');
    assert.equal(decode(html.match(/aria-label="([^"]*)"/)[1]), label, 'double-quoted attribute keeps the label');
    assert.equal(decode(html.match(/data-x='([^']*)'/)[1]), label, 'single-quoted attribute keeps the label');
    assert.equal(decode(html.match(/>([^<]*)<\/button>$/)[1]), label, 'text keeps the label');
}

// 2. Static scan of the HTML strings.
const files = list('amd/src/local/cm').concat(list('amd/src/local/sm'));
// Calls that escape their arguments themselves.
const escapingCalls = ['escapeHtml', 'renderParticipantField', 'renderParticipantList', 'renderAdvancedInput',
    'renderAdvancedTextarea', 'renderAdvancedListSection', 'renderFieldHelp', 'groupSelectAllRowHtml'];
// Values that are already HTML, rendered by Moodle on the server (user_picture, format_text).
const trustedHtml = new Set(['participant_modal.js:data.profileimage', 'participant_modal.js:data.description']);
const risky = new RegExp([
    '\\blabels\\.\\w+', '\\btexts\\[key\\]', '\\b(?:groupdata|groupingdata)\\.id\\b', '\\bM\\.cfg\\.sesskey\\b',
    '\\b(?:groupid|groupingid|userid)\\b',
    '\\b\\w+\\.(?:name|rawname|fullname|email|username|idnumber|label|title|description|profileimage)\\b',
].join('|'), 'g');
// Blank comments and string literal contents, keeping offsets.
const blankStrings = source => source
    .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, ' '))
    .replace(/'(?:[^'\\\n]|\\.)*'/g, match => "'" + ' '.repeat(match.length - 2) + "'")
    .replace(/\/\/[^\n]*/g, match => ' '.repeat(match.length));
// The argument (between the enclosing '(' or ',' and the next ',' or ')') that contains index.
const argumentAround = (code, open, index) => {
    let from = open + 1;
    let depth = 0;
    for (let i = index - 1; i > open; i--) {
        depth += code[i] === ')' || code[i] === ']' ? 1 : (code[i] === '(' || code[i] === '[' ? -1 : 0);
        if (code[i] === ',' && depth === 0) {
            from = i + 1;
            break;
        }
    }
    depth = 0;
    let to = code.length;
    for (let i = index; i < code.length; i++) {
        depth += code[i] === '(' || code[i] === '[' ? 1 : (code[i] === ')' || code[i] === ']' ? -1 : 0);
        if ((code[i] === ',' && depth === 0) || depth < 0) {
            to = i;
            break;
        }
    }
    return code.slice(from, to);
};
// Escaped when an enclosing call escapes it. A value used as a condition, or passed as a
// whole argument to another call (a renderer, a Mustache context), is not concatenated here.
const isEscaped = (code, index, token) => {
    if (/^\s*\?/.test(code.slice(index + token.length))) {
        return true;
    }
    let depth = 0;
    let braces = 0;
    for (let i = index - 1; i >= 0; i--) {
        if (code[i] === '}') {
            braces++;
        } else if (code[i] === '{') {
            if (braces) {
                braces--;
                continue;
            }
            // A function body ends the expression; an object literal (an argument) does not.
            const before = code.slice(0, i).trimEnd();
            if (before.endsWith(')') || before.endsWith('=>')) {
                return false;
            }
        } else if (code[i] === ')') {
            depth++;
        } else if (code[i] === '(') {
            if (depth) {
                depth--;
                continue;
            }
            const callee = (code.slice(Math.max(0, i - 60), i).match(/([A-Za-z_$][\w$]*)$/) || [])[1];
            if (escapingCalls.includes(callee)) {
                return true;
            }
            if (callee && !['if', 'while', 'for', 'switch', 'return'].includes(callee) &&
                    !argumentAround(code, i, index).includes('+')) {
                return true;
            }
        } else if (code[i] === ';' && depth === 0 && braces === 0) {
            return false;
        }
    }
    return false;
};

files.forEach(file => {
    const source = read(file);
    const base = path.basename(file);
    if (file !== 'amd/src/local/cm/shared.js' && /\b(?:const|let|function)\s+escapeHtml\b/.test(source)) {
        failures.push(`${file}: defines its own escapeHtml; import the one of local/cm/shared.js`);
    }
    if (/\bwindow\.console\b/.test(source)) {
        failures.push(`${file}: uses window.console; use core/log`);
    }
    const code = blankStrings(source);
    // Statements that build HTML: innerHTML/insertAdjacentHTML and string expressions starting with a tag.
    const starts = /\.innerHTML\s*=|\.insertAdjacentHTML\(|(?:return|=|=>|\?|:)\s*'<[a-z/]/g;
    let match;
    while ((match = starts.exec(source))) {
        const end = source.indexOf(';\n', match.index);
        const segment = code.slice(match.index, end === -1 ? undefined : end);
        let token;
        risky.lastIndex = 0;
        while ((token = risky.exec(segment))) {
            const index = match.index + token.index;
            if (trustedHtml.has(`${base}:${token[0]}`) || isEscaped(code, index, token[0])) {
                continue;
            }
            const line = source.slice(0, index).split('\n').length;
            failures.push(`${file}:${line}: ${token[0]} concatenated into HTML without escapeHtml()`);
        }
    }
});

const unique = [...new Set(failures)];
if (unique.length) {
    console.error(unique.join('\n'));
    console.error(`FAIL ${unique.length} escaping problem(s)` + (ref ? ` at ${ref}` : '') + '.');
    process.exitCode = 1;
} else {
    console.log(`PASS escapeHtml shows "<b>x</b> literally; ${files.length} cm/sm modules concatenate no ` +
        'unescaped label, name, e-mail or id into HTML, and none uses window.console.');
}
