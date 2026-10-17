// Isolated implementation successor. Historical diagnostic remains unchanged.
// Actual PHP palette adapter + complete old/current CSS; no Moodle/session/DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const current = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const previous = execFileSync('git', ['show', '9726efb1f93cc5c215899ad77b8caabea7d86931:styles.css'], {cwd: root}).toString();
const php = `define('MOODLE_INTERNAL', true);
$auditConfig = json_decode($argv[1], true);
function get_config($component, $key) { global $auditConfig; return $auditConfig[$key] ?? false; }
require $argv[2];
echo json_encode(['style'=>local_groupimport_get_theme_style(),'flags'=>local_groupimport_get_theme_rail_roles()]);`;
const palettes = [
    ['official', {}], ['primary-only', {themeprimarycolor:'#7B3F98'}],
    ['accent-only', {themeaccentcolor:'#984B27'}],
    ['both', {themeprimarycolor:'#7B3F98', themeaccentcolor:'#984B27'}],
    ['light-chosen', {themeprimarycolor:'#FFAE00', themeaccentcolor:'#E0AC34'}], ['restored', {}],
].map(([name, config]) => ({name, ...JSON.parse(execFileSync('php',
    ['-r', php, JSON.stringify(config), path.join(root, 'lib.php')], {encoding:'utf8'}))}));
const html = `<style>body{margin:0} .btn-outline-primary{background:transparent;color:rgb(9,87,161);border:1px solid rgb(9,87,161)}</style>
<main id="root" class="easyedu-ui local-groupimport-import">
<div class="local-groupimport-import-summary">
<span id="summary" class="local-groupimport-import-summary__item local-groupimport-import-summary__item--success easyedu-report-summary--success"><strong>12</strong> rows ready</span>
<span id="danger" class="local-groupimport-import-summary__item local-groupimport-import-summary__item--error"><strong>2</strong> rows need attention</span></div>
<h4 id="heading" class="local-groupimport-import-report__title local-groupimport-import-report__title--success easyedu-report-title--success">Successful additions</h4>
<ul class="local-groupimport-import-report local-groupimport-import-report--success easyedu-report-list--success"><li id="row"><span id="glyph" class="fa fa-check"></span><span>Existing membership, kept unchanged.</span></li></ul>
<ul class="local-groupimport-import-report local-groupimport-import-report--error"><li><span id="danger-glyph" class="fa fa-exclamation-triangle"></span><span>Unknown identifier.</span></li></ul>
<button id="keyboard-entry">Keyboard entry</button>
<a id="export" href="#" class="btn btn-outline-primary easyedu-action-with-icon local-groupimport-import__export-results easyedu-button--outline-primary"><span class="fa fa-file-excel"></span><span>Export annotated Excel report</span></a>
</main>`;
const ids = ['summary','danger','heading','row','glyph','danger-glyph','export'];
const luminance = colour => {
    const c = colour.match(/[\d.]+/g).slice(0,3).map(Number).map(v => v / 255);
    return c.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
        .reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
};
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
(async() => {
    const browser = await chromium.launch({headless:true});
    let checks = 0;
    try {
        const page = await browser.newPage();
        await page.route('**/*', route => route.abort());
        await page.setContent(html);
        const style = await page.addStyleTag({content:previous});
        const settle = async() => page.evaluate(async() => {
            await document.fonts.ready;
            await Promise.all(document.getAnimations().filter(a => Number.isFinite(a.effect.getComputedTiming().endTime))
                .map(a => a.finished.catch(() => {})));
        });
        const read = () => page.evaluate(ids => {
            const root = document.querySelector('#root');
            const resolve = (property, value) => {
                const p = document.createElement('i'); root.append(p); p.style[property] = value;
                const result = getComputedStyle(p)[property]; p.remove(); return result;
            };
            return {tokens:{accent:resolve('color','var(--easyedu-accent)'), soft:resolve('backgroundColor','var(--easyedu-accent-soft)'),
                border:resolve('color','color-mix(in srgb,var(--easyedu-accent-chosen) 24%,#fff 76%)'),
                primary:resolve('color','var(--easyedu-primary)'), strong:resolve('color','var(--easyedu-primary-strong)'),
                primarySoft:resolve('backgroundColor','var(--easyedu-primary-soft)'), muted:resolve('color','var(--easyedu-text-muted)')},
            items:Object.fromEntries(ids.map(id => {
                const n = document.getElementById(id), s = getComputedStyle(n), r = n.getBoundingClientRect();
                return [id,{paint:[s.backgroundColor,s.borderColor,s.color,s.boxShadow,s.opacity],
                    metrics:[r.width,r.height,s.padding,s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight,
                        s.borderWidth,s.borderRadius,s.columnGap,s.transition,s.animation]}];
            }))};
        }, ids);
        for (const width of [1600,768,390]) {
            await page.setViewportSize({width,height:1000});
            const official = palettes[0];
            await page.locator('#root').evaluate((n,p) => { n.style.cssText=p.style; n.dataset.easyeduReportPalette=p.flags; }, official);
            await page.locator('#export').evaluate(n=>{n.removeAttribute('aria-disabled');n.blur();});
            await page.mouse.move(width-1,999);
            await style.evaluate((s,css)=>s.textContent=css, previous);
            await settle(); const before = await read();
            await style.evaluate((s,css)=>s.textContent=css, current);
            await settle(); assert.deepEqual((await read()).items,before.items,'Exact official old/current paint and geometry'); checks++;
            for (const p of palettes) {
                await page.locator('#root').evaluate((n,p) => {n.style.cssText=p.style;n.dataset.easyeduReportPalette=p.flags;},p);
                await page.locator('#export').evaluate(n=>{n.removeAttribute('aria-disabled');n.blur();});
                await page.mouse.move(width-1,999); await settle();
                const state = await read();
                for (const id of ids) { assert.deepEqual(state.items[id].metrics,before.items[id].metrics, `${p.name}/${id}: geometry/type/Motion`); checks++; }
                for (const id of ['danger','row','danger-glyph']) { assert.deepEqual(state.items[id].paint,before.items[id].paint,`${id}: semantic meaning preserved`); checks++; }
                if (p.flags.includes('success')) {
                    assert.deepEqual(state.items.summary.paint.slice(0,3),[state.tokens.soft,state.tokens.border,state.tokens.accent]);
                    assert.equal(state.items.heading.paint[2],state.tokens.accent);
                    assert.deepEqual([state.items.glyph.paint[0],state.items.glyph.paint[2]],[state.tokens.soft,state.tokens.accent]);
                    // Resolve colour-mix into sRGB through canvas for the contrast calculation.
                    const colours = await page.evaluate(({ink,soft})=>{
                        const c=document.createElement('canvas').getContext('2d');
                        return [ink,soft].map(v=>{c.fillStyle=v;c.fillRect(0,0,1,1);return `rgb(${[...c.getImageData(0,0,1,1).data].slice(0,3).join(',')})`;});
                    },{ink:state.tokens.accent,soft:state.tokens.soft});
                    assert.ok(contrast(...colours)>=4.5,'Readable custom success on its actual soft surface'); checks+=4;
                } else {
                    for (const id of ['summary','heading','glyph']) assert.deepEqual(state.items[id].paint,before.items[id].paint);
                    checks+=3;
                }
                if (p.flags.includes('primary')) assert.equal(state.items.export.paint[2],state.tokens.primary);
                else assert.deepEqual(state.items.export.paint,before.items.export.paint,
                    `${width}/${p.name}: official Export ${JSON.stringify(state.items.export.paint)} vs ${JSON.stringify(before.items.export.paint)}`); checks++;
                await page.locator('#export').hover(); await settle();
                const hover = await read();
                assert.equal(hover.items.export.paint[0],hover.tokens.primarySoft);
                assert.equal(hover.items.export.paint[2],hover.tokens.strong); checks+=2;
                await page.locator('#keyboard-entry').click();
                await page.keyboard.press('Tab'); await settle();
                assert.equal(await page.locator('#export').evaluate(n=>n.matches(':focus-visible')),true);
                const focus=await read(); assert.notEqual(focus.items.export.paint[3],'none'); checks+=2;
                await page.locator('#export').evaluate(n=>n.setAttribute('aria-disabled','true')); await settle();
                const disabled=await read(); assert.equal(disabled.items.export.paint[2],disabled.tokens.muted);
                assert.equal(disabled.items.export.paint[4],'0.62'); checks+=2;
            }
        }
        console.log(`PASS ${checks} SM-64 isolated assertions: actual PHP roles, exact default restoration, independent custom paint, accessible ink, three widths and Export states. Bootstrap rest sentinel is NOT native Moodle proof.`);
    } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
