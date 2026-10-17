const {test}=require('@playwright/test');
const run=require('./guide-refonte-native-helper.cjs');
test('Guide refonte pilot FR390 three motion levels native',async({page,browser},info)=>run({page,browser},info,[['fr',390]]));
