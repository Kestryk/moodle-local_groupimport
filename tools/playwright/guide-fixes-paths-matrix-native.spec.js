const {test}=require('@playwright/test');
const run=require('./guide-fixes-paths-matrix-helper.cjs');
// FR stage kept below the supervisor's 30 minute ceiling; EN has its own fixture.
test('Guide fixes bilingual paths matrix native',async({page,browser},info)=>run({page,browser},info,[['fr',1600],['fr',1280],['fr',768],['fr',390]]));
