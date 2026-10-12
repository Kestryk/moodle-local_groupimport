const {test} = require('@playwright/test');
const {exerciseChrome} = require('./guide-chrome-density-native-helper.cjs');
test('Guide compact progression and footer reading count in actual Moodle', async ({page}, info) => {
    test.setTimeout(360000);
    await exerciseChrome({page}, info, 'after');
});
