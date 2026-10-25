'use strict';

// Compare readable and production builds from the same source and toolchain.
// External evidence stays outside the repository; page assets end in production form.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {build} = require('./build-page-styles.cjs');

const [sassPath, postcssPath, outputPath] = process.argv.slice(2);
assert(sassPath && postcssPath && outputPath, 'Pass Sass, PostCSS and an external evidence directory');
const root = path.resolve(__dirname, '../..');
const output = path.resolve(outputPath);
assert(!output.startsWith(root + path.sep), 'Evidence must be outside the checkout');
const postcss = require(path.resolve(postcssPath));
const dependencyRoot = path.resolve(postcssPath, '..');
const selectorParser = require(require.resolve('postcss-selector-parser', {paths: [dependencyRoot]}));
const valueParser = require(require.resolve('postcss-value-parser', {paths: [dependencyRoot]}));
const pages = ['student-management', 'mass-import', 'administration', 'guide'];

function selector(node) {
    return [node.type, node.value, node.attribute, node.operator, node.insensitive,
        node.namespace, node.nodes?.filter(n => n.type !== 'comment').map(selector)];
}

function values(nodes) {
    return nodes.filter(n => n.type !== 'comment').map(n =>
        [n.type, n.type === 'space' ? ' ' : n.value, n.quote, n.nodes && values(n.nodes)]);
}

function semantic(node) {
    const children = node.nodes?.filter(n => n.type !== 'comment').map(semantic);
    if (node.type === 'root') return ['root', children];
    if (node.type === 'rule') return ['rule', selector(selectorParser().astSync(node.selector)), children];
    if (node.type === 'atrule') return ['atrule', node.name, values(valueParser(node.params).nodes), children];
    if (node.type === 'decl') return ['decl', node.prop, node.important || false, values(valueParser(node.value).nodes)];
    throw Error('Unexpected CSS node: ' + node.type);
}

const readableBuild = build(sassPath, postcssPath, {minify: false});
fs.mkdirSync(path.join(output, 'readable'), {recursive: true});
fs.mkdirSync(path.join(output, 'production'), {recursive: true});
for (const name of pages) fs.copyFileSync(path.join(root, 'styles', name + '.css'), path.join(output, 'readable', name + '.css'));
const productionBuild = build(sassPath, postcssPath);
const report = {passed: true, readableBuild, productionBuild, pages: {}};
for (const name of pages) {
    const before = fs.readFileSync(path.join(output, 'readable', name + '.css'));
    const after = fs.readFileSync(path.join(root, 'styles', name + '.css'));
    fs.writeFileSync(path.join(output, 'production', name + '.css'), after);
    const readable = postcss.parse(before.toString());
    const production = postcss.parse(after.toString());
    assert.deepEqual(semantic(production), semantic(readable), name + ': selector/value/order changed');
    let selectors = 0;
    const tokenBlocks = [];
    production.walkRules(rule => {
        selectors += postcss.list.comma(rule.selector).length;
        const defaults = rule.nodes.filter(n => n.type === 'decl' && n.prop.startsWith('--'));
        if (defaults.length >= 100) tokenBlocks.push({selector: rule.selector, declarations: defaults.length});
    });
    if (name === 'student-management') {
        assert.deepEqual(tokenBlocks.map(x => x.selector), ['.local-groupimport-easystud'], 'Duplicate/foreign root token block');
        assert(!production.toString().includes(':root'), 'Global token emission is not expected');
    }
    assert(after.length < before.length, name + ': production output must be smaller');
    report.pages[name] = {readableBytes: before.length, productionBytes: after.length,
        readableGzip: zlib.gzipSync(before).length, productionGzip: zlib.gzipSync(after).length,
        selectors, tokenBlocks, semanticDifferences: 0};
}
fs.writeFileSync(path.join(output, 'css-production-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: report.passed, pages: report.pages}));
