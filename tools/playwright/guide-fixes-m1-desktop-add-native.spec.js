const {test}=require('@playwright/test');
const run=require('./guide-fixes-demos-m1-add-helper.cjs');
test('Guide fixes M1 desktop Add phases native',async({page,browser},info)=>run({page,browser},info,[['fr',1600],['fr',1280],['en',1600],['en',1280]],['reduced','minimal']));
