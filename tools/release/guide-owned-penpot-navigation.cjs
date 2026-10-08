// Bounded navigation of the integrator's existing CDP editor; no browser close.
const {chromium} = require('C:/dev/codex-tools/playwright/node_modules/playwright');
(async() => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9225');
    try {
        const pages = browser.contexts().flatMap(context => context.pages());
        const editor = pages.filter(page => page.url().includes('file-id=b564c72c-f31f-81ec-8008-ad9958b272bd') ||
            page.url().includes('file-id=40e06342-8830-80d6-8008-96572effc11c'));
        if (editor.length !== 1) throw new Error('Expected exactly one owned Guide/Foundations editor');
        if (process.argv[2]) {
            const target = process.argv[2] === 'foundations' ?
                ['40e06342-8830-80d6-8008-96572effc11c', '4ee6f77a-1dfb-809b-8008-c1eac9c6142e'] :
                process.argv[2] === 'guide' ? ['b564c72c-f31f-81ec-8008-ad9958b272bd', 'b564c72c-f31f-81ec-8008-ad9958b272be'] : null;
            if (!target) throw new Error('Only Guide or Foundations is in scope');
            const url = editor[0].url().replace(/file-id=[^&]+/, 'file-id=' + target[0]).replace(/page-id=[^&]+/, 'page-id=' + target[1]);
            await editor[0].goto(url);
        }
        console.log(JSON.stringify({url: editor[0].url(), otherTabsUntouched: true}));
        for (const frame of editor[0].frames()) {
            console.log(JSON.stringify({frameUrl: frame.url(), text: (await frame.locator('body').innerText().catch(() => '')).slice(-1600)}));
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
