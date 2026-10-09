// Actual Moodle Mustache renders both opt-in and preserved legacy branches.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
assert.ok(process.argv[2], 'Usage: <moodle-mustache-source>');
const renderer={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8').replace('export default mustache;','module.exports = mustache;'),renderer);
const root=path.resolve(__dirname,'../..');
const template=fs.readFileSync(path.join(root,'templates/easyedu_guide.mustache'),'utf8');
for(const discoverypresentation of [false,true]) {
    const html=renderer.module.exports.render(template,{discoverypresentation,guidecloselabel:'Close'});
    for(const selector of ['data-easyedu-guide-close','data-easyedu-guide-checklist-close']) {
        const node=html.match(new RegExp('<button[^>]*'+selector+'[^>]*>[\\s\\S]*?</button>'))?.[0];
        assert.ok(node,selector);
        assert.ok(node.includes('aria-label="Close"'),'Accessible command name preserved');
        assert.equal(node.includes('&times;'),discoverypresentation,'Regular multiplication glyph only in Discovery');
        assert.equal(node.includes('fa-times'),!discoverypresentation,'Legacy icon branch preserved');
    }
}
console.log('PASS actual renderer: dialog/checklist Close, Discovery regular glyph, legacy icons and accessible labels.');
