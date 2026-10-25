const {
  test,
  expect,
  chromium
} = require('@playwright/test');

const fs = require('node:fs'),
      cp = require('node:child_process');

test('K25-01 participant collapsed native matrix', async () => {
  test.setTimeout(1200000);
  const out = process.env.K2501_ARTIFACT_ROOT,
        phase = process.env.K2501_PHASE || 'after-final';
  const result = {
    rows: [],
    errors: []
  };

  const save = () => fs.writeFileSync(out + '/' + phase + '.json', JSON.stringify(result, null, 2));

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.K2501_CHROME
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1600,
        height: 1100
      }
    });
    page.setDefaultTimeout(25000);
    page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', e => result.errors.push({
      message: e.message,
      stack: e.stack
    }));
    const base = new URL(process.env.EASYEDU_MOODLE_URL).origin;
    await page.goto(base + '/login/index.php', {
      waitUntil: 'domcontentloaded'
    });
    await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
    await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
    await Promise.all([page.waitForURL(u => !u.pathname.includes('/login/')), page.locator('#loginbtn').click()]);

    const capture = async (admin, width, mode) => {
      await page.waitForTimeout(600);
      const data = await page.evaluate(async () => {
        const root = document.querySelector('#local-groupimport-easystud'),
              model = await new Promise(resolve => require(['local_groupimport/local/cm/state'], s => resolve(s.getOnDemandModel(root))));
        const cards = [...root.querySelectorAll('[data-easystud-participant-list] > [data-easystud-user]')];

        const rect = e => {
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            height: r.height,
            width: r.width
          };
        };

        const insets = e => {
          const s = getComputedStyle(e);
          return ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((n, p) => n + (parseFloat(s[p]) || 0), 0);
        };

        const records = cards.map((c, index) => {
          const meta = c.querySelector('[data-easystud-user-meta]'),
                name = c.querySelector('.local-groupimport-easystud-user__name'),
                email = c.querySelector('.local-groupimport-easystud-user__email');
          const groups = [...c.querySelectorAll('[data-easystud-participant-memberships="groups"]')];
          return {
            index,
            selected: c.classList.contains('is-selected'),
            densityExpanded: c.classList.contains('is-density-expanded'),
            metaHidden: meta.hidden,
            metaPainted: meta.checkVisibility(),
            metaDisplay: getComputedStyle(meta).display,
            metaBox: rect(meta),
            cardBox: rect(c),
            nameBox: rect(name),
            emailBox: rect(email),
            groups: groups.map(g => ({
              painted: g.checkVisibility(),
              display: getComputedStyle(g).display,
              box: rect(g)
            })),
            metadataCount: meta.children.length,
            nameInsets: insets(name),
            emailInsets: insets(email),
            nameLineHeight: parseFloat(getComputedStyle(name).lineHeight),
            emailLineHeight: parseFloat(getComputedStyle(email).lineHeight),
            headlineRows: getComputedStyle(c.querySelector('.local-groupimport-easystud-user__headline')).gridTemplateRows
          };
        });
        const m = cards.find(c => c.querySelector('[data-easystud-participant-memberships="groups"]'))?.querySelector('[data-easystud-user-meta]');
        const rules = [];

        const visit = rs => {
          for (const r of rs) {
            if (r.media && !matchMedia(r.conditionText).matches) continue;
            if (r.selectorText && r.style?.display && m?.matches(r.selectorText)) rules.push({
              selector: r.selectorText,
              display: r.style.display,
              priority: r.style.getPropertyPriority('display')
            });
            if (r.cssRules) visit(r.cssRules);
          }
        };

        for (const sheet of document.styleSheets) {
          try {
            visit(sheet.cssRules);
          } catch {}
        }

        return {
          adminValue: model.strings.metacollapsedbydefault,
          override: model.metaExpandedOverride,
          compactClass: root.classList.contains('local-groupimport-easystud--compact-users'),
          responsive: root.classList.contains('local-groupimport-easystud--responsive-workspace'),
          pressed: root.querySelector('[data-easystud-density-toggle]').getAttribute('aria-pressed'),
          cards: records,
          rules
        };
      });
      result.rows.push({
        admin,
        width,
        mode,
        ...data
      });
      save();

      if (phase.startsWith('after')) {
        const compact = mode === 'compact' || mode === 'resized-compact' || mode === 'deselected' || mode === 'multiple' || mode === 'paged' || mode === 'initial' && admin === 1;
        if (mode === 'multiple') expect(data.cards.filter(c => c.selected)).toHaveLength(2);

        if (mode !== 'selected') {
          expect(data.pressed).toBe(compact ? 'true' : 'false');
          expect(data.cards.every(c => !c.selected || mode === 'multiple')).toBe(true);

          if (compact) {
            for (const c of data.cards) {
              expect(c.metaHidden).toBe(true);
              expect(c.metaPainted).toBe(false);
              expect(c.groups.every(g => !g.painted)).toBe(true);
              expect(c.nameBox.height).toBeLessThanOrEqual(c.nameLineHeight + c.nameInsets + 0.5);
              expect(c.emailBox.height).toBeLessThanOrEqual(c.emailLineHeight + c.emailInsets + 0.5);
              expect(c.nameBox.top).toBeLessThan(c.emailBox.top + c.emailBox.height);
              expect(c.emailBox.top).toBeLessThan(c.nameBox.top + c.nameBox.height);
              expect(c.headlineRows.trim().split(/\s+/)).toHaveLength(1);
            }
          } else {
            expect(data.cards.every(c => !c.metaHidden)).toBe(true);
            expect(data.cards.some(c => c.groups.some(g => g.painted))).toBe(true);
          }
        } else {
          expect(data.cards.filter(c => c.selected)).toHaveLength(1);
          expect(data.cards.find(c => c.selected).metaPainted).toBe(true);
          expect(data.cards.filter(c => !c.selected).every(c => c.metaHidden && !c.metaPainted && c.groups.every(g => !g.painted))).toBe(true);
        }
      }

      await page.screenshot({
        path: out + '/' + phase + '-a' + admin + '-' + width + '-' + mode + '.png'
      });
      return data;
    };

    const setDensity = async compact => {
      const b = page.locator('[data-easystud-density-toggle]').first();
      if ((await b.getAttribute('aria-pressed')) === 'true' === compact) return;
      const proxy = page.locator('[data-easystud-mobile-membership-toggle]:visible').first();

      if (!(await b.isVisible()) && (await proxy.count())) {
        await proxy.click();
      } else {
        if (!(await b.isVisible())) await page.locator('[data-easystud-panel-actions-toggle]:visible').first().click();
        await b.click();
      }

      await page.waitForTimeout(1000);
    };

    for (const admin of [1, 0]) {
      cp.execFileSync(process.env.K2501_PHP, [out + '/config-fixture.php', 'set', String(admin)], {
        timeout: 120000
      });
      cp.execFileSync(process.env.K2501_PHP, [process.env.K2501_PURGE, process.env.K2501_CONFIG, '8052'], {
        timeout: 120000
      });

      for (const width of [1600, 390]) {
        await page.setViewportSize({
          width,
          height: 1100
        });
        await page.goto(base + '/local/groupimport/manage.php?id=71&lang=en', {
          waitUntil: 'domcontentloaded'
        });
        await page.locator('#local-groupimport-easystud[data-easystud-loading-state="ready"]').waitFor({
          timeout: 120000
        });
        await page.waitForTimeout(1200);
        const tour = page.locator('[data-role="end"]:visible').first();
        if (await tour.count()) await tour.click();
        const w = page.locator('[data-easyedu-guide-welcome-dismiss]:visible').first();
        if (await w.count()) await w.click();
        const mode = page.locator('[data-easystud-layout-mode="participants"]:visible');
        if (await mode.count()) await mode.first().click();
        await capture(admin, width, 'initial');
        await setDensity(false);
        await capture(admin, width, 'full');
        await setDensity(true);
        await capture(admin, width, 'compact');

        if (phase.startsWith('after')) {
          const cards = page.locator('[data-easystud-participant-list] > [data-easystud-user]');
          const first = cards.filter({
            has: page.locator('[data-easystud-participant-memberships="groups"]')
          }).first();
          const checkbox = first.locator('[data-easystud-selector-input]');
          await checkbox.check();
          await page.waitForTimeout(900);
          await capture(admin, width, 'selected');
          const second = cards.filter({
            has: page.locator('[data-easystud-participant-memberships="groups"]')
          }).nth(1).locator('[data-easystud-selector-input]');
          await second.check();
          await page.waitForTimeout(900);
          await capture(admin, width, 'multiple');
          await second.uncheck();
          await checkbox.uncheck();
          await page.waitForTimeout(900);
          await capture(admin, width, 'deselected');
          const next = page.locator('[data-easystud-participant-list]').locator('..').locator('[data-easystud-page-next]:visible').first();
          await next.click();
          await page.waitForTimeout(900);
          await capture(admin, width, 'paged');
          const otherWidth = width === 1600 ? 390 : 1600;
          await page.setViewportSize({
            width: otherWidth,
            height: 1100
          });
          await page.waitForTimeout(1200);
          await capture(admin, otherWidth, 'resized-compact');
          await setDensity(false);
          await capture(admin, otherWidth, 'resized-full');
          await page.setViewportSize({
            width,
            height: 1100
          });
          await page.waitForTimeout(1200);
          await capture(admin, width, 'returned-full');
        }
      }
    }
  } catch (e) {
    result.failure = e.message;
    save();
    throw e;
  } finally {
    save();
    await browser.close();
  }
});
