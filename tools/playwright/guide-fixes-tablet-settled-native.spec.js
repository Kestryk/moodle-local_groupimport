const {test}=require('@playwright/test');
const run=require('./guide-fixes-paths-settled-helper.cjs');
test('Guide fixes settled tablet pilot native',async({page,browser},info)=>run({page,browser},info,[['fr',768]],['group','grouping','actions'],['reduced']));
