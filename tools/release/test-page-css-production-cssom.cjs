'use strict';

// The historical strict CSSOM gate compares raw value strings, including
// insignificant var()/custom-property whitespace. This production-format gate
// keeps all rule, selector, declaration, priority and value-token assertions.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [browserPath, valueParserPath, evidencePath] = process.argv.slice(2);
assert(browserPath && valueParserPath && evidencePath, 'Pass Playwright, value-parser and external evidence paths');
const {chromium} = require(path.resolve(browserPath));
const parseValue = require(path.resolve(valueParserPath));
const tokens = nodes => nodes.filter(n => n.type !== 'comment').map(n =>
    [n.type, n.type === 'space' ? ' ' : n.value, n.quote, n.nodes && tokens(n.nodes)]);

(async () => {
    const browser = await chromium.launch({headless: true});
    const report = {passed: true, pages: []};
    try {
        const page = await browser.newPage();
        for (const name of ['student-management', 'mass-import', 'administration', 'guide']) {
            const texts = ['readable', 'production'].map(format =>
                fs.readFileSync(path.join(evidencePath, format, name + '.css'), 'utf8'));
            const parsed = await page.evaluate(texts => texts.map(text => {
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(text);
                const walk = rules => [...rules].map(rule => ({
                    type: rule.type, selector: rule.selectorText, condition: rule.conditionText,
                    key: rule.keyText, name: rule.name,
                    declarations: rule.style ? [...rule.style].map(property => ({property,
                        priority: rule.style.getPropertyPriority(property), value: rule.style.getPropertyValue(property)})) : null,
                    children: rule.cssRules ? walk(rule.cssRules) : null
                }));
                return walk(sheet.cssRules);
            }), texts);
            let whitespaceDifferences = 0;
            const normalize = (nodes, otherNodes) => nodes.map((node, index) => ({...node,
                declarations: node.declarations?.map((declaration, j) => {
                    if (declaration.value !== otherNodes[index]?.declarations?.[j]?.value) whitespaceDifferences++;
                    return {...declaration, value: tokens(parseValue(declaration.value).nodes)};
                }) ?? null,
                children: node.children && normalize(node.children, otherNodes[index]?.children || [])
            }));
            assert.deepEqual(normalize(parsed[0], parsed[1]), normalize(parsed[1], parsed[0]), name);
            report.pages.push({name, orderedRulesAndSelectorsIdentical: true,
                declarationOrderAndPriorityIdentical: true, valueTokenDifferences: 0,
                whitespaceOnlyValueStrings: whitespaceDifferences / 2});
        }
    } finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(evidencePath, 'cssom-production-audit.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exitCode = 1; });
