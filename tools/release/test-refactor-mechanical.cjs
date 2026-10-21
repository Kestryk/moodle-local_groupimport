'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const inventory = require('./lib/php-function-inventory.cjs');
const fixture = require('./lib/refactor-fixture.cjs');
const root = path.resolve(__dirname, '../..');
const [php, output, ref = '2db398f0'] = process.argv.slice(2);
assert.ok(php && output && path.isAbsolute(php) && path.isAbsolute(output), 'Absolute PHP and external evidence paths');
assert.ok(!path.resolve(output).startsWith(root + path.sep), 'Keep evidence outside source');
fs.mkdirSync(output, {recursive: true});
const old = file => execFileSync('git', ['show', ref + ':' + file], {cwd: root, encoding: 'utf8', maxBuffer: 8e6});
const current = file => fs.readFileSync(path.join(root, file), 'utf8');
const results = {};
const outputFiles = ['classes/output/manage_page.php', 'classes/output/guide_config.php',
    'classes/output/context_actions.php'];
const producerSources = {};
for (const variant of ['before', 'after']) {
    const source = file => variant === 'before' ? old(file) : current(file);
    const saved = {};
    for (const file of ['manage.php', 'ajax.php', 'settings.php', 'classes/service/course_state.php',
        'classes/local/move_job.php', ...outputFiles]) {
        saved[file] = path.join(output, variant + '-' + file.replaceAll('/', '-'));
        fs.writeFileSync(saved[file], source(file));
    }
    const manage = inventory(php, saved['manage.php']);
    const progress = inventory(php, saved['classes/local/move_job.php']).progress;
    const state = source('classes/service/course_state.php');
    const stateClass = state.slice(state.indexOf('class course_state {'));
    const ajax = source('ajax.php');
    const marker = "} else if ($action === 'movestatus') {";
    const start = ajax.indexOf(marker) + marker.length;
    const end = ajax.indexOf('\n    } else if', start);
    assert.ok(start >= marker.length && end > start, 'Actual movestatus branch');
    const status = ajax.slice(start, end);
    const classes = [...new Set([...source('settings.php').matchAll(/new (admin_setting\w+)\(/g)].map(m => m[1]))];
    const declarations = classes.map(name => `if (!class_exists('${name}')) { class ${name} extends admin_setting_configtext {} }`).join('\n');
    const functions = Object.values(manage).map(fn => fn.function).join('\n');
    for (const name of ['manage_template_data', 'easyedu_guide_template_data', 'easyedu_guide_js_config',
        'context_actions_template_data']) {
        assert.ok(!manage['local_groupimport_build_' + name], 'Use post-I3 output classes, not retired global builders');
    }
    producerSources[variant] = Object.fromEntries(outputFiles.map(file =>
        [file, require('node:crypto').createHash('sha256').update(source(file)).digest('hex')]));
    const loadOutput = outputFiles.map(file => `require_once(${JSON.stringify(saved[file].replaceAll('\\', '/'))});`)
        .join('\n');
    const program = '<?php\n' + fixture + '\nnamespace local_groupimport\\service {\n' +
        'use local_groupimport\\local\\state_version;\n' + stateClass + '\n}\n' +
        'namespace local_groupimport\\local { class move_job { public static ' + progress.function + '} }\n' +
        'namespace {\n' +
        `$root = ${JSON.stringify(root.replaceAll('\\', '/'))};\n` +
        `spl_autoload_register(static function($class) use ($root) {
            if (str_starts_with($class, 'local_groupimport\\\\')) {
                $file = $root . '/classes/' . str_replace('\\\\', '/', substr($class, 18)) . '.php';
                if (is_file($file)) require_once($file);
            }
        });\nrequire_once($root . '/lib.php');\n` + functions + '\n' + declarations + '\n' + loadOutput + '\n' + String.raw`
        $models = [];
        $storedusers = $users; $storedgroups = $groups; $storedgroupings = $groupings;
        foreach (['en', 'fr'] as $locale) {
            $string = []; require($root . '/lang/' . $locale . '/local_groupimport.php'); $language = $string;
            foreach ([false, true] as $cansee) foreach ([false, true] as $complete) foreach ([false, true] as $populated) {
                $configuration->showcompleteview = $complete ? '1' : '0';
                $users = $populated ? $storedusers : []; $groups = $populated ? $storedgroups : [];
                $groupings = $populated ? $storedgroupings : [];
                $course = (object)['id' => 5]; $context = context_course::instance(5);
                $state = \local_groupimport\service\course_state::build($course, $context);
                $page = \local_groupimport\service\course_state::page_data($course, $context);
                $manage = \local_groupimport\output\manage_page::build_template_data(
                    $course, $page['users'], $page['groups'], $page['groupings'], []);
                $guidejs = \local_groupimport\output\guide_config::build_js_config($course->id);
                $display = new \ReflectionMethod(\local_groupimport\service\course_state::class, 'get_display_settings');
                $display->setAccessible(true); $display = $display->invoke(null, $context);
                if ($display['primary'] !== null) throw new \Exception('Private primary field exposed');
                if (!$cansee && $display['details']) throw new \Exception('Hidden display fields exposed');
                foreach ($state['users'] as $user) if (isset($user['display']['profile_field_private'])) {
                    throw new \Exception('Private profile value exposed');
                }
                $models[$locale . ':' . (int)$cansee . ':' . (int)$complete . ':' . (int)$populated] =
                    ['state' => $state, 'manage' => $manage, 'display' => $display, 'guidejs' => $guidejs];
            }
        }
        $statuses = ['queued', 'running', 'retry', 'completed', 'cancelled', 'failed']; $jobs = [];
        foreach ($statuses as $i => $jobstatus) $jobs[$i + 1] = (object)['id' => $i + 1, 'status' => $jobstatus,
            'courseid' => 5, 'userid' => 2, 'nextitem' => 10, 'total' => 50, 'payload' => str_repeat('x', 200000)];
        $jobs[7] = (object)array_merge((array)$jobs[1], ['id' => 7, 'courseid' => 99]);
        $jobs[8] = (object)array_merge((array)$jobs[2], ['id' => 8, 'userid' => 99]);
        $jobrows = $jobs;
        foreach ([0, 1, 2, 3, 4, 5, 6, 7, 8, 999] as $id) {
            $parameters = ['jobid' => $id]; $response = [];
` + status + String.raw`
            $models['movestatus:' . $id] = $response;
        }
        $colour = [];
        foreach (['#ffffff', '#000000', '#0f6cbf', '#ABCDEF', '#ff0000'] as $value) {
            $colour[$value] = local_groupimport_colour_contrast_against_white($value);
        }
        $models['contrast'] = $colour;
        echo json_encode(['models' => $models, 'projection' => $DB->projected], JSON_THROW_ON_ERROR);
        }
    `;
    fs.writeFileSync(path.join(output, variant + '-parity.php'), program);
    const run = spawnSync(php, [], {cwd: root, input: program, encoding: 'utf8', maxBuffer: 16e6, timeout: 60000});
    fs.writeFileSync(path.join(output, variant + '-parity.stderr'), run.stderr || '');
    assert.equal(run.status, 0, run.stderr + run.stdout.slice(0, 1000));
    assert.equal(run.stderr, '', 'No PHP warnings in isolated builders');
    results[variant] = JSON.parse(run.stdout);
    fs.writeFileSync(path.join(output, variant + '-models.json'), JSON.stringify(results[variant], null, 2));
    const settingsSource = source('settings.php').replace(/^<\?php\s*/, '')
        .replace(/__DIR__/g, JSON.stringify(root.replaceAll('\\', '/')));
    const encodedSettings = Buffer.from(settingsSource).toString('base64');
    const settingsProgram = '<?php\n' + fixture + '\nnamespace {\n' +
        `$root = ${JSON.stringify(root.replaceAll('\\', '/'))};\n` +
        `spl_autoload_register(static function($class) use ($root) {
            if (str_starts_with($class, 'local_groupimport\\\\')) {
                $file = $root . '/classes/' . str_replace('\\\\', '/', substr($class, 18)) . '.php';
                if (is_file($file)) require_once($file);
            }
        });\nrequire_once($root . '/lib.php');\n` + declarations + '\n' + String.raw`
        $PAGE = new moodle_page(); $hassiteconfig = true;
        $ADMIN = new class {
            public $fulltree = false; public $pages = [];
            public function add($parent, $page) { $this->pages[] = $page; }
        };
        $data = [];
        foreach (['en', 'fr'] as $locale) {
            $string = []; require($root . '/lang/' . $locale . '/local_groupimport.php'); $language = $string;
            foreach ([false, true] as $fulltree) {
                $ADMIN->fulltree = $fulltree; $ADMIN->pages = []; $DB->queries = []; $stringsRead = 0;
` + `eval(base64_decode('${encodedSettings}'));\n` + String.raw`
                $data[$locale . ':' . (int)$fulltree] = ['pages' => $ADMIN->pages, 'queries' => count($DB->queries),
                    'strings' => $stringsRead, 'settings' => count($settings->children)];
            }
        }
        $colour = new local_groupimport_admin_setting_configcolor('x', 'x', '', '#0f6cbf');
        $contrast = new \ReflectionMethod($colour, 'contrast_against_white'); $contrast->setAccessible(true);
        foreach (['#ffffff', '#000000', '#0f6cbf', '#ABCDEF', '#ff0000'] as $hex) {
            $data['contrast'][$hex] = $contrast->invoke($colour, $hex);
        }
        echo json_encode($data, JSON_THROW_ON_ERROR);
        }
    `;
    fs.writeFileSync(path.join(output, variant + '-settings.php'), settingsProgram);
    const settingsRun = spawnSync(php, [], {cwd: root, input: settingsProgram, encoding: 'utf8', maxBuffer: 8e6});
    fs.writeFileSync(path.join(output, variant + '-settings.stderr'), settingsRun.stderr || '');
    assert.equal(settingsRun.status, 0, settingsRun.stderr + settingsRun.stdout.slice(0, 1000));
    assert.equal(settingsRun.stderr, '', 'No PHP warnings in settings fixture');
    results[variant].settings = JSON.parse(settingsRun.stdout);
    fs.writeFileSync(path.join(output, variant + '-settings.json'), JSON.stringify(results[variant].settings, null, 2));
}
assert.deepEqual(results.after.models, results.before.models, 'Exact state/manage/movestatus JSON parity');
assert.equal(JSON.stringify(results.after.models), JSON.stringify(results.before.models), 'JSON key order also preserved');
assert.deepEqual(results.after.projection, ['id', 'status', 'nextitem', 'total']);
for (const locale of ['en', 'fr']) {
    assert.deepEqual(results.after.settings[locale + ':1'], results.before.settings[locale + ':1'], 'Full settings tree unchanged');
    const shallow = results.after.settings[locale + ':0'];
    assert.equal(shallow.pages.length, 1, 'Settings page always registered');
    assert.equal(shallow.settings, 0, 'Shallow tree constructs no settings');
    assert.equal(shallow.queries, 0, 'Shallow tree performs no plugin SQL');
}
assert.deepEqual(results.after.settings.contrast, results.before.settings.contrast, 'Settings contrast delegate unchanged');
const crypto = require('node:crypto');
for (const file of ['lib.php', 'classes/service/course_structure.php', 'amd/src/local/sm/specimen.js',
    'templates/manage.mustache', 'classes/service/membership_assignment.php',
    'classes/output/guide_config.php', 'classes/output/context_actions.php']) {
    // Only the MoodleCS PSR12 class-opening blank line is retired in these two I3 classes.
    const expected = old(file).replace(/\r\n/g, '\n').replace(/(class (?:guide_config|context_actions) \{)\n\n/, '$1\n');
    assert.equal(current(file).replace(/\r\n/g, '\n'), expected, `Protected surface unchanged: ${file}`);
}
const fingerprints = Object.fromEntries(Object.entries(results.after.models).map(([key, value]) =>
    [key, crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')]));
const report = {passed: true, baseline: ref, cases: Object.keys(fingerprints).length, fingerprints,
    modelsSha256: crypto.createHash('sha256').update(JSON.stringify(results.after.models)).digest('hex'),
    moveProjection: results.after.projection, privateFieldsPreserved: true, runtimeAccess: false,
    fulltreeSettingsParity: true, shallowQueriesBefore: results.before.settings['en:0'].queries,
    shallowQueriesAfter: results.after.settings['en:0'].queries,
    settingsCount: results.after.settings['en:1'].settings, producerSources,
    producerTopology: 'Post-I3 output classes loaded from each matching before/after source snapshot'};
fs.writeFileSync(path.join(output, 'json-parity.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
