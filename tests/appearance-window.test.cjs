const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {expect}=require('@playwright/test');const electron=require('./helpers/background.cjs');
const root=path.join(__dirname,'..');
function launch(profile){return electron.launch(process.env.WORKSTATION_TEST_EXECUTABLE?{executablePath:process.env.WORKSTATION_TEST_EXECUTABLE,args:[`--user-data-dir=${profile}`]}:{args:[root,`--user-data-dir=${profile}`]});}
async function settings(app){const p=await app.firstWindow();await p.locator('nav button').nth(3).click();await expect(p.locator('.appearance-panel')).toHaveAttribute('aria-busy','false');return p;}
async function choose(p,index){await p.locator('.appearance-modes button').nth(index).click();await expect(p.locator('.appearance-feedback')).toHaveText(/已保存|Saved/);await expect(p.locator('.appearance-modes button').nth(index)).toHaveAttribute('aria-pressed','true');}
test('native appearance choices persist across process restart without changing workspaces',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-theme-'));let app;
 try{
  app=await launch(profile);let p=await settings(app);await p.emulateMedia({colorScheme:null});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await choose(p,2);await expect.poll(()=>p.evaluate(()=>matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
  await expect.poll(()=>p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim())).toBe('#1c1d20');
  await choose(p,1);await expect.poll(()=>p.evaluate(()=>matchMedia('(prefers-color-scheme: light)').matches)).toBe(true);
  await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].getBackgroundColor().toLowerCase())).toBe('#f8f5ef');
  await choose(p,0);assert.equal(await app.evaluate(({nativeTheme})=>nativeTheme.themeSource),'system');
  for(const colorScheme of ['light','dark']){await p.emulateMedia({colorScheme});await expect.poll(()=>p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim())).toBe(colorScheme==='dark'?'#1c1d20':'#f8f5ef');}
  await p.emulateMedia({colorScheme:null});
  await p.locator('.appearance-modes button').nth(2).focus();await p.keyboard.press('Enter');await expect(p.locator('.appearance-feedback')).toHaveText(/已保存|Saved/);
  assert.equal(await p.locator('.appearance-modes button').nth(2).evaluate(e=>e===document.activeElement),true);
  await app.close();app=await launch(profile);p=await app.firstWindow();await p.getByRole('navigation').waitFor();
  assert.equal(await app.evaluate(({nativeTheme})=>nativeTheme.themeSource),'dark');assert.equal(await p.evaluate(()=>matchMedia('(prefers-color-scheme: dark)').matches),true);
  p=await settings(app);await expect(p.locator('.appearance-modes button').nth(2)).toHaveAttribute('aria-pressed','true');
  const pref=path.join(profile,'appearance-v1.json'),before=await fs.readFile(pref,'utf8');
  const replies=await p.evaluate(async()=>{const a=await window.workstation.change({type:'create',name:'空间甲'});const b=await window.workstation.change({type:'create',name:'空间乙'});return [a.ok,b.ok];});assert.deepEqual(replies,[true,true]);assert.equal(await fs.readFile(pref,'utf8'),before);
  const invalid=await p.evaluate(()=>window.workstation.appearance.change({theme:'dark',path:'C:/secret'}));assert.deepEqual(invalid,{ok:false,error:'INVALID'});
  for(const locale of ['zh-CN','en-US']){
   await p.addInitScript(l=>Object.defineProperty(navigator,'language',{get:()=>l,configurable:true}),locale);await p.reload();p=await settings(app);
   for(const [index,theme]of [[1,'light'],[2,'dark']]){await choose(p,index);for(const width of [1440,800]){
    await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setContentSize(width,760),width);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await electron.screenshot(app,p,path.join(root,'docs/design/previews/runtime',`appearance-${locale}-${theme}-${width}.png`));
   }}
  }
  assert.deepEqual(errors,[]);
 }finally{if(app)await app.close();await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
test('appearance write failure keeps the old theme and unrelated success cannot clear its exit warning',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-theme-fail-'));const app=await launch(profile);
 try{
  const p=await settings(app);await choose(p,2);const file=path.join(profile,'appearance-v1.json'),backup=file+'.test-backup';await fs.rename(file,backup);await fs.mkdir(file);
  await p.locator('.appearance-modes button').nth(1).click();await expect(p.getByRole('alert')).toBeVisible();await expect(p.locator('.appearance-modes button').nth(2)).toHaveAttribute('aria-pressed','true');
  assert.equal(await app.evaluate(({nativeTheme})=>nativeTheme.themeSource),'dark');assert.equal((await p.evaluate(()=>window.workstation.change({type:'create',name:'独立空间'}))).ok,true);
  await app.evaluate(({dialog})=>{globalThis.appearanceClosePrompts=0;dialog.showMessageBox=async()=>{globalThis.appearanceClosePrompts++;return {response:0};};});
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await expect.poll(()=>app.evaluate(()=>globalThis.appearanceClosePrompts)).toBe(1);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
  await fs.rmdir(file);await fs.rename(backup,file);await choose(p,1);
  const closed=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await closed;
 }finally{await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});}).catch(()=>{});await app.close().catch(()=>{});await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
test('corrupt appearance remains untouched until explicit recovery and unsupported versions stay protected',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-theme-corrupt-'));const file=path.join(profile,'appearance-v1.json');let app;
 try{
  await fs.writeFile(file,'broken');app=await launch(profile);let p=await settings(app);await expect(p.getByRole('alert')).toBeVisible();assert.equal(await fs.readFile(file,'utf8'),'broken');
  await p.locator('.appearance-panel .workspace-error button').nth(1).click();await p.locator('.appearance-panel .recovery-confirm button').first().click();await expect(p.locator('.appearance-feedback')).toHaveText(/已保存|Saved/);
  const backup=(await fs.readdir(profile)).find(n=>n.startsWith('appearance-v1.preserved-'));assert.equal(await fs.readFile(path.join(profile,backup),'utf8'),'broken');
  await app.close();app=null;await fs.writeFile(file,'{"version":2}');app=await launch(profile);p=await settings(app);await expect(p.getByRole('alert')).toBeVisible();assert.equal(await p.locator('.appearance-modes button:disabled').count(),3);assert.equal(await p.locator('.appearance-panel .workspace-error button').count(),1);assert.equal(await fs.readFile(file,'utf8'),'{"version":2}');
 }finally{if(app)await app.close();await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
