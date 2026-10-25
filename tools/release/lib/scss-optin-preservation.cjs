// Compare current source with/without one public opt-in, never a retired global CSS snapshot.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const postcss = require('postcss');
module.exports = (root, sass, mixin, selector) => {
    const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    const target = 'scss/easyedu/_foundation-classes.scss';
    const source = read(target), lines = source.split('\n').filter(line => line.includes('@include ' + mixin + ';'));
    assert.equal(lines.length, 1, 'Exactly one canonical public opt-in');
    const compile = omit => {
        const importer = {
            canonicalize(url, options) {
                if (url.startsWith('sass:')) return null;
                const base = options.containingUrl ? path.posix.dirname(options.containingUrl.pathname) : '/scss';
                const wanted = url.startsWith('source:') ? new URL(url).pathname : path.posix.resolve(base, url);
                const dir = path.posix.dirname(wanted), name = path.posix.basename(wanted);
                for (const file of [wanted, wanted + '.scss', dir + '/_' + name + '.scss', wanted + '/_index.scss']) {
                    if (fs.existsSync(path.join(root, file.replace(/^\//, ''))) && file.endsWith('.scss')) {
                        return new URL('source:' + file);
                    }
                }
                return null;
            },
            load(url) {
                const file = url.pathname.replace(/^\//, '');
                const contents = read(file);
                return {syntax: 'scss', contents: omit && file === target ? contents.replace(lines[0], '') : contents};
            }
        };
        return sass.compileString(read('scss/easystud.scss'), {url: new URL('source:/scss/easystud.scss'),
            importers: [importer], logger: sass.Logger.silent, charset: false}).css;
    };
    const rows = css => {
        const result = [];
        postcss.parse(css).walkRules(rule => {
            const parents = [];
            for (let n = rule.parent; n.type !== 'root'; n = n.parent) parents.unshift([n.name, n.params]);
            result.push({selector: rule.selector, parents,
                declarations: rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value, !!n.important])});
        });
        return result;
    };
    const without = rows(compile(true)), withOptIn = rows(compile(false));
    let index = 0; const added = [];
    for (const row of withOptIn) {
        if (JSON.stringify(row) === JSON.stringify(without[index])) index++;
        else { assert.ok(row.selector.includes(selector), 'Only the selected opt-in may differ'); added.push(row); }
    }
    assert.equal(index, without.length, 'Every unrelated selector, declaration and conditional order is preserved');
    assert.ok(added.length > 0);
    return {added, preserved: index};
};
