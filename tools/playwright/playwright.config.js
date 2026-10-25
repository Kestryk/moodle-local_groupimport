const {defineConfig} = require('@playwright/test');

// The supervised runner always passes an external --output directory. This
// config owns discovery only, so Playwright resolves the versioned specs from
// this directory instead of its implicit ./tests default.
module.exports = defineConfig({
    testDir: __dirname,
    testMatch: '**/*.spec.js',
    workers: 1,
});
