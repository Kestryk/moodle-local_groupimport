/* eslint-env node */
const fs = require('node:fs');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');
const [base, course, out, label = 'geometry', locales = 'fr,en', candidate] = process.argv.slice(2);
if (!base || !course || !out || !path.isAbsolute(out)) {
 throw Error('Pass base, course, absolute evidence directory, label, locales and optional candidate AMD');
}
fs.mkdirSync(out, {recursive: true});
const report = {base, course, label, candidate: candidate || null,
 candidateSha: candidate ? require('node:crypto').createHash('sha256').update(fs.readFileSync(candidate)).digest('hex') : null,
 cases: [], errors: [], console: []};
const save = () => fs.writeFileSync(`${out}/${label}.json`, JSON.stringify(report, null, 2));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async() => {
 let browser;
 try {
  browser = await chromium.launch({executablePath: process.env.QA_CHROME_EXECUTABLE || undefined, headless: true});
  const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
  if (candidate) {
   const built = fs.readFileSync(candidate, 'utf8');
   await context.route('**/lib/requirejs.php/**', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const start = body.indexOf('define("local_groupimport/easyedu_guide",');
    if (start < 0) {
 return route.fulfill({response});
}
    const acorn = require(process.env.QA_ACORN_MODULE || 'acorn');
    const ast = acorn.parse(body, {ecmaVersion: 'latest'});
    const module = ast.body.find(n => n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression' &&
      n.expression.callee.name === 'define' && n.expression.arguments[0]?.value === 'local_groupimport/easyedu_guide');
    if (!module) {
 throw Error('Guide module not isolated');
}
    body = body.slice(0, module.start) + built + '\n' + body.slice(module.end);
    report.replaced = (report.replaced || 0) + 1;
    await route.fulfill({response, body});
   });
  }
  await context.addInitScript(() => {
   const rect = e => {
 const r = e?.getBoundingClientRect(); return r ? {x: r.x, y: r.y, w: r.width, h: r.height} : null;
};
   const describe = e => {
    const s = getComputedStyle(e);
    return {tag: e.tagName, id: e.id, classes: e.className, rect: rect(e), scrollTop: e.scrollTop, scrollHeight: e.scrollHeight,
     style: e.getAttribute('style'), cv: s.contentVisibility, position: s.position, transform: s.transform, display: s.display,
     padding: s.padding, margin: s.margin, height: s.height, overflow: s.overflow, contain: s.contain, boxSizing: s.boxSizing};
   };
   window.k23snap = () => {
    const p = document.querySelector('.local-groupimport-easystud__panel'),
ancestors = [];
    for (let e = p; e; e = e.parentElement) {
 ancestors.push(describe(e));
}
    const modal = document.querySelector('[data-easyedu-guide-modal]');
    return {t: performance.now(), url: location.href, lang: document.documentElement.lang,
     next: document.querySelector('[data-easyedu-guide-next]')?.textContent.trim(),
     close: document.querySelector('[data-easyedu-guide-close]')?.getAttribute('aria-label'),
     panel: rect(p), region: rect(document.querySelector('#region-main')), scroll: [scrollX, scrollY],
     fullscreen: !!document.fullscreenElement, parked: [...document.querySelectorAll('[data-easyedu-guide-parked]')].map(describe),
     modal: modal ? {hidden: modal.hidden, rect: rect(modal), opacity: getComputedStyle(modal).opacity} : null, ancestors,
     focus: document.activeElement?.outerHTML.slice(0, 300),
     nav: [...document.querySelectorAll('.easyedu-navigation, #page-header, .local-course-banner-builder-native-shell')].map(e =>
      ({...describe(e), children: [...e.children].map(child=>
       ({...describe(child), children: [...child.children].map(describe)}))}))};
   };
   window.k23 = {frames: [], events: []};
   document.addEventListener('fullscreenchange', ()=>window.k23.events.push({type: 'fullscreenchange', snap: window.k23snap()}));
   document.addEventListener('click', e=>{
    if (!e.target.closest('[data-easyedu-guide-close]')) {
 return;
}
    const begin = performance.now(); window.k23.frames = [];
    const sample = ()=>{
 window.k23.frames.push(window.k23snap()); if (performance.now() - begin < 1200) {
 requestAnimationFrame(sample);
}
};
    sample(); requestAnimationFrame(sample);
   }, true);
  });
  const page = await context.newPage(); page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(180000);
  page.on('pageerror', e=>report.errors.push({phase: report.phase, message: e.message}));
  page.on('console', e=>{
 if (e.type() === 'error') {
 report.console.push({phase: report.phase, text: e.text()});
}
});
  for (const lang of locales.split(',')) {
   report.phase = `${lang}-load`; save();
   await page.goto(`${base}/local/groupimport/manage.php?id=${course}&lang=${lang}`, {waitUntil: 'domcontentloaded'});
   if (await page.locator('#username').count()) {
    await page.locator('#username').fill(process.env.EASYEDU_TEACHER_USERNAME);
    await page.locator('input[type=password]').first().fill(process.env.EASYEDU_TEACHER_PASSWORD);
    await Promise.all([page.waitForURL(u=>!u.pathname.includes('/login/'), {waitUntil: 'commit'}),
     page.locator('#loginbtn').click()]);
    await page.waitForLoadState('domcontentloaded');
    await page.goto(`${base}/local/groupimport/manage.php?id=${course}&lang=${lang}`, {waitUntil: 'domcontentloaded'});
   }
   await page.waitForFunction(()=>document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState === 'ready',
    null, {timeout: 240000});
   await wait(1200);
   const tour = page.locator('[data-role="flexitour-step"] [data-role="end"]:visible'); if (await tour.count()) {
 await tour.click();
}
   for (const mode of ['simple', 'external']) {
    report.phase = `${lang}-${mode}`; save();
    const row = {lang, mode, before: await page.evaluate(()=>window.k23snap())}; report.cases.push(row);
    if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
 await page.locator('[data-easyedu-navigation-open]:visible').first().click();
}
    await page.locator('[data-easyedu-guide-open]:visible').first().click();
    await page.locator('[data-easyedu-guide-modal]:visible').waitFor(); await wait(600);
    row.open = await page.evaluate(()=>window.k23snap());
    if (mode === 'external') {
     await page.locator('[data-easyedu-guide-fullscreen]:visible').click();
     await page.waitForFunction(()=>!!document.fullscreenElement); await wait(500);
     row.native = await page.evaluate(()=>window.k23snap());
     await page.evaluate(()=>document.exitFullscreen());
    }
    await page.locator('[data-easyedu-guide-close]:visible').first().click();
    await wait(1500);
    row.after = await page.evaluate(()=>window.k23snap());
    row.probe = await page.evaluate(()=>window.k23);
    const tops = row.probe.frames.map(f=>f.panel?.y).filter(v=>v !== undefined);
    let last = -Infinity;
    row.samples40 = row.probe.frames.filter(f=>{
 if (f.t - last < 39) {
 return false;
} last = f.t; return true;
});
    row.measure = {frames: tops.length, topMin: Math.min(...tops), topMax: Math.max(...tops),
     jump: Math.max(...tops) - Math.min(...tops), delta: row.after.panel.y - row.before.panel.y,
     hiddenWhileParked: row.probe.frames.filter(f=>f.modal.hidden && f.parked.length).length};
    row.localeConfirmed = lang === 'fr' ? row.open.next?.includes('Suivant') : row.open.next?.includes('Next');
    row.pass = row.localeConfirmed && row.samples40.length >= 10 && row.measure.jump === 0 && row.measure.delta === 0 &&
     row.measure.hiddenWhileParked === 0 && row.after.modal.hidden;
    if (!row.pass) {
 process.exitCode = 1;
}
    save(); await page.screenshot({path: `${out}/${label}-${lang}-${mode}.png`});
   }
  }
  await context.close();
 } catch (e) {
 report.failure = {phase: report.phase, message: e.message, stack: e.stack}; process.exitCode = 1;
} finally {
 if (browser) {
 await browser.close();
 }
 save();
 process.stdout.write(JSON.stringify({label, cases: report.cases.map(c=>({lang: c.lang, mode: c.mode, measure: c.measure})),
  replaced: report.replaced, errors: report.errors, console: report.console, failure: report.failure}) + '\n');
}
})();
