// K18-C-MI native candidate: pending/ready, ordered CSS baseline, actual input Range bounds, Motion.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
// Explicit test-copy lease only. No deployment, settings, imports or course mutations.
const repositoryRoot = path.resolve(__dirname, '../..');
const [playwrightModule, leaseFile, secretFile, outputDirectory] = process.argv.slice(2);
if (!outputDirectory) { throw new Error('Usage: node test-mass-import-component-loading-native.cjs <playwright-module> <lease.json> <password-file> <output-dir> [--pilot]'); }
const output = path.resolve(outputDirectory);
fs.mkdirSync(output, {recursive: true});
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {chromium, request} = require(path.resolve(playwrightModule));
const lease = JSON.parse(fs.readFileSync(path.resolve(leaseFile), 'utf8').replace(/^\uFEFF/, ''));
assert.ok([8052, 8054, 8055].includes(lease.port));
const base = 'http://localhost:' + lease.port;
assert.equal(fs.readFileSync(path.join(lease.lock, 'owner.txt'), 'utf8').replace(/^\uFEFF/, '').trim(), lease.run, 'exclusive pool lease owner');
const phase = 'candidate';
const baselineRef = process.argv.find(arg => arg.startsWith('--baseline='))?.slice('--baseline='.length) || '665bd86a';
const baselineCss = ['mass-import', 'guide'].map(name => execFileSync('git', ['show', baselineRef + ':styles/' + name + '.css'],
    {cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024})).join('\n');
const pilot = process.argv.includes('--pilot');
const stage = (name, data = {}) => fs.appendFileSync(output + '/native-stages.jsonl',
    JSON.stringify({phase, name, ...data, at: new Date().toISOString()}) + '\n');
const secret = fs.readFileSync(path.resolve(secretFile), 'utf8').trim();
function metrics() {
    const root = document.querySelector('#local-groupimport-import');
    function box(selector) {
        const nodes = [...root.querySelectorAll(selector)];
        const node = nodes.find(item => item.getBoundingClientRect().width > 0) || nodes[0];
        if (!node) { return null; }
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {x: rect.x, y: rect.y, width: rect.width, height: rect.height, font: style.fontSize,
            lineHeight: style.lineHeight, weight: style.fontWeight, color: style.color, background: style.backgroundColor,
            padding: style.padding, radius: style.borderRadius, display: style.display, visibility: style.visibility,
            opacity: style.opacity, marginBottom: style.marginBottom, scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth, tag: node.tagName, text: node instanceof HTMLInputElement ? node.value : node.textContent.trim().slice(0, 80)};
    }
    const bars = [...root.querySelectorAll('[data-easyedu-component-skeleton] span')];
    return {state: root.dataset.easystudLoadingState, busy: root.getAttribute('aria-busy'),
        pageSkeleton: !!root.querySelector('[data-easystud-loading-skeleton]'),
        contentInert: root.querySelector('[data-easystud-real-content]')?.inert,
        primary: getComputedStyle(root).getPropertyValue('--easyedu-primary').trim(),
        title: box('.local-groupimport-import__title'), intro: box('.local-groupimport-import__intro'),
        upload: box('.local-groupimport-import-card--upload'), results: box('.local-groupimport-import-card--results'),
        sectionTitle: box('.local-groupimport-import-card__title'),
        deposit: box('[data-local-groupimport-import-form] .easyedu-file-deposit'),
        picker: box('[data-local-groupimport-import-form] .easyedu-file-deposit__control'),
        choose: box('[data-local-groupimport-import-form] .fp-btn-choose'),
        submit: box('[type=submit]'), notice: box('[data-local-groupimport-file-required]'),
        grid: box('.local-groupimport-import__grid'),
        controls: [...root.querySelectorAll('[data-local-groupimport-import-form] :is(input[type=button], input[type=submit],button)')]
            .filter(node => node.getBoundingClientRect().width > 0).map(node => {
                const style = getComputedStyle(node), rect = node.getBoundingClientRect();
                return {id: node.id, width: rect.width, height: rect.height, animation: style.animationName,
                    background: style.backgroundColor, colour: style.color,
                    centreX: (parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth) -
                        parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth)) / 2,
                    centreY: (parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth) -
                        parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth)) / 2};
            }),
        pickerButtons: [...root.querySelectorAll('[data-local-groupimport-import-form] .easyedu-file-deposit__control :is(button,a,input[type=button])')]
            .map(node => ({tag: node.tagName, id: node.id, classes: node.className,
                text: node instanceof HTMLInputElement ? node.value : node.textContent.trim(),
                width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height})),
        bars: bars.map(node => ({width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
            shimmer: getComputedStyle(node, '::after').animationName})),
        viewportOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth)};
}
(async() => {
    const report = {phase, base, rows: [], errors: [], passed: false};
    if (phase === 'candidate') {
        report.servedProof = ['index.php', 'amd/build/csv_import.min.js', 'styles/mass-import.css'].map(file => {
            const hash = name => crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');
            const source = hash(repositoryRoot + '/' + file);
            const served = hash(lease.root + '/moodle/local/groupimport/' + file);
            assert.equal(served, source, 'candidate file parity: ' + file);
            return {file, sha256: served};
        });
    }
    let browser, watchdog, activePage;
    try {
        browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
        watchdog = setTimeout(() => { report.watchdog = true; void browser.close(); }, 480000);
        stage('browser-open');
        const login = await request.newContext({baseURL: base});
        const loginPage = await login.get('/login/index.php', {timeout: 90000});
        const token = (await loginPage.text()).match(/name="logintoken" value="([^"]+)"/);
        assert.ok(token, 'native Moodle login token present');
        const loggedIn = await login.post('/login/index.php', {form: {username: 'claude-sm-test', password: secret,
            logintoken: token[1], wantsurl: base + '/local/groupimport/index.php?id=71'}, timeout: 90000});
        assert.ok(!new URL(loggedIn.url()).pathname.includes('/login/'), 'native login succeeded');
        stage('authenticated');
        const storageState = await login.storageState();
        await login.dispose();
        for (const lang of pilot ? ['fr'] : ['fr', 'en']) {
            for (const width of pilot ? [1600] : [1600,1280,768,390]) {
                const context = await browser.newContext({storageState, viewport: {width, height: 1000},
                    hasTouch: width < 1024, reducedMotion: 'no-preference'});
                const page = await context.newPage();
                activePage = page;
                stage('case-start', {lang, width});
                page.setDefaultTimeout(20000);
                page.on('pageerror', error => report.errors.push({lang, width, kind: 'pageerror', message: error.message}));
                page.on('console', message => { if (message.type() === 'error') {
                    report.errors.push({lang, width, kind: 'console', message: message.text()});
                } });
                let release;
                const held = new Promise(resolve => { release = resolve; });
                await page.route('**/lib/requirejs.php/**', async route => { await held; await route.continue(); });
                await page.goto(base + '/local/groupimport/index.php?id=71&lang=' + lang,
                    {waitUntil: 'commit', timeout: 90000});
                await page.locator('#local-groupimport-import').waitFor({state: 'attached', timeout: 90000});
                stage('root-parsed', {lang, width});
                // Measure the first painted pending frame before the 8s stagnation
                // fallback. Font readiness belongs to the settled ready sample.
                await page.waitForFunction(() => document.querySelector('#local-groupimport-import')?.getAttribute('aria-busy') === 'true', null, {timeout: 90000});
                await page.evaluate(() => new Promise(requestAnimationFrame));
                const row = {lang, width, loading: await page.evaluate(metrics)};
                release();
                if (phase === 'candidate') { assert.equal(row.loading.pageSkeleton, false, 'actual candidate frame is served'); }
                stage('amd-released', {lang, width});
                await page.waitForFunction(() => document.querySelector('#local-groupimport-import')
                    ?.getAttribute('data-easystud-loading-state') === 'ready', null, {timeout: 90000});
                stage('ready-attribute', {lang, width});
                await page.evaluate(async() => { await document.fonts.ready; await new Promise(requestAnimationFrame);
                    await Promise.all(document.querySelector('#local-groupimport-import').getAnimations({subtree: true})
                        .filter(animation => animation.playState === 'running' &&
                            Number.isFinite(animation.effect.getComputedTiming().endTime) &&
                            animation.effect.target?.getBoundingClientRect().width > 0)
                        .map(animation => animation.finished.catch(() => {}))); });
                row.ready = await page.evaluate(metrics);
                const client=await context.newCDPSession(page); row.nativeGlyphs=[];
                for(const selector of ['.local-groupimport-import-form .fp-btn-choose','.local-groupimport-import-form [type=submit]']) {
                    const object=await client.send('Runtime.evaluate',{expression:'document.querySelector('+JSON.stringify(selector)+')'});
                    const desc=await client.send('DOM.describeNode',{objectId:object.result.objectId,depth:6,pierce:true});
                    const texts=[]; const walk=n=>{if(n.nodeType===3&&n.nodeValue.trim())texts.push(n);for(const child of [...(n.children||[]),...(n.shadowRoots||[])])walk(child);}; walk(desc.node);
                    const host=await page.locator(selector).boundingBox();
                    for(const text of texts) {const resolved=await client.send('DOM.resolveNode',{backendNodeId:text.backendNodeId});
                        const measured=await client.send('Runtime.callFunctionOn',{objectId:resolved.object.objectId,functionDeclaration:'function(){const range=this.ownerDocument.createRange();range.selectNodeContents(this);const r=range.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,text:this.nodeValue};}',returnByValue:true});
                        const range=measured.result.value;row.nativeGlyphs.push({selector,host,range,dx:range.x+range.width/2-host.x-host.width/2,dy:range.y+range.height/2-host.y-host.height/2});
                    }
                    if(!texts.length)row.nativeGlyphs.push({selector,unavailable:true,shadow:desc.node.shadowRoots?.map(n=>n.nodeName)});
                }
                await client.detach();
                assert.ok(row.nativeGlyphs.length>=2 && row.nativeGlyphs.every(item=>!item.unavailable),'actual native labels measurable through browser shadow text');
                for(const glyph of row.nativeGlyphs) assert.ok(Math.abs(glyph.dx)<=0.5 && Math.abs(glyph.dy)<=0.5,'native Range glyph centred: '+glyph.selector);
                row.motionCss=[];
                for(const level of ['reduced','minimal']) {
                    const motion=await page.evaluate(level=>new Promise(resolve=>require(['local_groupimport/motion'],Motion=>{
                        const root=document.querySelector('#local-groupimport-import');const previous=Motion.getLevel(root);
                        Motion.setLevel(root,level);root.dataset.easystudLoadingState='loading';
                        const controls=[...root.querySelectorAll('.local-groupimport-import-form :is(.fp-btn-choose,[type=submit])')].map(node=>({animation:getComputedStyle(node).animationName,height:node.getBoundingClientRect().height}));
                        root.dataset.easystudLoadingState='ready';Motion.setLevel(root,previous);resolve({level,controls});})),level);
                    assert.ok(motion.controls.every(node=>node.animation==='none'),'static capsules in '+level);row.motionCss.push(motion);
                }
                row.beforeCssOnly = await page.evaluate(async css => {
                    const sheets=[...document.querySelectorAll('link[rel=stylesheet]')].filter(node=>/local\/groupimport\/styles\/(mass-import|guide)\.css/.test(node.href));
                    for(const sheet of sheets) sheet.disabled=true;
                    const style=document.createElement('style');style.dataset.k18Baseline='1';
                    style.textContent=css.replaceAll('../fonts/', location.origin+'/local/groupimport/fonts/');document.head.append(style);
                    await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
                    await Promise.all(document.querySelector('#local-groupimport-import').getAnimations({subtree:true}).filter(a=>a.playState==='running'&&Number.isFinite(a.effect.getComputedTiming().endTime)&&a.effect.target?.getBoundingClientRect().width>0).map(a=>a.finished.catch(()=>{})));
                }, baselineCss);
                row.beforeCssOnly = await page.evaluate(metrics);
                await page.evaluate(async()=>{document.querySelector('[data-k18-baseline]').remove();
                    for(const sheet of document.querySelectorAll('link[rel=stylesheet]')) {if(/local\/groupimport\/styles\/(mass-import|guide)\.css/.test(sheet.href))sheet.disabled=false;}
                    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
                row.readyAfterBaseline = await page.evaluate(metrics);
                assert.deepEqual(row.readyAfterBaseline.title,row.ready.title,'candidate paint restored after CSS baseline comparison');
                stage('ready', {lang, width});
                report.rows.push(row);
                // Moodle's QuickForm onclick may reject the empty file before a submit event.
                // Exercise the plugin's actual capture listener to measure its warning surface.
                row.validationEvent = await page.locator('.local-groupimport-import-form form').evaluate(form =>
                    ({prevented: !form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})),
                        bound: form.dataset.easyeduImportRequirementBound === '1'}));
                if (phase === 'baseline' && !row.validationEvent.bound) {
                    row.warningStyleOnly = true;
                    await page.locator('[data-local-groupimport-file-required]').evaluate(node => { node.hidden = false; });
                }
                await page.locator('[data-local-groupimport-file-required]:visible').waitFor();
                row.required = await page.evaluate(metrics);
                if (phase === 'candidate') {
                    assert.equal(row.loading.pageSkeleton, false);
                    assert.ok(row.loading.title.height > 0 && row.loading.upload.height > 0 && row.loading.results.height > 0);
                    assert.equal(row.loading.contentInert, true);
                    assert.equal(row.ready.contentInert, false);
                    assert.equal(row.ready.viewportOverflow, 0);
                    assert.equal(row.ready.title.font, '20px');
                    assert.equal(row.ready.sectionTitle.font, '16px');
                    assert.equal(row.ready.title.lineHeight, '30px');
                    assert.equal(row.ready.title.weight, '600');
                    assert.equal(row.ready.choose.height, 44);
                    assert.equal(row.validationEvent.bound, true);
                    assert.equal(row.validationEvent.prevented, true);
                    for (const control of row.ready.controls) {
                        assert.ok(Math.abs(control.centreX) <= 0.5 && Math.abs(control.centreY) <= 0.5);
                    }
                    for (const key of ['submit', 'choose']) {
                        assert.ok(Math.abs(row.loading[key].height - row.ready[key].height) <= 0.5, key + ' has a stable footprint');
                        assert.ok(Math.abs(row.loading[key].width - row.ready[key].width) <= 0.5, key + ' has a stable width');
                    }
                    if (width === 1600 || width === 390) {
                        await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
                    await Promise.all(document.querySelector('#local-groupimport-import').getAnimations({subtree:true}).filter(a=>a.playState==='running'&&Number.isFinite(a.effect.getComputedTiming().endTime)&&a.effect.target?.getBoundingClientRect().width>0).map(a=>a.finished.catch(()=>{})));});
                        await page.screenshot({path: output + '/candidate-' + lang + '-' + width + '.png', fullPage: true});
                    }
                    for (const proof of report.servedProof) {
                        const actual = crypto.createHash('sha256').update(fs.readFileSync(lease.root + '/moodle/local/groupimport/' + proof.file)).digest('hex');
                        assert.equal(actual, proof.sha256, 'candidate file remained unchanged: ' + proof.file);
                    }
                }
                await context.close();
            }
        }
        assert.equal(report.errors.length, 0, 'zero console/page errors');
        report.passed = true;
    } catch (error) {
        report.failure = error.stack;
        if (activePage && !activePage.isClosed()) {
            report.diagnostic = await activePage.evaluate(() => {
                const root = document.querySelector('#local-groupimport-import');
                const form = root?.querySelector('[data-local-groupimport-import-form]');
                return {state: root?.dataset.easystudLoadingState, ready: root?.dataset.easyeduLoadingReady,
                    pickerUnavailable: root?.dataset.easyeduPickerUnavailable, dom: document.readyState,
                    pickerCount: Object.keys(window.M?.core_filepicker?.instances || {}).length,
                    pickerOptions: Object.values(window.M?.core_filepicker?.instances || {}).map(item =>
                        ({elementid: item.options?.elementid, clientid: item.options?.client_id})),
                    realInputIds: [...(form?.querySelectorAll('input') || [])].map(item => item.id),
                    wrapperDisplays: [...(form?.querySelectorAll('[id^="filepicker-wrapper-"]') || [])].map(item =>
                        ({id: item.id, inline: item.style.display, computed: getComputedStyle(item).display})),
                    amdDefined: !!window.requirejs?.defined('local_groupimport/csv_import')};
            }).catch(() => ({unavailable: true}));
        }
    }
    finally {
        clearTimeout(watchdog);
        if (browser) { await browser.close(); }
        fs.writeFileSync(output + '/native-' + phase + (pilot ? '-pilot' : '') + '.json', JSON.stringify(report, null, 2));
        console.log(JSON.stringify({passed: report.passed, rows: report.rows.length, errors: report.errors.length, failure: report.failure}));
        if (!report.passed) { process.exitCode = 1; }
    }
})();
