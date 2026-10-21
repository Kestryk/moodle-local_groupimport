'use strict';
// I9 (21/10): a hand-rolled, whitespace/comment-only minifier for already-valid CSS.
//
// Third-party minifiers (tried: clean-css 2.2.23, the only one available in the recorded
// toolchain) rewrite selector/value tokens and corrupted `:is(...)` argument lists in this
// codebase (unclosed-bracket parse errors once re-parsed). Never reach for a minifier that
// re-tokenizes selectors or values here without first proving it round-trips every selector
// family in scss/ (:is, :has, :not, attribute selectors, color-mix(), calc(), data: URLs).
//
// This function only removes comments and collapses/strips whitespace that CSS treats as
// insignificant: it never touches a selector, a property name or a value token, so it cannot
// change what the stylesheet matches or computes. A quote-aware scan (same style as
// compactDeclarations in build-styles.cjs) keeps string contents - including data: URLs -
// untouched.
function minifyCss(css) {
    let out = '';
    let quote = '';
    let comment = false;
    let i = 0;
    const n = css.length;
    // Collapse consumes the run of whitespace starting at i and returns the index just past it,
    // appending a single space unless that space sits against a token boundary where CSS needs
    // none (after '{', ';', ',' or before '{', '}', ';', ',').
    const isSpace = c => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
    while (i < n) {
        const c = css[i];
        const next = css[i + 1];
        if (comment) {
            if (c === '*' && next === '/') { comment = false; i += 2; continue; }
            i++;
            continue;
        }
        if (quote) {
            out += c;
            if (c === '\\' && i + 1 < n) { out += css[i + 1]; i += 2; continue; }
            if (c === quote) quote = '';
            i++;
            continue;
        }
        if (c === '/' && next === '*') {
            if (css[i + 2] === '!') {
                const end = css.indexOf('*/', i + 2);
                const stop = end === -1 ? n : end + 2;
                out += css.slice(i, stop);
                i = stop;
                continue;
            }
            comment = true; i += 2; continue;
        }
        if (c === '"' || c === "'") { quote = c; out += c; i++; continue; }
        if (isSpace(c)) {
            let j = i;
            while (j < n && isSpace(css[j])) j++;
            const prev = out[out.length - 1];
            const after = css[j];
            const dropBefore = prev === undefined || '{};,'.includes(prev);
            const dropAfter = after === '{' || after === '}' || after === ';' || after === ',' || after === undefined;
            if (!dropBefore && !dropAfter) out += ' ';
            i = j;
            continue;
        }
        out += c;
        i++;
    }
    return out;
}
if (require.main === module) {
    const assert = require('node:assert/strict');
    assert.equal(
        minifyCss('.a {\n  color: red;\n}\n\n.b,\n.c {\n  display: flex;\n}\n'),
        '.a{color: red;}.b,.c{display: flex;}'
    );
    assert.equal(
        minifyCss('body:has(.x[data-foo~="bar"]:not([hidden])) .y {\n  opacity: 0;\n}'),
        'body:has(.x[data-foo~="bar"]:not([hidden])) .y{opacity: 0;}'
    );
    assert.equal(
        minifyCss('.a {\n  background: url("data:image/svg+xml,%3Csvg viewBox=\'0 0 16 16\'%3E%3C/svg%3E");\n}'),
        '.a{background: url("data:image/svg+xml,%3Csvg viewBox=\'0 0 16 16\'%3E%3C/svg%3E");}'
    );
    assert.equal(
        minifyCss('/* note */\n.a {\n  /* inline */ color: red; /* trailing */\n}'),
        '.a{color: red;}'
    );
    console.log(JSON.stringify({surface: 'minify-css-self-test', passed: true, checks: 4}));
}
module.exports = {minifyCss};
