// A deployed Perf copy has no Git metadata. Record its verified external manifest
// rather than inferring a revision from an ancestor repository or source HEAD.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');

function read(runtime) {
    if (fs.existsSync(path.join(runtime, '.git'))) {
        const revision = spawnSync('git', ['-C', runtime, 'rev-parse', 'HEAD'],
            {encoding: 'utf8', windowsHide: true});
        if (revision.status !== 0) throw new Error('Unable to read served Git revision.');
        return {head: revision.stdout.trim(), deployment: null};
    }
    const location = process.env.EASYEDU_PERF_DEPLOYMENT_MANIFEST;
    if (!location) throw new Error('Non-Git runtime requires an external deployment manifest.');
    const manifest = JSON.parse(fs.readFileSync(location, 'utf8'));
    if (path.resolve(manifest.target).toLowerCase() !== path.resolve(runtime).toLowerCase()) {
        throw new Error('Deployment manifest belongs to another runtime.');
    }
    if (new URL(manifest.url).origin !== new URL(process.env.EASYEDU_MOODLE_URL).origin) {
        throw new Error('Deployment manifest belongs to another Moodle URL.');
    }
    for (const [file, expected] of Object.entries(manifest.hashes)) {
        const resolved = path.resolve(runtime, file);
        if (!resolved.startsWith(path.resolve(runtime) + path.sep)) throw new Error('Unsafe deployment path.');
        const actual = createHash('sha256').update(fs.readFileSync(resolved)).digest('hex');
        if (actual !== expected) throw new Error('Deployed file changed: ' + file);
    }
    return {head: manifest.sourceHead, deployment: {manifest: location,
        verifiedFiles: Object.keys(manifest.hashes).length, url: manifest.url,
        sourceDirty: manifest.sourceDirty, snapshot: manifest.snapshot}};
}

module.exports = {read};
