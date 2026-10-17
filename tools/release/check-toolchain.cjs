// Read-only toolchain provenance/preflight. No installation, build or runtime access.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [buildRoot,sassRoot,output,...flags]=process.argv.slice(2);
if(!buildRoot||!sassRoot||!output||![buildRoot,sassRoot,output].every(path.isAbsolute))throw Error('Pass absolute build checkout, Sass package and external output paths');
const root=path.resolve(__dirname,'../..');if(path.resolve(output).toLowerCase().startsWith(root.toLowerCase()+path.sep))throw Error('Evidence must stay outside source');
const contract=require('./toolchain-contract.json'),pkg=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const packages={};for(const name of Object.keys(contract.packages))packages[name]=pkg(path.join(name==='sass'?sassRoot:path.join(buildRoot,'node_modules',name),'package.json')).version;
const engine=pkg(path.join(buildRoot,'package.json')).engines.node;
assert.equal(engine,contract.node.requiredByMoodleBuild,'Review changed Moodle Node engine requirement');
for(const [name,version] of Object.entries(packages))assert.equal(version,contract.packages[name],name+' differs from recorded toolchain');
const [major,minor]=process.versions.node.split('.').map(Number);
const nodeCompatible=major===22&&minor>=11;
const result={surface:'TRI38-toolchain-preflight',provenancePassed:true,node:process.versions.node,nodeRequired:engine,nodeCompatible,packages,releaseValidated:false,runtimeAccess:false};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
// Inspection is always usable; explicit release mode fails closed on an unsupported engine.
if(flags.includes('--release')) {
 const guard=require('./verify-build-versions.cjs');
 guard.assertNode();
 guard.assertSass(require(path.resolve(sassRoot)));
}
