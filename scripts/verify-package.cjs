// Check an existing Windows Candidate without overwriting or installing it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {expect}=require('@playwright/test');const electron=require('../tests/helpers/background.cjs');
(async()=>{
 assert.ok(process.argv[2], 'Pass the exact Candidate folder to verify.');
 const folder=path.resolve(process.argv[2]);
 const executable=path.join(folder,'ModularWorkstation.exe'),archive=path.join(folder,'resources/app.asar');
 const {extractFile}=await import('@electron/asar');const hashes={};
 for(const file of [...fs.readdirSync('electron').filter(n=>n.endsWith('.cjs')).map(n=>'electron/'+n),'package.json','dist/index.html',...fs.readdirSync('dist/assets').map(n=>'dist/assets/'+n)]){
  const packed=extractFile(archive,path.normalize(file));
  if(file==='package.json'){
   const a=JSON.parse(packed),b=JSON.parse(fs.readFileSync(file));
   for(const key of ['name','version','main','type','dependencies'])assert.deepEqual(a[key],b[key],key);
   assert.equal(a.devDependencies,undefined);
  }else assert.deepEqual(packed,fs.readFileSync(file),file);
  hashes[file]=crypto.createHash('sha256').update(packed).digest('hex');
 }
 const profile=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'workstation-package-'));
 const application=await electron.launch({executablePath:executable,args:[`--user-data-dir=${profile}`]});
 try{
  const w=await application.firstWindow();await w.getByRole('navigation').waitFor();
  const identity=await application.evaluate(({app})=>({name:app.getName(),version:app.getVersion(),path:app.getAppPath()}));
  assert.equal(path.resolve(identity.path),archive);assert.equal(identity.version,'0.1.0-prototype');
  const chrome=await application.evaluate(({Menu,BrowserWindow})=>({menuRemoved:Menu.getApplicationMenu()===null,menuBarVisible:BrowserWindow.getAllWindows()[0].isMenuBarVisible()}));assert.deepEqual(chrome,{menuRemoved:true,menuBarVisible:false});
  assert.equal(await w.locator('.app-title,.statusbar').count(),0);
  const security=await w.evaluate(()=>({require:typeof window.require,process:typeof window.process}));assert.deepEqual(security,{require:'undefined',process:'undefined'});
  const preferences=await application.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return{nodeIntegration:p.nodeIntegration,contextIsolation:p.contextIsolation,sandbox:p.sandbox,webSecurity:p.webSecurity};});
  assert.deepEqual(preferences,{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true});
  const remoteRequests=[],rendererErrors=[];
  w.on('request',r=>{if(/^https?:/.test(r.url()))remoteRequests.push(r.url());});
  w.on('pageerror',e=>rendererErrors.push(e.message));
  await w.context().setOffline(true);
  for(const locale of ['zh-CN','en-US']){
   await w.addInitScript(language=>Object.defineProperty(navigator,'language',{get:()=>language,configurable:true}),locale);
   await w.reload();await w.getByRole('navigation').waitFor();
   assert.equal(await w.locator('html').getAttribute('lang'),locale==='zh-CN'?'zh-CN':'en');
   assert.equal(await w.locator('nav button').first().innerText(),locale==='zh-CN'?'首页':'Home');
  for(const theme of ['dark','light']){
   await w.emulateMedia({colorScheme:theme});assert.equal(await w.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()),theme==='dark'?'#1c1d20':'#f8f5ef');
   await w.locator('nav button').first().click();
   await w.locator('.brand-mark').hover();
   await expect.poll(()=>w.locator('.module-card:hover').count()).toBe(0);
   const cardStyle=await w.locator('.module-card').evaluateAll(es=>es.map(e=>({background:getComputedStyle(e).backgroundColor,iconBackground:getComputedStyle(e.querySelector('.module-icon')).backgroundColor,iconColor:getComputedStyle(e.querySelector('.module-icon')).color})));
   for(const c of cardStyle){assert.equal(c.background,theme==='light'?'rgb(255, 253, 250)':'rgb(41, 43, 48)');assert.equal(c.iconBackground,theme==='light'?'rgb(12, 57, 103)':'rgb(34, 84, 135)');assert.equal(c.iconColor,'rgb(255, 255, 255)');}
   for(let i=0;i<4;i++){await w.locator('nav button').nth(i).click();assert.equal(await w.locator('nav button').nth(i).getAttribute('aria-current'),'page');}
  }
  }
  assert.deepEqual(remoteRequests,[]);assert.deepEqual(rendererErrors,[]);
  // Use actual native window events; the product keeps the Windows title bar.
  const nativeControls=electron.cloudWindows?await application.evaluate(async({BrowserWindow})=>{
   const win=BrowserWindow.getAllWindows()[0];const result={};
   async function transition(event,action,check){return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(event+' timed out')),5000);win.once(event,()=>{clearTimeout(timeout);resolve(check());});action();});}
   result.minimize=await transition('minimize',()=>win.minimize(),()=>win.isMinimized());
   result.restore=await transition('restore',()=>win.restore(),()=>!win.isMinimized());
   result.maximize=await transition('maximize',()=>win.maximize(),()=>win.isMaximized());
   result.unmaximize=await transition('unmaximize',()=>win.unmaximize(),()=>!win.isMaximized());
   return result;
  }):{executed:false,reason:'Native visible controls are checked only on isolated GitHub Actions runners'};if(electron.cloudWindows)assert.deepEqual(nativeControls,{minimize:true,restore:true,maximize:true,unmaximize:true});
  const closed=application.waitForEvent('close');await application.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await closed;
  const workspaceCheck=require('node:child_process').spawnSync(process.execPath,['--test','--test-name-pattern=create spaces then restart','tests/workspace-window.test.cjs'],{env:{...process.env,WORKSTATION_TEST_EXECUTABLE:executable},encoding:'utf8',timeout:60000});
  process.stdout.write(workspaceCheck.stdout||'');process.stderr.write(workspaceCheck.stderr||'');
  assert.equal(workspaceCheck.status,0,'Packaged workspace restart check failed');
  const appearanceCheck=require('node:child_process').spawnSync(process.execPath,['--test','--test-name-pattern=native appearance choices','tests/appearance-window.test.cjs'],{env:{...process.env,WORKSTATION_TEST_EXECUTABLE:executable},encoding:'utf8',timeout:120000});
  process.stdout.write(appearanceCheck.stdout||'');process.stderr.write(appearanceCheck.stderr||'');
  assert.equal(appearanceCheck.status,0,'Packaged appearance restart check failed');
  identity.path=identity.path.replace(folder,'<candidate>');
  const report={kind:'packaged-windows-candidate',identity,preferences,security,chrome,neutralHomeCards:true,verifiedPayloadSHA256:hashes,exeSHA256:crypto.createHash('sha256').update(fs.readFileSync(executable)).digest('hex'),archiveSHA256:crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),pagesPerTheme:4,themes:2,locales:2,offlineNavigation:true,remoteRequests:remoteRequests.length,rendererErrors:rendererErrors.length,nativeControls,windowCloseExits:true,packagedWorkspaceRestart:true,packagedAppearanceRestart:true,backgroundOnly:!electron.cloudWindows};
  fs.writeFileSync('docs/design/previews/runtime/package-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await application.close().catch(()=>{});fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
})().catch(e=>{console.error(e);process.exitCode=1});
