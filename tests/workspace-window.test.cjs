const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {_electron:electron,expect}=require('@playwright/test');
test('create spaces then restart a new Electron process and restore independent views',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-restart-'));
 let app;let page;const errors=[];
 async function launch(){
  app=await electron.launch(process.env.WORKSTATION_TEST_EXECUTABLE?{executablePath:process.env.WORKSTATION_TEST_EXECUTABLE,args:[`--user-data-dir=${profile}`]}:{args:[path.join(__dirname,'..'),`--user-data-dir=${profile}`]});page=await app.firstWindow();
  page.on('pageerror',e=>errors.push(e.message));await page.getByRole('navigation').waitFor();
  await expect(page.locator('.workspaces')).toHaveAttribute('aria-busy','false');
 }
 async function saved(){await expect(page.locator('.workspaces')).toHaveAttribute('aria-busy','false');await expect(page.locator('.workspace-feedback')).toHaveText(/已保存|Saved/);}
 async function create(name){await page.locator('#workspace-name').fill(name);await page.locator('.workspace-create button').click();await saved();}
 try{
  await launch();await page.locator('nav button').nth(1).click();await create('创作空间');
  await page.locator('.workspace-views button').nth(1).click();await saved();
  await page.locator('select').selectOption('focus');await saved();
  await app.close();await launch();
  await expect(page.locator('nav button').nth(1)).toHaveAttribute('aria-current','page');
  await expect(page.locator('.workspace-toolbar h2')).toHaveText('创作空间');
  await expect(page.locator('select')).toHaveValue('focus');
  assert.equal(await page.getByRole('tab').count(),2);await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected','true');
  await create('第二空间');await expect(page.locator('select')).toHaveValue('standard');
  await page.locator('.workspace-switcher button').first().click();await saved();await expect(page.locator('select')).toHaveValue('focus');
  await page.locator('.workspace-actions button').click();await saved();assert.equal(await page.getByRole('tab').count(),1);assert.equal(await page.locator('.workspace-switcher button').count(),2);
  const invalid=await page.evaluate(()=>window.workstation.change({type:'create',name:'bad',path:'C:/secret'}));assert.equal(invalid.ok,false);assert.equal(invalid.error,'INVALID');
  for(const locale of ['zh-CN','en-US']){
   await page.addInitScript(l=>Object.defineProperty(navigator,'language',{get:()=>l,configurable:true}),locale);await page.reload();await expect(page.locator('.workspaces')).toHaveAttribute('aria-busy','false');
   for(const theme of ['dark','light']){await page.emulateMedia({colorScheme:theme});for(const width of [1440,800]){
    await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setContentSize(width,760),width);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
    await page.screenshot({path:path.join(__dirname,'../docs/design/previews/runtime',`workspace-live-${locale}-${theme}-${width}.png`)});
   }}
  }
  assert.deepEqual(errors,[]);
  await app.close();app=null;
  await fs.writeFile(path.join(profile,'workspaces-v1.json'),'damaged');await launch();await expect(page.locator('nav button').nth(1)).toHaveAttribute('aria-current','page');await expect(page.getByRole('alert')).toBeVisible();
  assert.equal(await fs.readFile(path.join(profile,'workspaces-v1.json'),'utf8'),'damaged');
  await page.locator('.workspace-error button').nth(1).click();await page.locator('.recovery-confirm button').first().click();await expect(page.locator('.workspaces')).toHaveAttribute('aria-busy','false');
  await create('恢复空间');assert.ok((await fs.readdir(profile)).some(f=>f.startsWith('workspaces-v1.preserved-')));
 }finally{if(app)await app.close();await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
test('real disk write failure is visible and closing asks before discarding',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-failure-'));
 const app=await electron.launch({args:[path.join(__dirname,'..'),`--user-data-dir=${profile}`]});
 try {
  const page=await app.firstWindow();await expect(page.locator('.workspaces')).toHaveAttribute('aria-busy','false');await page.locator('nav button').nth(1).click();
  await fs.mkdir(path.join(profile,'workspaces-v1.json'));
  await page.locator('#workspace-name').fill('未保存空间');await page.locator('.workspace-create button').click();
  await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.workspace-feedback')).toHaveText(/未保存|not saved/);
  await expect(page.locator('#workspace-name')).toHaveValue('未保存空间');
  await app.evaluate(({dialog})=>{globalThis.closePrompts=0;dialog.showMessageBox=async()=>{globalThis.closePrompts++;await new Promise(resolve=>setTimeout(resolve,150));return {response:0};};});
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.close();w.close();});
  await expect.poll(()=>app.evaluate(()=>globalThis.closePrompts)).toBe(1);
  const closing=await page.evaluate(()=>window.workstation.change({type:'create',name:'关闭期间不应新增'}));
  assert.equal(closing.ok,false);assert.equal(closing.error,'CLOSING');
  await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(await app.evaluate(()=>globalThis.closePrompts),1);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
  await fs.rmdir(path.join(profile,'workspaces-v1.json'));
  await page.locator('.workspace-create button').click();await expect(page.locator('.workspace-feedback')).toHaveText(/已保存|Saved/);
  const closed=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await closed;
 }finally{await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});}).catch(()=>{});await app.close().catch(()=>{});await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
test('successful reread clears an obsolete recovery confirmation',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-confirm-'));
 const file=path.join(profile,'workspaces-v1.json');await fs.writeFile(file,'broken');
 const app=await electron.launch({args:[path.join(__dirname,'..'),`--user-data-dir=${profile}`]});
 try {
  const page=await app.firstWindow();await expect(page.getByRole('alert')).toBeVisible();
  await page.locator('.workspace-error button').nth(1).click();await expect(page.locator('.recovery-confirm')).toBeVisible();
  await fs.writeFile(file,JSON.stringify({version:1,lastWorkspaceId:null,workspaces:[]}));
  await page.locator('.workspace-error button').first().click();
  await expect(page.locator('.workspaces')).toHaveAttribute('aria-busy','false');
  assert.equal(await page.locator('.recovery-confirm').count(),0);
 }finally{await app.close();await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
