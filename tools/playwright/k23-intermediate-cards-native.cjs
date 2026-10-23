'use strict'; // Prepared test course required; no business operation is submitted.

const assert = require('node:assert/strict');

const fs = require('node:fs');

const path = require('node:path');

const {
  chromium
} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const out = process.env.EASYSTUD_ARTIFACTS,
      base = process.env.EASYSTUD_BASE_URL,
      course = process.env.EASYSTUD_COURSE_ID,
      label = process.argv[2] || 'native';
if (!out || !path.isAbsolute(out) || !base || !course || !process.env.MOODLE_TEST_USER || !process.env.MOODLE_TEST_PASSWORD) throw Error('Set EASYSTUD_ARTIFACTS (absolute), EASYSTUD_BASE_URL, EASYSTUD_COURSE_ID and MOODLE_TEST_USER/PASSWORD');
fs.mkdirSync(out, {
  recursive: true
});
const report = {
  label,
  base,
  course,
  cases: [],
  errors: [],
  console: []
};

const save = () => fs.writeFileSync(out + '/audit-' + label + '.json', JSON.stringify(report, null, 2));

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROME_PATH ? {
        executablePath: process.env.CHROME_PATH
      } : {})
    });
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: {
        width: 1600,
        height: 1000
      }
    }),
          page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(180000);
    page.on('pageerror', e => {
      report.errors.push({
        phase: report.phase,
        message: e.message,
        stack: e.stack
      });
      save();
    });
    page.on('console', e => {
      if (e.type() === 'error') report.console.push({
        text: e.text(),
        location: e.location()
      });
    });

    const dismiss = async () => {
      const later = page.locator('[data-easyedu-guide-welcome-dismiss]:visible');

      if (await later.count()) {
        await later.click();
        await wait(450);
      }

      for (const e of await page.locator('.drawer.show [data-action="closedrawer"]:visible').all()) {
        await e.click();
        await wait(400);
      }
    };

    const measure = () => page.evaluate(() => {
      const visible = e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && e.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true
        });
      };

      const rect = e => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          right: r.right,
          bottom: r.bottom
        };
      };

      const root = document.querySelector('#local-groupimport-easystud');
      const fields = [...root.querySelectorAll('.easyedu-search-field')].filter(visible).map(e => {
        const r = rect(e),
              i = e.querySelector('.fa'),
              input = e.querySelector('input'),
              parent = e.parentElement;
        const cancel = parent.querySelector('[data-easystud-container-search-cancel],[data-easystud-group-member-search-cancel]');
        const ir = i ? rect(i) : null,
              cr = cancel && visible(cancel) ? rect(cancel) : null;
        return {
          class: e.className,
          field: r,
          icon: ir,
          input: input ? rect(input) : null,
      cancel: cr,
      cancelStyle: cr ? (() => {
        const s = getComputedStyle(cancel);
        return {fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight,
          padding: s.padding, borderRadius: s.borderRadius, color: s.color, background: s.backgroundColor};
      })() : null,
          iconInside: !ir || ir.x >= r.x - .5 && ir.right <= r.right + .5,
          insideParent: r.x >= rect(parent).x - .5 && r.right <= rect(parent).right + .5,
          inputWidth: input ? input.getBoundingClientRect().width : null,
          cancelOverlap: cr ? Math.max(0, Math.min(r.right, cr.right) - Math.max(r.x, cr.x)) : 0
        };
      });
      const cards = [...root.querySelectorAll('.local-groupimport-easystud-user,[data-easystud-group-id],[data-easystud-grouping-id]')].filter(visible).slice(0, 30).map(e => {
        const r = rect(e);
        const controls = [...e.querySelectorAll(':scope > .local-groupimport-easystud-group__header > button,:scope > .local-groupimport-easystud-grouping__header > button,:scope > .local-groupimport-easystud-user__actions button')].filter(visible).map(b => ({
          cls: b.className,
          r: rect(b),
          outside: rect(b).x < r.x - .5 || rect(b).right > r.right + .5
        }));
        return {
          type: e.dataset.selectableType,
          r,
          controls
        };
      });
      const inputs = [...root.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(visible).map(e => ({
        cls: e.className,
        r: rect(e),
        parent: rect(e.parentElement)
      }));
      return {
        fields,
        cards,
        inputs,
        root: rect(root),
        overflow: root.scrollWidth - root.clientWidth,
        bodyOverflow: document.documentElement.scrollWidth - innerWidth
      };
    });

    const openAction = async (card, selector, contextAction) => {
      await card.hover();
      await wait(120);
      const direct = card.locator(selector + ':visible').first();

      if (await direct.count()) {
        await direct.click();
        return;
      }

      const menu = card.locator(':scope > .local-groupimport-easystud-group__header > [data-easystud-group-actions-toggle]:visible,:scope > .local-groupimport-easystud-grouping__header > [data-easystud-group-actions-toggle]:visible').first();
      await menu.click();
      await wait(450);
      const contextItem = page.locator('[data-easystud-context-action="' + contextAction + '"]:visible').first();

      if (await contextItem.count()) {
        await contextItem.click();
        return;
      }

      await card.locator('[data-easystud-group-actions-menu] ' + selector + ':visible').first().click();
    };

    const paintedCard = async selector => {
      const cards = page.locator(selector);

      for (let i = 0; i < (await cards.count()); i++) {
        if (await cards.nth(i).evaluate(e => e.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true
        }))) return cards.nth(i);
      }

      return page.locator('[data-no-such-k23-card]');
    };

    for (const lang of (process.env.EASYSTUD_LANGUAGES || 'fr,en').split(',')) {
      report.phase = lang + ' load';
      save();
      await page.goto(base + '/local/groupimport/manage.php?id=' + course + '&lang=' + lang, {
        waitUntil: 'domcontentloaded'
      });

      if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.MOODLE_TEST_USER);
        await page.locator('#login input[type=password]').fill(process.env.MOODLE_TEST_PASSWORD);
        await Promise.all([page.waitForURL(u => !u.pathname.includes('/login/'), {
          waitUntil: 'commit'
        }), page.locator('#loginbtn').click({
          noWaitAfter: true
        })]);
      }

      report.phase = lang + ' awaiting ready';
      report.url = page.url();
      save();
      await page.waitForFunction(() => document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState === 'ready', null, {
        timeout: 240000
      });
      report.phase = lang + ' awaiting load';
      save();
      await page.waitForLoadState('load');
      await dismiss();
      const full = page.locator('[data-easystud-layout-mode="both"]:visible');

      if (await full.count()) {
        await full.first().click();
        await wait(500);
      }

      const widths = process.env.EASYSTUD_WIDTHS ? process.env.EASYSTUD_WIDTHS.split(',').map(Number) : [1600, 1400, 1300, 1200, 1100, 1050, 1000, 950, 900, 850, 800, 768, 750, 700, 650, 600, 390];

      for (const width of widths) {
        await page.setViewportSize({
          width,
          height: 1000
        });
        await wait(650);
        await dismiss();

        if (process.env.EASYSTUD_DRAWERS && width > 1024) {
          for (const side of ['left', 'right']) {
            const toggle = page.locator('.drawer-' + side + '-toggle button:visible').first();

            if (await toggle.count()) {
              await toggle.click();
              await wait(500);
            }
          }
        }

        for (const view of ['participants', 'groups', 'groupings']) {
          report.phase = lang + ' ' + width + ' ' + view;
          save();
          const mode = page.locator('[data-easystud-layout-mode="' + {
            participants: 'both',
            groups: 'participants',
            groupings: 'structure'
          }[view] + '"]:visible');

          if (await mode.count()) {
            await mode.first().click();
            await wait(400);
          }

          const tab = page.locator('[data-easystud-mobile-view="' + view + '"]:visible');

          if (await tab.count()) {
            await tab.first().click();
            await wait(450);
          }

          const disclosure = page.locator('[data-easystud-grouping-id] [data-easystud-collapse-toggle][aria-expanded="false"]:visible');

          if (view === 'groupings' && (await disclosure.count())) {
            await disclosure.first().click();
            await wait(450);
          }

          const row = {
            lang,
            width,
            view,
            normal: await measure(),
            interactions: []
          };
          report.cases.push(row);
          save();
          const filter = page.locator('[data-easystud-advanced-filters-toggle]:visible').first();

          if (view === 'participants' && (await filter.count()) && (await filter.getAttribute('aria-expanded')) !== 'true') {
            await filter.click();
            await wait(500);
            row.filters = await measure();
            await filter.click();
            await wait(450);
          }

          if (view !== 'participants') {
            const card = await paintedCard(view === 'groups' ? '[data-easystud-group-id]:visible' : '[data-easystud-grouping-id]:visible');

            if (await card.count()) {
              try {
                if (!(await card.locator('[data-easystud-group-member-search-cancel]:visible,[data-easystud-container-search-cancel]:visible').count())) await openAction(card, view === 'groups' ? '[data-easystud-group-member-search-toggle]' : '[data-easystud-container-search-toggle]', view === 'groups' ? 'group-search-members' : 'grouping-search-groups');
                await wait(500);
                row.search = await measure();
                if (lang === 'en' && [1100, 390].includes(width)) await page.screenshot({
                  path: out + '/' + label + '-search-' + view + '-' + width + '.png'
                });
                const cancel = card.locator('[data-easystud-group-member-search-cancel]:visible,[data-easystud-container-search-cancel]:visible').first();
                await cancel.click();
                await wait(450);
                row.interactions.push('search/cancel');
                await openAction(card, '[data-easystud-rename-toggle]', view === 'groups' ? 'group-focus-rename' : 'grouping-focus-rename');
                await wait(400);
                row.rename = await card.locator('[data-easystud-rename-form]').first().evaluate(e => {
                  const r = e.getBoundingClientRect(),
                        p = e.closest('[data-easystud-group-id],[data-easystud-grouping-id]').getBoundingClientRect(),
                        save = e.querySelector('.local-groupimport-easystud-rename__save');
                  return {
                    width: r.width,
                    cardWidth: p.width,
                    overflow: Math.max(0, r.right - p.right),
                    saveIcon: save.querySelector('.fa').className,
                saveFrame: {width: save.getBoundingClientRect().width, height: save.getBoundingClientRect().height},
                savePaint: (() => {
                  const icon=save.querySelector('.fa'), bounds=icon.getBoundingClientRect(), frame=save.getBoundingClientRect(), style=getComputedStyle(icon);
                  return {width:bounds.width,height:bounds.height,dx:bounds.x+bounds.width/2-frame.x-frame.width/2,dy:bounds.y+bounds.height/2-frame.y-frame.height/2,fill:style.backgroundColor,mask:style.maskImage};
                })()
                  };
                });
                if(process.env.EASYSTUD_CAPTURE_EDITORS)await page.screenshot({path:out+'/'+label+'-rename-'+view+'-'+lang+'-'+width+'.png'});
            await card.locator('[data-easystud-rename-cancel]:visible').click();
                await wait(350);
                row.interactions.push('rename/cancel');
              } catch (e) {
                row.interactionFailure = e.message;
                await page.keyboard.press('Escape');
                await wait(300);
              }
            }
          }

          save();
        }
      }
    }

    assert.equal(report.errors.length, 0, 'No JS exception');

    for (const row of report.cases) {
      assert.ok(!row.interactionFailure, JSON.stringify({
        lang: row.lang,
        width: row.width,
        view: row.view,
        error: row.interactionFailure
      }));

      if (row.view !== 'participants') {
        assert.ok(row.search && row.rename, 'Prepared course must expose a Group and a Grouping');
      }

      for (const stage of ['normal', 'search', 'filters']) for (const field of row[stage]?.fields || []) {
        if (field.cancelStyle) {
          assert.equal(parseFloat(field.cancelStyle.fontSize), 12, 'Search Cancel consumes compact Kit typography');
          assert.equal(parseFloat(field.cancelStyle.borderRadius), 8, 'Search Cancel consumes compact Kit radius');
        }
        assert.ok(field.iconInside && field.insideParent && field.cancelOverlap <= 0.5 && field.inputWidth > 0, JSON.stringify({
          lang: row.lang,
          width: row.width,
          view: row.view,
          field
        }));
      }

      if (row.rename) {
        assert.ok(row.rename.overflow <= 0.5 && row.rename.saveIcon.includes('fa-save'), 'Contained Save editor');
        const paint = row.rename.savePaint;
        assert.ok(Math.abs(paint.width - 16) <= 0.5 && Math.abs(paint.height - 16) <= 0.5 &&
          Math.abs(paint.dx) <= 0.5 && Math.abs(paint.dy) <= 0.5 && paint.mask !== 'none', 'Centred Save ink');
      }

      for (const card of row.normal.cards) assert.ok(card.controls.every(c => !c.outside), 'Header actions fit their card');
    }
  } catch (e) {
    report.failure = {
      phase: report.phase,
      message: e.message,
      stack: e.stack
    };
    process.exitCode = 1;
  } finally {
    save();
    if (browser) await browser.close();
    console.log(JSON.stringify({
      cases: report.cases.length,
      errors: report.errors.length,
      failure: report.failure
    }));
  }
})();
