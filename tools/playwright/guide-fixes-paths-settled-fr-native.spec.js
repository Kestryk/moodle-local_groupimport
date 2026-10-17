const {test}=require('@playwright/test');
const run=require('./guide-fixes-paths-settled-helper.cjs');
test('Guide fixes settled FR matrix native',async({page,browser},info)=>run({page,browser},info,[['fr',1600],['fr',1280],['fr',768],['fr',390]]));
