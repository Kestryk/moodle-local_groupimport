'use strict';
// Keep readable SCSS and every value, selector, declaration and cascade position.
// Never reserialize through CSSOM: unknown/vendor properties must survive too.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {rules} = require('./audit-css.cjs');
function compactDeclarations(css) {
    let result = css;
    for (const rule of rules(css).reverse()) {
        const body = rule.body;
        let quote = '', comment = false, parens = 0, begin = 0, compact = '';
        const append = end => {
            const declaration = body.slice(begin, end);
            // Only indentation before properties, never values or comments.
            compact += declaration.replace(/^\s+(?=(?:--[\w-]+|[a-zA-Z-][\w-]*)\s*:)/, '');
            begin = end;
        };
        for (let i = 0; i < body.length; i++) {
            const c = body[i], next = body[i + 1];
            if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
            if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
            if (c === '/' && next === '*') { comment = true; i++; continue; }
            if (c === '"' || c === "'") { quote = c; continue; }
            if (c === '(' || c === '[') parens++;
            if (c === ')' || c === ']') parens--;
            if (c === ';' && !parens) append(i + 1);
        }
        append(body.length);
        const start = rule.end - body.length - 1;
        result = result.slice(0, start) + compact + result.slice(rule.end - 1);
    }
    return result;
}
if (require.main === module) {
    if (process.argv.includes('--self-test')) {
        const css = '@media (x) { .a {\n  --x: one\n    two;\n  content: "a; b";\n  box-shadow: 0 0 var(--x);\n} }';
        assert.equal(compactDeclarations(css), '@media (x) { .a {--x: one\n    two;content: "a; b";box-shadow: 0 0 var(--x);\n} }');
        assert.equal(compactDeclarations('/*! Keep */ .a {\n /* note */ color: red;\n}'), '/*! Keep */ .a {\n /* note */ color: red;\n}');
        assert.equal(compactDeclarations('.a {\n color: red;\n color: blue !important;\n}'), '.a {color: red;color: blue !important;\n}');
        console.log(JSON.stringify({surface: 'T053-conservative-build', passed: true, checks: 3}));
    } else {
        const [sassModule, output, style = 'conservative'] = process.argv.slice(2);
        if (!sassModule || !output) throw Error('Usage: build-styles.cjs <Sass module> <output CSS> [expanded|conservative]');
        assert(['expanded', 'conservative'].includes(style));
        // Once page CSS is adopted, never accidentally restore the global bundle.
        if (path.resolve(output) === path.resolve(__dirname, '../../styles.css')) {
            const postcssModule = process.argv[5] || require.resolve('postcss');
            module.exports = {compactDeclarations};
            console.log(JSON.stringify(require('./build-page-styles.cjs').build(sassModule, postcssModule)));
            return;
        }
        const sass = require(path.resolve(sassModule));
        assert(sass.info.includes('1.79.1'), 'Preserve established consumer Sass 1.79.1');
        const expanded = sass.compile(path.resolve(__dirname, '../../scss/easystud.scss'), {
            style: 'expanded', charset: false, sourceMap: false, logger: sass.Logger.silent,
        }).css;
        const css = style === 'conservative' ? compactDeclarations(expanded) : expanded;
        assert(css.charCodeAt(0) !== 0xFEFF, 'Never concatenate a BOM into Moodle theme CSS');
        fs.writeFileSync(path.resolve(output), css);
        console.log(JSON.stringify({surface: 'EasyStud-css-build', compiler: sass.info.split('\n')[0],
            style, charset: false, output: path.resolve(output), bytes: Buffer.byteLength(css)}));
    }
}
module.exports = {compactDeclarations};
