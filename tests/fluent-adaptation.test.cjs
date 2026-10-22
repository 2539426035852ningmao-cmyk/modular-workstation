const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {expect}=require('@playwright/test');const electron=require('./helpers/electron.cjs');
test('Fluent settings row adapts without clipping and shared feedback respects reduced motion',async()=>{
 const app=await electron.launch({args:[path.join(__dirname,'..')]});
 try{
  const p=await app.firstWindow();await p.locator('nav button').nth(3).click();
  await expect(p.locator('.appearance-panel')).toHaveAttribute('aria-busy','false');
  for(const width of [1440,800]){
   await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setContentSize(width,760),width);
   await expect.poll(()=>p.evaluate(()=>innerWidth)).toBe(width);
   const layout=await p.locator('.settings-row').evaluate(e=>{
    const text=e.querySelector('.settings-row-copy').getBoundingClientRect(),controls=e.querySelector('.appearance-modes').getBoundingClientRect();
    return {stacked:controls.top>=text.bottom,overflow:e.scrollWidth>e.clientWidth};
   });assert.equal(layout.stacked,width===800);assert.equal(layout.overflow,false);
  }
  await p.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await p.locator('.control').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0.15s, 0.15s');
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await p.locator('.control').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 }finally{await app.close();}
});
