const {test}=require('@playwright/test');
const run=require('./guide-fixes-demos-matrix-helper.cjs');
test('Guide fixes bilingual demos matrix native',async({page,browser},info)=>run({page,browser},info,[['fr',1600],['fr',1280],['fr',768],['fr',390],['en',1600],['en',1280],['en',768],['en',390]]));
