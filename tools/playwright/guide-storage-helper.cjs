'use strict';
// Read the served configuration; never guess a shared course/guest namespace.
const guideStorageKey=async(page,suffix='')=>page.locator('.easyedu-guide--discovery[data-easyedu-guide-root]').evaluate((guide,suffix)=>{
 const manager=document.querySelector('#local-groupimport-easystud');
 const user=manager?.getAttribute('data-easystud-user-key'),course=manager?.getAttribute('data-easystud-course-id');
 if(!/^[1-9]\d*$/.test(user||'')||!/^[1-9]\d*$/.test(course||''))throw Error('Served Guide user/course identity required');
 const expected='local_groupimport.easyedu_guide.u'+user+'.c'+course,key=guide.easyeduGuideConfig?.storageKey;
 if(key!==expected)throw Error('Guide configuration does not match served user/course identity');
 return key+suffix;
},suffix);
const guideDiscoveryKey=async page=>{
 await guideStorageKey(page);
 return page.locator('#local-groupimport-easystud').evaluate(root=>'local_groupimport_easystud_guide_seen_'+root.getAttribute('data-easystud-course-id')+'_'+root.getAttribute('data-easystud-user-key'));
};
module.exports={guideStorageKey,guideDiscoveryKey};
