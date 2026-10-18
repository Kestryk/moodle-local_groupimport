/* eslint-env node */
'use strict';

// Presentation-only normalization for legacy PowerShell CSS contract checks.
// Keep declarations and rule order; expand comma selectors without changing values.
const fs = require('node:fs');
const path = require('node:path');
const postcss = require(path.join(process.env.EASYEDU_BUILD_NODE_MODULES ||
    'C:/dev/moodle51-build-501/node_modules', 'postcss'));
const ast = postcss.parse(fs.readFileSync(process.argv[2], 'utf8'));
const output = [];
ast.walkRules(rule => {
    const declarations = rule.nodes.filter(node => node.type === 'decl').map(node =>
        node.prop + ': ' + node.value + (node.important ? ' !important' : '') + ';').join('\n');
    for (const selector of rule.selectors) {
        output.push(selector + ' {\n' + declarations + '\n}');
    }
});
process.stdout.write(output.join('\n'));
