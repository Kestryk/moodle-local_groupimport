const {test} = require('@playwright/test');
const {exerciseReview2} = require('./guide-review2-native-helper.cjs');
test('review2 baseline records clipped native demo copy', async ({page}, info) => {
    test.setTimeout(180000);
    await exerciseReview2({page}, info, 'baseline');
});
