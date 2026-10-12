const {test} = require('@playwright/test');
const {exerciseChrome} = require('./guide-chrome-native-helper.cjs');
test('Guide reading chrome baseline in actual Moodle', async ({page}, info) => {
    test.setTimeout(360000);
    await exerciseChrome({page}, info, 'baseline');
});
