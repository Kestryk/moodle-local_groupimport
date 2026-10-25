const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

test('Suite2 existing native contracts with supervised credentials', async() => {
    test.setTimeout(900000);
    const output = process.env.FIXTURES_SUITE2_NATIVE_OUTPUT;
    const lease = JSON.parse(fs.readFileSync(process.env.FIXTURES_SUITE2_NATIVE_LEASE, 'utf8'));
    expect(fs.readFileSync(path.join(lease.lock, 'owner.txt'), 'utf8').trim()).toBe(lease.run);
    expect([8052, 8054, 8055]).toContain(lease.port);
    expect(Boolean(process.env.EASYEDU_MOODLE_USERNAME && process.env.EASYEDU_MOODLE_PASSWORD)).toBe(true);
    const base = 'http://localhost:' + lease.port;
    const pw = require.resolve('playwright');
    const cases = [
        ['test-guide-assignment-native.cjs', [pw, base, '-', path.join(output, 'assignment')]],
        ['test-k21-visual-controls-native.cjs', ['after', 'fr', '1600', 'more', pw, '-',
            path.join(output, 'controls'), base]],
    ];
    fs.mkdirSync(output, {recursive: true});
    const results = [];
    for (const [name, args] of cases) {
        const run = spawnSync(process.execPath, [path.resolve(__dirname, '../release', name), ...args], {
            timeout: 420000, maxBuffer: 5e6, encoding: 'utf8', env: process.env,
        });
        fs.writeFileSync(path.join(output, name + '.log'), (run.stdout || '') + '\n' + (run.stderr || ''));
        results.push({name, args, status: run.status === 0 ? 'PASS' :
            run.error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'FAIL', exit: run.status, replayed: true});
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    }
    expect(results.filter(row => row.status !== 'PASS'), 'Original native assertions, see external logs').toEqual([]);
});
