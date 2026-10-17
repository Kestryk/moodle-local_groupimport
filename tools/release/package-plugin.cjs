/* eslint-env node */
'use strict';
// Deterministic production archive; no Moodle bootstrap, external dependency or runtime write.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [major, minor] = process.versions.node.split('.').map(Number);
assert(major === 22 && minor >= 11, 'Use the validated portable Node 22.11+ (major 22).');
const output = process.argv[2];
assert(output && path.isAbsolute(output), 'Usage: node package-plugin.cjs ABSOLUTE_EXTERNAL_OUTPUT_DIR');
const dest = path.resolve(output);
assert(!dest.startsWith(root + path.sep) && dest !== root, 'Output must be outside the plugin.');
const git = (...args) => execFileSync('git', ['-C', root, ...args], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
const tracked = git('ls-files', '-z').split('\0').filter(Boolean).sort();
const trees = new Set(['amd', 'classes', 'db', 'fonts', 'js', 'lang', 'pix', 'scss', 'styles', 'templates']);
const topFiles = new Set(['LICENSE', 'README.md', 'CHANGELOG.md', 'styles.css']);
function included(name) {
    if (name.split('/').some(part => ['node_modules', 'vendor', '.git', 'tests', 'testing', 'fixtures', 'sandbox'].includes(part))) {
        return false;
    }
    return name.includes('/') ? trees.has(name.split('/')[0]) : topFiles.has(name) || /^[a-z][a-z0-9_]*\.php$/.test(name);
}
const files = tracked.filter(included);
const excluded = tracked.filter(name => !included(name));
const dirty = git('status', '--porcelain=v1', '--', ...files);
assert(!dirty.trim(), 'Production inputs must be committed and clean before packaging.');
const required = ['version.php', 'lang/en/local_groupimport.php', 'db/access.php', 'db/install.xml', 'amd/build/course_manager.min.js'];
for (const name of required) assert(files.includes(name), 'Missing Moodle installation input: ' + name);
const version = fs.readFileSync(path.join(root, 'version.php'), 'utf8');
assert(/component\s*=\s*'local_groupimport'/.test(version), 'Unexpected component.');
assert(/requires\s*=\s*\d+/.test(version), 'Missing Moodle requirement.');
const crcTable = Array.from({length: 256}, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1;
    return n >>> 0;
});
function crc32(data) {
    let crc = 0xffffffff;
    for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
    return (crc ^ 0xffffffff) >>> 0;
}
const chunks = [], central = [], entries = [];
let offset = 0;
for (const file of files) {
    assert(!file.includes('..') && !file.includes('\\'), 'Unsafe archive path.');
    const source = path.join(root, file);
    assert(fs.lstatSync(source).isFile(), 'Symlinks and non-regular files are refused: ' + file);
    const data = fs.readFileSync(source), packed = zlib.deflateRawSync(data, {level: 9});
    const name = Buffer.from('groupimport/' + file, 'utf8'), checksum = crc32(data);
    assert(data.length < 0xffffffff && packed.length < 0xffffffff, 'ZIP64 is not supported.');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(33, 12); local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, packed);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x800, 8); header.writeUInt16LE(8, 10); header.writeUInt16LE(33, 14);
    header.writeUInt32LE(checksum, 16); header.writeUInt32LE(packed.length, 20); header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(name.length, 28); header.writeUInt32LE(offset, 42); central.push(header, name);
    entries.push({path: 'groupimport/' + file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex')});
    offset += local.length + name.length + packed.length;
}
assert(entries.length < 65535 && offset < 0xffffffff, 'ZIP64 limits exceeded.');
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...chunks, directory, end]);
fs.mkdirSync(dest, {recursive: true});
fs.writeFileSync(path.join(dest, 'local_groupimport.zip'), zip);
const manifest = {component: 'local_groupimport', commit: git('rev-parse', 'HEAD').trim(), root: 'groupimport/',
    validation: 'Static Moodle structure only; no installation or runtime acceptance claimed.',
    sha256: crypto.createHash('sha256').update(zip).digest('hex'), bytes: zip.length, included: entries,
    excluded: excluded.map(file => ({path: file, reason: 'Outside the runtime/source allowlist or a development-only subtree.'}))};
fs.writeFileSync(path.join(dest, 'package-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(dest, 'package-contents.md'), '# Production archive\n\nStatic inspection only. Root: groupimport/.\n\n## Included\n\n' +
    files.map(f => '- ' + f).join('\n') + '\n\n## Excluded\n\n' + excluded.map(f => '- ' + f).join('\n') + '\n');
console.log(JSON.stringify({passed: true, files: entries.length, excluded: excluded.length, bytes: zip.length, sha256: manifest.sha256}));
