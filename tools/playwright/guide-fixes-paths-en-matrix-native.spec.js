const {test}=require('@playwright/test');
const run=require('./guide-fixes-paths-matrix-helper.cjs');
test('Guide fixes EN paths matrix native',async({page,browser},info)=>run({page,browser},info,[['en',1600],['en',1280],['en',768],['en',390]]));
