const {test}=require('@playwright/test');
const run=require('./guide-fixes-paths-settled-helper.cjs');
test('Guide fixes settled EN matrix native',async({page,browser},info)=>run({page,browser},info,[['en',1600],['en',1280],['en',768],['en',390]]));
