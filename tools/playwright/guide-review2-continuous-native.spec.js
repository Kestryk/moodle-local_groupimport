const {test} = require('@playwright/test');
const {exerciseReview2} = require('./guide-review2-continuous-native-helper.cjs');
test('review2 continuous dialog cursor copy and resize in actual Moodle', async ({page}, info) => {
    test.setTimeout(1100000);
    await exerciseReview2({page}, info, 'after');
});
