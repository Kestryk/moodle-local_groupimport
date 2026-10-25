const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

test('Post-I3 original tagged administration choices contract', async() => {
    test.setTimeout(300000);
    const output = process.env.POST_I3_NATIVE_OUTPUT;
    const lease = process.env.POST_I3_NATIVE_LEASE;
    expect(output && lease).toBeTruthy();
    fs.mkdirSync(output, {recursive: true});
    const file = path.resolve(__dirname, '../release/test-admin-tagged-choices-native.cjs');
    const args = [file, require.resolve('playwright'), lease, process.env.EASYEDU_MOODLE_USERNAME,
        '-', path.join(output, 'original-contract')];
    const run = spawnSync(process.execPath, args, {
        encoding: 'utf8', timeout: 280000, maxBuffer: 5e6, env: process.env,
    });
    fs.writeFileSync(path.join(output, 'original-contract.log'), (run.stdout || '') + '\n' + (run.stderr || ''));
    fs.writeFileSync(path.join(output, 'test-result.json'), JSON.stringify({
        name: 'test-admin-tagged-choices-native.cjs',
        status: run.status === 0 ? 'PASS' : run.error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'FAIL',
        exit: run.status, error: run.error?.message,
    }, null, 2));
    expect(run.status, 'Original native assertions; see external original-contract.log').toBe(0);
});
