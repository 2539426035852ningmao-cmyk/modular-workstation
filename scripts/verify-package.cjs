// Check an existing Windows Candidate without overwriting or installing it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {_electron:electron}=require('@playwright/test');
(async()=>{
 const folder=path.resolve(process.argv[2]||'../../outputs/theme-candidate-20261020/ModularWorkstation-win32-x64');
 const executable=path.join(folder,'ModularWorkstation.exe'),archive=path.join(folder,'resources/app.asar');
 const {extractFile}=await import('@electron/asar');const hashes={};
 for(const file of ['electron/main.cjs','package.json','dist/index.html',...fs.readdirSync('dist/assets').map(n=>'dist/assets/'+n)]){
  const packed=extractFile(archive,path.normalize(file));
  if(file==='package.json'){
   const a=JSON.parse(packed),b=JSON.parse(fs.readFileSync(file));
   for(const key of ['name','version','main','type','dependencies'])assert.deepEqual(a[key],b[key],key);
   assert.equal(a.devDependencies,undefined);
  }else assert.deepEqual(packed,fs.readFileSync(file),file);
  hashes[file]=crypto.createHash('sha256').update(packed).digest('hex');
 }
 const application=await electron.launch({executablePath:executable,args:[]});
 try{
  const w=await application.firstWindow();await w.getByRole('navigation').waitFor();
  const identity=await application.evaluate(({app})=>({name:app.getName(),version:app.getVersion(),path:app.getAppPath()}));
  assert.equal(path.resolve(identity.path),archive);assert.equal(identity.version,'0.1.0-prototype');
  const security=await w.evaluate(()=>({require:typeof window.require,process:typeof window.process}));assert.deepEqual(security,{require:'undefined',process:'undefined'});
  const preferences=await application.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return{nodeIntegration:p.nodeIntegration,contextIsolation:p.contextIsolation,sandbox:p.sandbox,webSecurity:p.webSecurity};});
  assert.deepEqual(preferences,{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true});
  for(const theme of ['dark','light']){
   await w.emulateMedia({colorScheme:theme});assert.equal(await w.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()),theme==='dark'?'#1c1d20':'#f8f5ef');
   for(let i=0;i<4;i++){await w.locator('nav button').nth(i).click();assert.equal(await w.locator('nav button').nth(i).getAttribute('aria-current'),'page');}
  }
  const closed=application.waitForEvent('close');await application.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await closed;
  identity.path=identity.path.replace(folder,'<candidate>');
  const report={kind:'packaged-windows-candidate',identity,preferences,security,verifiedPayloadSHA256:hashes,exeSHA256:crypto.createHash('sha256').update(fs.readFileSync(executable)).digest('hex'),archiveSHA256:crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),pagesPerTheme:4,themes:2,windowCloseExits:true};
  fs.writeFileSync('docs/design/previews/runtime/package-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await application.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1});
