// ci-reusable: actual source controller with isolated DOM/API doubles; never Moodle data.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const vm = require('node:vm');
const {chromium} = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const output = path.resolve(process.argv[3]);
const approved = path.resolve(process.env.LOCALAPPDATA, 'EasyEdu/artifacts/easystud');
if (!output.startsWith(approved + path.sep) || fs.existsSync(output)) throw new Error('New external owned artifact path required.');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const baseline = file => execFileSync('git', ['show', `afccee267b6316c450142ca734a0c239b487c2c7:${file}`],
    {cwd:root, encoding:'utf8'}).replace(/\r\n/g, '\n');
const block = (source, start, end) => {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert(a >= 0 && b > a, 'unique source block boundaries');
    return source.slice(a, b).replace(/\r\n/g, '\n');
};
const manager = read('amd/src/course_manager.js');
const move = block(manager, 'const bindMoveModal = ', 'const bindParticipantMessaging = ');
const oldMove = block(baseline('amd/src/course_manager.js'), 'const bindMoveModal = ', 'const bindParticipantMessaging = ');
// Preserve old add-participants/move-groups commands. Only the explicit member branch is new.
const commandMarker = "    confirmButton.addEventListener('click', () => {";
const oldCommands = oldMove.slice(oldMove.indexOf("        if (contextType === 'participant') {", oldMove.indexOf(commandMarker)));
const newCommands = move.slice(move.indexOf("        if (contextType === 'participant') {", move.indexOf(commandMarker)));
assert.equal(newCommands, oldCommands, 'existing Participant/Group confirmation handlers');
assert.equal(read('amd/src/motion.js').replace(/\r\n/g, '\n'), baseline('amd/src/motion.js'));
assert.equal(read('styles.css').replace(/\r\n/g, '\n'), baseline('styles.css'), 'no private presentation patch');
const ajax = read('ajax.php').replace(/\r\n/g, '\n');
const endpointStart = ajax.indexOf("    } else if ($action === 'movemembers') {");
const endpointEnd = ajax.indexOf("    } else if ($action === 'addemails') {", endpointStart);
assert(endpointStart >= 0 && endpointEnd > endpointStart, 'guarded dedicated endpoint');
assert.equal(ajax.slice(0, endpointStart) + ajax.slice(endpointEnd), baseline('ajax.php'), 'other business routes unchanged');
assert.equal((ajax.slice(endpointStart, endpointEnd).match(/membership_transfer::move_members/g) || []).length, 1);
assert(ajax.slice(endpointStart, endpointEnd).includes("$_SERVER['REQUEST_METHOD']"), 'POST required');
const template = read('templates/manage.mustache').replace(/\r\n/g, '\n');
assert.equal(template.replace(/\s*data-move-members-help="\{\{movedialogmembers\}\}"/, ''),
    baseline('templates/manage.mustache'), 'only translated business hint in Mustache');
for (const module of ['course_manager', 'member_selection']) {
    const built = read(`amd/build/${module}.min.js`);
    new vm.Script(built);
    assert(built.includes(`define("local_groupimport/${module}"`), 'named AMD');
}
assert(read('amd/build/course_manager.min.js').includes('local_groupimport/member_selection'));
(async () => {
    fs.mkdirSync(output, {recursive:true});
    const browser = await chromium.launch({channel:'chrome', headless:true});
    const records = [];
    try {
        const page = await browser.newPage({viewport:{width:900, height:850}});
        page.setDefaultTimeout(10000);
        page.on('pageerror', error => process.stderr.write(`Isolated page error: ${error.message}\n`));
        // Tests bindMoveModal itself, not a reimplemented dialog or a production endpoint.
        const html = `<main id="root" data-easystud-detail-labels='{"moveconfirmone":"Move item","moveconfirmmany":"Move items","ajaxerror":"Rejected","searchdestination":"Search groups","nomovegroupsavailable":"No groups"}'>
          <button data-easystud-move-selected-members>Move members</button><div data-easystud-tree>
          ${[1, 1, 2, 3].map((id, n) => `<section data-easystud-group-id="${id}" data-copy="${n}"><h2>Group ${id}</h2>
            ${id !== 3 ? `<div data-easystud-member-id="11" ${id === 1 ? 'class="is-selected"' : ''}>
            <input type="checkbox" data-easystud-selector-input><span class="local-groupimport-easystud-member__name">Alex &lt;img&gt;</span></div>` : ''}
            </section>`).join('')}</div>
          <div data-easystud-move-modal hidden><div class="local-groupimport-easystud-modal__body"
            data-move-members-help="Only selected source memberships move." data-move-participants-label="Destination group">
            <p data-easystud-move-modal-help></p><label data-easystud-move-modal-label for="destination"></label>
            <select id="destination" data-easystud-move-destination></select><div data-easystud-move-origin-wrap><input data-easystud-move-remove-origin></div>
            <p data-easystud-move-empty tabindex="-1"></p></div>
            <button data-easystud-close-move-modal>Cancel</button><button data-easystud-confirm-move>Move</button></div></main>`;
        const initialise = async () => {
            await page.goto('about:blank');
            await page.setContent(html);
            await page.addScriptTag({content:read('amd/src/searchable_choices.js').replace('export const enhanceSelect =', 'const enhanceSelect =')});
            await page.addScriptTag({content:read('amd/src/member_selection.js').replace('export const snapshotMemberPairs =', 'const snapshotMemberPairs =')});
            await page.addScriptTag({content:`
                const getSelectedItems = root => [...root.querySelectorAll('[data-easystud-member-id].is-selected')];
                const getGroupName = group => group.querySelector('h2').textContent;
                const getGroupElementsById = (root, id) => [...root.querySelectorAll('[data-easystud-group-id="'+id+'"]')];
                const showEasyStudModal = modal => {modal.hidden = false;};
                const hideEasyStudModal = (modal, done) => {modal.hidden = true; done();};
                const syncGroupMembersState = () => {};
                const rehydrateParticipantMembershipDetails = () => {};
                const applyFilters = () => {};
                const updateSelectionActions = () => {};
                const clearSelectionState = root => root.querySelectorAll('.is-selected').forEach(n=>n.classList.remove('is-selected'));
                const showNotification = (root, message, type) => window.notifications.push({message, type});
                const appendUsersToGroupCopies = (root, id, users) => getGroupElementsById(root,id).forEach(group => users.forEach(user => {
                    if (group.querySelector('[data-easystud-member-id="'+user.id+'"]')) return;
                    const row = document.createElement('div'); row.setAttribute('data-easystud-member-id',user.id);
                    row.textContent = user.fullname; group.append(row);
                }));
                const postAction = data => {window.requests.push(data); return new Promise((resolve,reject)=>{window.resolve=resolve;window.reject=reject;});};
                window.requests=[]; window.notifications=[]; ${move}
                const root=document.querySelector('#root'); bindMoveModal(root,5);
                window.snapshotMemberPairs=snapshotMemberPairs;
            `});
        };
        await initialise();
        const open = page.locator('[data-easystud-move-selected-members]');
        const dialog = page.locator('[data-easystud-move-modal]');
        const confirm = page.locator('[data-easystud-confirm-move]');
        await open.click();
        assert.equal(await confirm.textContent(), 'Move item', 'duplicate copies count once');
        assert.equal(await page.locator('select option').count(), 3, 'deduplicated destinations');
        assert.equal(await page.locator('[data-easystud-move-origin-wrap]').isHidden(), true);
        await page.evaluate(() => {
            const select=document.querySelector('select'); select.value='3';
            document.querySelectorAll('.is-selected').forEach(n=>n.classList.remove('is-selected'));
            document.querySelector('[data-easystud-group-id="2"] [data-easystud-member-id]').classList.add('is-selected');
        });
        await confirm.click();
        assert.deepEqual(await page.evaluate(()=>window.requests),
            [{courseid:5, action:'movemembers', destinationid:'3', groupids:['1'], userids:['11']}], 'frozen selection, one request');
        await page.evaluate(()=>document.querySelector('[data-easystud-confirm-move]').click());
        assert.equal(await page.evaluate(()=>window.requests.length), 1, 'no duplicate in flight');
        assert.equal(await page.locator('[data-easystud-close-move-modal]').isDisabled(), true);
        await page.evaluate(()=>window.reject(new Error('native rejection')));
        await page.waitForFunction(()=>document.querySelector('[data-easystud-move-modal]').getAttribute('aria-busy')==='false');
        assert.equal(await dialog.isVisible(), true, 'rejection leaves dialog open');
        assert.equal(await page.locator('[data-easystud-group-id="1"] [data-easystud-member-id]').count(), 2, 'rejection leaves memberships');
        assert.equal(await page.locator('.is-selected').count(), 1, 'rejection leaves current selection');
        await confirm.click();
        await page.evaluate(()=>window.resolve({message:'Moved'}));
        await page.waitForFunction(()=>document.querySelector('[data-easystud-move-modal]').hidden);
        assert.equal(await page.locator('[data-easystud-group-id="1"] [data-easystud-member-id]').count(), 0, 'all origin copies removed');
        assert.equal(await page.locator('[data-easystud-group-id="2"] [data-easystud-member-id]').count(), 1, 'unselected group preserved');
        assert.equal(await page.locator('[data-easystud-group-id="3"] [data-easystud-member-id]').textContent(), 'Alex <img>');
        assert.equal(await page.locator('#root img').count(), 0, 'member name remains plain text');
        assert.equal(await open.evaluate(n=>n===document.activeElement), true, 'return focus to opener');
        records.push({case:'frozen-pairs-dedup-busy-error-success-unrelated-groups-focus', status:'passed'});
        process.stdout.write('PASS isolated frozen selection / rollback UI / success copies.\n');
        await initialise();
        await page.evaluate(()=>{
            const root=document.querySelector('#root'), member=root.querySelector('[data-easystud-group-id="2"] [data-easystud-member-id]');
            root.dispatchEvent(new CustomEvent('easystud:move-members',{detail:{members:[member],opener:member.querySelector('input')}}));
        });
        await page.evaluate(()=>{document.querySelector('select').value='2';});
        await confirm.click();
        await page.evaluate(()=>window.resolve({message:'Unchanged'}));
        await page.waitForFunction(()=>document.querySelector('[data-easystud-move-modal]').hidden);
        assert.equal(await page.locator('[data-easystud-group-id="2"] [data-easystud-member-id]').count(), 1, 'same group retains row');
        records.push({case:'explicit-context-pair-same-group', status:'passed'});
        await initialise();
        await open.click();
        await page.locator('[data-easystud-close-move-modal]').click();
        assert.equal(await page.evaluate(()=>window.requests.length), 0, 'Cancel does not post');
        const validation = await page.evaluate(()=>{
            const root=document.querySelector('#root'), member=root.querySelector('[data-easystud-member-id]');
            const pairs=window.snapshotMemberPairs(root,[member]); let invalid=false;
            try {window.snapshotMemberPairs(root,[document.createElement('div')]);} catch {invalid=true;}
            return {frozen:Object.isFrozen(pairs)&&Object.isFrozen(pairs[0]),invalid};
        });
        assert.deepEqual(validation,{frozen:true,invalid:true});
        records.push({case:'cancel-no-http-immutable-validation', status:'passed'});
        fs.writeFileSync(path.join(output,'contract.json'), JSON.stringify({status:'passed', nativeDatabase:false, records},null,2));
        process.stdout.write('PASS: legacy branches/Motion/CSS retained; 3 isolated DOM scenarios. Native database integration not tested.\n');
    } catch (error) {
        fs.writeFileSync(path.join(output,'contract.json'), JSON.stringify({status:'failed', error:error.message, records},null,2));
        throw error;
    } finally {await browser.close();}
})().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
