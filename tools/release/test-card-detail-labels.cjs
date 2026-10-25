/* eslint-env node */
// Execute the current PHP menu builder with the real EN/FR language files.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const php = process.argv[2] || 'php';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const script = `
define('MOODLE_INTERNAL', true);
function get_string($key, $component = '', $a = null) {
    global $string;
    return $component === 'local_groupimport' ? ($string[$key] ?? $key) : $key;
}
require $argv[1] . '/classes/output/context_actions.php';
$output = [];
foreach (['en', 'fr'] as $locale) {
    $string = [];
    require $argv[1] . '/lang/' . $locale . '/local_groupimport.php';
    $output[$locale] = ['strings' => $string,
        'menu' => \\local_groupimport\\output\\context_actions::build_template_data()];
}
echo json_encode($output, JSON_UNESCAPED_UNICODE);
`;
const data = JSON.parse(execFileSync(php, ['-r', script, root], {encoding: 'utf8'}));
const expected = {
    en: ['Group details', 'Grouping details', 'Participant details'],
    fr: ['Détails du groupe', 'Détails du groupement', 'Détails du participant']
};
const actions = ['group-open-advanced-settings', 'grouping-open-advanced-settings', 'participant-open-details'];
const keys = ['groupdetails', 'groupingdetails', 'viewparticipantdetails'];
const source = read('amd/src/local/cm/group_cards.js');
const start = source.indexOf('export const createIconActionButton =');
const end = source.indexOf('// K22-16:', start);
assert.ok(start >= 0 && end > start);
for (const [locale, labels] of Object.entries(expected)) {
    for (let index = 0; index < actions.length; index++) {
        const items = data[locale].menu.filter(entry => entry.isitem && entry.item.action === actions[index]);
        assert.equal(items.length, 1, locale + ' unique menu command ' + actions[index]);
        assert.equal(items[0].item.label, labels[index]);
        assert.equal(data[locale].strings[keys[index]], labels[index]);
    }
    const buttons = [];
    const card = kind => ({getAttribute: () => '42', querySelector: () => ({
        querySelector: selector => selector.includes('rename') ? {} : null,
        insertBefore: button => buttons.push({kind, button})
    })});
    const sandbox = {
        getLabels: () => data[locale].strings,
        escapeHtml: value => value,
        document: {createElement: () => ({attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }})}
    };
    vm.runInNewContext(source.slice(start, end).replace(/export const /g, 'const ') +
        '\nthis.ensure = ensureAdvancedSettingsButtons;', sandbox);
    sandbox.ensure({querySelectorAll: selector => [card(selector.includes('grouping-id') ? 'grouping' : 'group')]});
    assert.equal(buttons.length, 2);
    for (const {kind, button} of buttons) {
        const text = labels[kind === 'group' ? 0 : 1];
        assert.equal(button.attributes['aria-label'], text);
        assert.equal(button.attributes['data-easystud-hover-help'], text);
    }
}
assert.ok(read('manage.php').includes("'viewdetailslabel' => get_string('viewparticipantdetails', 'local_groupimport')"));
assert.ok(read('templates/sm/participant_card.mustache').includes('aria-label="{{viewdetailslabel}}"'));
assert.ok(read('templates/sm/participant_card.mustache').includes('data-easystud-hover-help="{{viewdetailslabel}}"'));
assert.ok(!source.includes("labels.advancedsettings || ''"));
console.log('PASS real EN/FR PHP menu labels, unique commands, both direct-button ARIA/help paths and participant transport.');