const base = require('./playwright.config.js');

module.exports = {
    ...base,
    testDir: __dirname,
    testMatch: 'easystud-design-system-visual-evidence.spec.js',
    workers: 1,
};
