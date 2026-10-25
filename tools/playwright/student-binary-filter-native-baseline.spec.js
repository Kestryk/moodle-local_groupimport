const {test,expect}=require('@playwright/test'),fs=require('node:fs');

// SM-43B diagnostic baseline: client-side filter + Reset only; no data fixture.
test('Binary catalogue filter baseline records native toggle Reset and spacing',async({page},testInfo)=>{
  test.setTimeout(240000);
  const root=page.locator('#local-groupimport-easystud'),records=[],errors=[],blocked=[];
  const guard=async route=>{
    if(route.request().method()==='GET')await route.continue();
    else{blocked.push(route.request().method());await route.abort('blockedbyclient');}
  };
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  try{
    for(const width of [1600,768,390]){
      await page.unroute('**/local/groupimport/**',guard).catch(()=>undefined);
      await page.setViewportSize({width,height:1100});await page.goto(process.env.EASYEDU_MOODLE_URL);
      if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
      }
      await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
      await page.route('**/local/groupimport/**',guard);
      for(const [mode,key,catalogue]of width>1024?
        [['participants','participant-groups','participants'],['structure','structure-groups','structure']]:
        [['groups','structure-groups','structure']]){
        await root.locator(width>1024?`[data-easystud-layout-mode="${mode}"]:visible`:
          `[data-easystud-mobile-view="${mode}"]:visible`).click();
        const more=root.locator(`[data-easystud-advanced-filters-toggle="${key}"]`);
        const panel=root.locator(`[data-easystud-advanced-filters="${key}"]`);
        if(await more.getAttribute('aria-expanded')!=='true')await more.click();
        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
        const input=panel.locator(`[data-easystud-catalog-show-ungrouped="${catalogue}"]`),
          label=input.locator('..'),reset=panel.locator(`[data-easystud-reset-catalog-filters="${catalogue}"]`);
        await expect(input).not.toBeChecked();await label.click();await expect(input).toBeChecked();
        await expect(reset).toBeVisible();await page.waitForTimeout(180);
        const paint=await label.evaluate(n=>{
          const s=getComputedStyle(n),r=n.getBoundingClientRect(),span=n.querySelector('span'),
            track=getComputedStyle(span,'::before'),thumb=getComputedStyle(span,'::after'),
            buttons=n.parentElement.querySelector('[data-easystud-reset-catalog-filters]'),
            b=buttons.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect();
          return {font:s.fontSize,weight:s.fontWeight,background:s.backgroundColor,width:r.width,height:r.height,
            parentWidth:p.width,trackWidth:track.width,trackHeight:track.height,thumbWidth:thumb.width,
            labelIndent:getComputedStyle(span).paddingInlineStart,resetWidth:b.width,resetHeight:b.height,
            resetGap:b.left-r.right,resetDeltaY:b.top-r.top};
        });
        await panel.locator('..').screenshot({path:testInfo.outputPath(`binary-filter-${width}-${catalogue}.png`)});
        await reset.click();await expect(input).not.toBeChecked();
        records.push({width,mode,key,catalogue,paint,resetWorks:true});
        await more.click();await expect(more).toHaveAttribute('aria-expanded','false');
        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
      }
    }
    expect(errors).toEqual([]);expect(blocked).toEqual([]);
  }finally{
    fs.writeFileSync(testInfo.outputPath('binary-filter-native-baseline.json'),JSON.stringify({records,errors,blocked},null,2));
  }
});
