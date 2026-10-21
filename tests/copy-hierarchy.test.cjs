const {test}=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');const electron=require('./helpers/electron.cjs');
test('left-first hierarchy, concise copy and rounded corner hints',async()=>{
 const app=await electron.launch({args:[path.join(__dirname,'..')]});try{const p=await app.firstWindow();await p.getByRole('navigation').waitFor();
 const hierarchy=await p.locator('.breadcrumb').evaluate(e=>{const a=e.firstElementChild,b=e.lastElementChild;return{left:Number(getComputedStyle(a).fontWeight),right:Number(getComputedStyle(b).fontWeight)};});assert.ok(hierarchy.left>hierarchy.right);assert.ok(hierarchy.right<=400);
 for(const locale of ['zh-CN','en-US']){await p.addInitScript(language=>Object.defineProperty(navigator,'language',{get:()=>language,configurable:true}),locale);await p.reload();
  for(let page=0;page<4;page++){await p.locator('nav button').nth(page).click();const copy=await p.locator('h1,.content-intro p,.context-note p,.module-card p,.module-status,.home-note p,.state-panel > p,.availability-note,.theme-information p,.sidebar-footer').allTextContents();for(const text of copy){assert.ok(!/[\p{P}\p{S}]/u.test(text),text);assert.ok(text.length<=(locale==='zh-CN'?18:56),text);}}
 }
 await p.locator('nav button').first().click();assert.equal(await p.locator('.module-card-corner').count(),3);
 for(const corner of await p.locator('.module-card-corner').all()){
  assert.equal(await corner.locator('path').getAttribute('fill'),'none');assert.equal(await corner.locator('path').getAttribute('stroke-linecap'),'round');
  const inset=await corner.evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('.module-card').getBoundingClientRect();return{top:a.top-b.top,right:b.right-a.right};});assert.ok(inset.top>=10&&inset.top<=20);assert.ok(inset.right>=10&&inset.right<=20);
 }
 }finally{await app.close()}
});
