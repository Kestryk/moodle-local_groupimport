const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
test('Kevin unchanged preview audit zero failures', async({}, info) => {
    test.setTimeout(750000);
    if (new URL(process.env.EASYEDU_MOODLE_URL).origin !== 'http://localhost') throw Error('Principal only');
    const secret = info.outputPath('audit-admin.secret');
    let stdout;
    try {
        fs.writeFileSync(secret, process.env.EASYEDU_MOODLE_PASSWORD, {mode:0o600});
        stdout = execFileSync(process.execPath, ['C:/dev/tools/codex-relay/audit-preview.cjs',
            require.resolve('playwright'), secret, '5'], {encoding:'utf8', timeout:650000});
        fs.writeFileSync(info.outputPath('kevin-audit.log'), stdout);
    } finally {if (fs.existsSync(secret)) fs.unlinkSync(secret);}
    const result = stdout.match(/C:\\dev\\tools\\codex-relay\\logs\\audit-[\w.-]+\.json/);
    expect(result).not.toBeNull();
    const rows = JSON.parse(fs.readFileSync(result[0], 'utf8'));
    fs.writeFileSync(info.outputPath('kevin-audit.json'), JSON.stringify(rows,null,2));
    expect(rows.filter(r => r.status === 'FAIL')).toEqual([]);
});
