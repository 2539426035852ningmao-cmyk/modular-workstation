const assert=require('node:assert/strict');const {test}=require('node:test');const path=require('node:path');const electron=require('./helpers/electron.cjs');const {expect}=require('@playwright/test');
test('minimal chrome and neutral home cards with blue icon tiles',async()=>{
 const app=await electron.launch({args:[path.join(__dirname,'..')]});try{const p=await app.firstWindow();await p.getByRole('navigation').waitFor();
 const chrome=await app.evaluate(({Menu,BrowserWindow})=>({menu:Menu.getApplicationMenu()===null,visible:BrowserWindow.getAllWindows()[0].isMenuBarVisible()}));assert.deepEqual(chrome,{menu:true,visible:false});
 assert.equal(await p.locator('.app-title,.statusbar').count(),0);
 await p.keyboard.press('Alt');assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isMenuBarVisible()),false);
 for(const [theme,blue,surface]of [['light','rgb(12, 57, 103)','rgb(255, 253, 250)'],['dark','rgb(34, 84, 135)','rgb(41, 43, 48)']]){
  await p.emulateMedia({colorScheme:theme});
  // Native runner cursors may initially overlap a card; this check targets the resting state.
  await p.locator('.brand-mark').hover();
  await expect.poll(()=>p.locator('.module-card:hover').count()).toBe(0);
  assert.equal(await p.locator('.module-card').count(),3);
  assert.equal(await p.locator('.module-card[data-selected="true"]').count(),0);
  for(const c of await p.locator('.module-card').all()){assert.equal(await c.evaluate(e=>getComputedStyle(e).backgroundColor),surface);const icon=c.locator('.module-icon');assert.deepEqual(await icon.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).color})),{bg:blue,fg:'rgb(255, 255, 255)'});}
  // Future selected appearance only; no selection behaviour is introduced.
  const selected=await p.locator('.module-card').first().evaluate(e=>{const sample=e.cloneNode(true);sample.dataset.selected='true';e.parentElement.append(sample);const s=getComputedStyle(sample);const value={bg:s.backgroundColor,fg:s.color};sample.remove();return value;});assert.deepEqual(selected,{bg:blue,fg:'rgb(248, 245, 239)'});
 }
 await p.locator('.module-card').nth(1).click();assert.equal(await p.locator('nav button').nth(1).getAttribute('aria-current'),'page');await p.locator('nav button').first().click();assert.equal(await p.locator('.module-card[data-selected="true"]').count(),0);
 }finally{await app.close()}
});
