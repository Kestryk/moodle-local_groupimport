const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
test('Kevin approved regression audit only known group grid failures', async({}, info) => {
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
    const allowed = /^(1600|1280|768|390) groupe \u00ab .+ \u00bb : (cases et ic\u00f4ne vide sur une seule colonne|titre, membres et texte vide sur un seul bord gauche|actions d'en-t\u00eate et \u00ab \u2212 \u00bb sur une seule colonne droite|pastilles et ic\u00f4nes centr\u00e9es sur le titre|chevron et \u00ab Tout s\u00e9lectionner \u00bb sans superposition)$/u;
    const failures = rows.filter(r => r.status === 'FAIL');
    const unexpected = failures.filter(r => !allowed.test(r.check));
    fs.writeFileSync(info.outputPath('approved-regressions-audit-summary.json'), JSON.stringify({
        failures:failures.length, knownGroupGrid:failures.length-unexpected.length, unexpected, originalAudit:result[0]
    },null,2));
    expect(unexpected).toEqual([]);
});
