/* eslint-env node */
// Execute the production toolbar renderer with a bounded DOM double.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/course_manager.js'), 'utf8').replace(/\r\n/g, '\n');
const pin = 'b8cbb1a4dbf645ad01f55382ef26b1a2b29eee08';
const baseline = execFileSync('git', ['show', `${pin}:amd/src/course_manager.js`],
    {cwd:root,encoding:'utf8'}).replace(/\r\n/g, '\n');
const addedStart = '    // Selection/density updates may rerender while a Guide cue or keyboard\n' +
    '    // focus points at a proxy. Retain its identity for the same native action.\n' +
    '    const existingActions = new Map(Array.from(buttons.children).map(button => [\n' +
    "        button.getAttribute('data-easystud-mobile-action-trigger'), button,\n" +
    '    ]));\n    const retainedActions = new Set();';
const addedButton = '        const button = existingActions.get(action.selector) || document.createElement(\'button\');\n' +
    '        retainedActions.add(button);\n        button.replaceChildren();';
const addedEnd = '    Array.from(buttons.children).forEach(button => {\n' +
    '        if (!retainedActions.has(button)) {\n            button.remove();\n        }\n    });\n';
let restored = source;
for (const [after,before] of [[addedStart,"    buttons.innerHTML = '';"],
    [addedButton,"        const button = document.createElement('button');"],[addedEnd,'']]) {
    assert.equal(restored.split(after).length, 2);
    restored = restored.replace(after,before);
}
assert.equal(restored, baseline, 'All other commands, Guide, selection, Motion and native adapters preserved');
// The earlier context oracle is immutable; replay it against the reconstructed
// source in isolation without rewriting its historical file.
let contextTest = fs.readFileSync(path.join(root,'tools/release/test-guide-move-context.cjs'),'utf8');
const testFs = {...fs, readFileSync:(file,...args) => String(file).replace(/\\/g,'/').endsWith('amd/src/course_manager.js') ?
    restored : fs.readFileSync(file,...args)};
vm.runInNewContext(contextTest, {require:name => name === 'node:fs' ? testFs : require(name),
    __dirname:path.join(root,'tools/release'), console});

class Node {
    constructor() { this.children=[];this.attributes={};this.classList={contains:() => false}; }
    setAttribute(key,value) {this.attributes[key]=value;}
    getAttribute(key) {return this.attributes[key] || null;}
    removeAttribute(key) {delete this.attributes[key];}
    replaceChildren() {this.children=[];}
    appendChild(child) {
        if (child.parent) child.parent.children=child.parent.children.filter(node => node!==child);
        child.parent=this;this.children.push(child);
    }
    remove() {if(this.parent) this.parent.children=this.parent.children.filter(node=>node!==this);}
}
const bar=new Node(), buttons=new Node(), summary=new Node();
bar.querySelector=selector => selector.includes('summary') ? summary : buttons;
const start=source.indexOf('const renderMobileActionBar = (root, counts, activetype) => {');
const end=source.indexOf('const updateSelectionActions = root => {',start);
let renderer;
vm.runInNewContext(source.slice(start,end)+'\nrenderer=renderMobileActionBar;', {
    set renderer(value) {renderer=value;}, ensureMobileActionBar:()=>bar,
    getMobileActionButton:(host,selector) => ({text:selector,classList:{contains:()=>false}}),
    getLabels:()=>({selectioncounttemplate:'__count__ selected'}),getButtonIcon:()=> 'fa-users',
    getButtonText:button=>button.text,document:{createElement:()=>new Node()},Map,Set,Array
});
const counts={participant:1,member:0,group:0,grouping:0};
renderer({},counts,'participant');
const first=new Map(buttons.children.map(button=>[button.getAttribute('data-easystud-mobile-action-trigger'),button]));
renderer({}, {...counts,participant:2},'participant');
assert.equal(buttons.children.length,4);
assert.equal(summary.textContent,'2 selected');
for(const button of buttons.children) {
    assert.equal(button,first.get(button.getAttribute('data-easystud-mobile-action-trigger')));
    assert.equal(button.children.length,2,'No duplicate icon/label');
}
renderer({}, {participant:0,member:1,group:0,grouping:0},'member');
assert.equal(buttons.children.length,4);
assert.ok(!buttons.children.some(button=>button.getAttribute('data-easystud-mobile-action-trigger')===
    '[data-easystud-move-selected-participants]'),'Unrelated stale Participant action removed');
renderer({}, {participant:0,member:0,group:0,grouping:0},'member');
assert.equal(bar.hidden,true);
console.log('PASS: stable native proxy identities, refreshed labels, stale action cleanup and zero-selection hide.');
