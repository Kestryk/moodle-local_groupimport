'use strict';
const {expect}=require('@playwright/test');
const families=new Map([
 ['group-paste-emails','add-participants'],['group-add-copied-users','add-participants'],
 ['grouping-paste-groups','add-groups'],['grouping-add-copied-groups','add-groups'],
]);
const contextSubmenuKey=action=>action.startsWith('copy-')?'copy':families.get(action)||null;

// Use actual click/tap and the product's one-action flattened state. Never
// manufacture availability, toggle hidden/style attributes or force a click.
async function openContextSubmenu(scope,actionName,fieldKey){
 const menu=scope.locator('[data-easystud-context-menu]:visible');await expect(menu).toBeVisible();
 if(fieldKey!==undefined&&!/^[\w-]+$/.test(fieldKey))throw Error('Explicit native copy-field key required');
 const key=contextSubmenuKey(actionName),action=menu.locator('[data-easystud-context-action="'+actionName+'"]'+
  (fieldKey===undefined?'':'[data-easystud-context-field="'+fieldKey+'"]'));
 if(key){
  const group=menu.locator('[data-easystud-context-group="'+key+'"]');await expect(group).toBeVisible();
  const toggle=group.locator(':scope > [data-easystud-context-submenu-toggle="'+key+'"]');
  const submenu=group.locator(':scope > [data-easystud-context-submenu="'+key+'"]');
  if(await toggle.isVisible()){
   if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(submenu).toBeVisible();
  }else{
   await expect(group).toHaveClass(/is-flattened/);await expect(submenu).toHaveAttribute('role','group');
   await expect(submenu).toBeVisible();await expect(submenu.locator('[data-easystud-context-action]:visible')).toHaveCount(1);
  }
 }
 await expect(action).toBeVisible();return action;
}

// Inventory the closed top level separately from children actually revealed
// through native toggles. Return every available child; unavailable items stay
// hidden according to the product's current selection and clipboard.
async function inspectContextSubmenus(menu){
 const keys=await menu.locator('[data-easystud-context-submenu-toggle]:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.easystudContextSubmenuToggle));
 const rows=[];
 for(const key of keys){
  const toggle=menu.locator('[data-easystud-context-submenu-toggle="'+key+'"]');
  const submenu=menu.locator('[data-easystud-context-submenu="'+key+'"]');
  const initiallyExpanded=await toggle.getAttribute('aria-expanded')==='true';
  if(!initiallyExpanded){await expect(submenu).toBeHidden();await expect(submenu.locator('[data-easystud-context-action]:visible')).toHaveCount(0);await toggle.click();}
  await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(submenu).toBeVisible();
  // The menu surface may be painted before its native reveal gives children
  // their boxes. Wait for the actual second available command, not the shell.
  await expect(submenu.locator('[data-easystud-context-action]:visible').nth(1)).toBeVisible();
  const actions=await submenu.locator('[data-easystud-context-action]:visible').evaluateAll(nodes=>nodes.map(n=>({action:n.dataset.easystudContextAction,text:n.textContent.trim()})));
  expect(actions.length).toBeGreaterThanOrEqual(2);rows.push({key,initiallyExpanded,actions});
  // Inventory uses the same click/tap toggle for closing; focus-driven page
  // scroll would independently close the desktop context menu.
  await toggle.click();await expect(submenu).toBeHidden();await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(menu).toBeVisible();
 }
 return rows;
}
module.exports={contextSubmenuKey,openContextSubmenu,inspectContextSubmenus};
