// Isolated experiment. Reuses the application's installed Playwright and shipped frontend.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { spawn, execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const net = require('node:net');
const root = __dirname;
const repo = path.resolve(root, '../../work/modular-workstation');
const { _electron, chromium } = createRequire(path.join(repo, 'package.json'))('@playwright/test');
const electronExe = path.resolve(repo, '../portable/ModularWorkstation-win32-x64/ModularWorkstation.exe');
const tauriExe = path.join(root, 'tauri-candidate/src-tauri/target/release/tauri-candidate.exe');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
function memory(pid) {
  const command = `$all=Get-CimInstance Win32_Process; $map=@{};foreach($p in $all){$map[[int]$p.ProcessId]=$p}; $ids=[Collections.Generic.HashSet[int]]::new(); [void]$ids.Add(${pid}); do{$changed=$false; foreach($p in $all){$parent=$map[[int]$p.ParentProcessId];if($parent -and $p.CreationDate -ge $parent.CreationDate -and $ids.Contains([int]$p.ParentProcessId) -and -not $ids.Contains([int]$p.ProcessId)){[void]$ids.Add([int]$p.ProcessId);$changed=$true}}}while($changed); @($all|Where-Object {$ids.Contains([int]$_.ProcessId)}|ForEach-Object {[pscustomobject]@{pid=$_.ProcessId;parent=$_.ParentProcessId;createdAtUtc=$_.CreationDate.ToUniversalTime().ToString('o');name=$_.Name;workingSetBytes=[long]$_.WorkingSetSize;privateBytes=[long]$_.PrivatePageCount}})|ConvertTo-Json -Compress`;
  const value = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', command], {encoding:'utf8'}));
  const processes = Array.isArray(value) ? value : [value];
  return {processes, workingSetBytes:processes.reduce((n,p)=>n+p.workingSetBytes,0), privateBytes:processes.reduce((n,p)=>n+p.privateBytes,0)};
}
async function freePort() {
  const server=net.createServer(); await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port; await new Promise(r=>server.close(r)); return port;
}
async function check(page, framework) {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const remoteRequests=[];
  page.on('request',request=>{if(/^https?:/.test(request.url()) && !/^http:\/\/(tauri|ipc)\.localhost(?::\d+)?\//.test(request.url()))remoteRequests.push(request.url());});
  assert.equal(await page.locator('nav button').count(),4);
  const globals=await page.evaluate(()=>({require:typeof window.require,process:typeof window.process}));
  assert.deepEqual(globals,{require:'undefined',process:'undefined'});
  await page.context().setOffline(true);
  for(const locale of ['zh-CN','en-US']) {
    await page.addInitScript(language=>Object.defineProperty(navigator,'language',{get:()=>language,configurable:true}),locale);
    await page.reload(); await page.getByRole('navigation').waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'),locale==='zh-CN'?'zh-CN':'en');
    for(const theme of ['light','dark']) {
      await page.emulateMedia({colorScheme:theme});
      assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()),theme==='light'?'#f8f5ef':'#1c1d20');
      for(let i=0;i<4;i++) {await page.locator('nav button').nth(i).click();assert.equal(await page.locator('nav button').nth(i).getAttribute('aria-current'),'page');}
    }
  }
  await page.locator('nav button').first().click();
  await page.screenshot({path:path.join(root,framework+'-home.png')});
  const nativeProbe=framework==='tauri' ? await page.evaluate(async()=>{
    if(!window.__TAURI_INTERNALS__?.invoke)return {available:false};
    try {await window.__TAURI_INTERNALS__.invoke('plugin:fs|read_text_file',{path:'C:/modular-workstation-ungranted-probe.txt'});return {available:true,denied:false};}
    catch(e){return {available:true,denied:true,error:String(e)};}
  }) : {available:false,reason:'No preload or IPC bridge registered'};
  if(nativeProbe.available)assert.equal(nativeProbe.denied,true);
  assert.deepEqual(errors,[]);
  assert.deepEqual(remoteRequests,[]);
  return {locales:2,themes:2,pages:4,offlineReload:true,rendererGlobals:globals,nativeProbe,rendererErrors:errors,remoteRequests};
}
async function launch(framework,index) {
  let application,browser,child; const started=performance.now();
  try {
    let page,pid,inspectionPort;
    if(framework==='electron') {
      application=await _electron.launch({executablePath:electronExe,args:[]});
      page=await application.firstWindow(); pid=application.process().pid;
    } else {
      const port=await freePort();
      inspectionPort=port;
      child=spawn(tauriExe,[],{cwd:path.dirname(tauriExe),windowsHide:true,env:{...process.env,WEBVIEW2_USER_DATA_FOLDER:path.join(root,'webview-profile'),WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:`--remote-debugging-address=127.0.0.1 --remote-debugging-port=${port}`},stdio:['ignore','pipe','pipe']});
      child.stdout.on('data',data=>fs.appendFileSync(path.join(root,'tauri-runtime.log'),data));
      child.stderr.on('data',data=>fs.appendFileSync(path.join(root,'tauri-runtime.log'),data));
      let ready=false;
      for(let attempt=0;attempt<200;attempt++) {
        if(child.exitCode!==null)throw new Error('Tauri exited before renderer ready: '+child.exitCode);
        try {const response=await fetch(`http://127.0.0.1:${port}/json/version`);if(response.ok){ready=true;break;}}catch{}
        await sleep(100);
      }
      assert.ok(ready,'WebView2 inspection endpoint unavailable');
      browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      const context=browser.contexts()[0];
      page=context.pages()[0]||await context.waitForEvent('page',{timeout:15000}); pid=child.pid;
    }
    await page.locator('#page-title').waitFor({state:'visible',timeout:20000});
    const startupMs=performance.now()-started;
    if(inspectionPort){
      const listeners=execFileSync('powershell.exe',['-NoProfile','-Command',`Get-NetTCPConnection -State Listen -LocalPort ${inspectionPort} | Select-Object LocalAddress,LocalPort | ConvertTo-Json -Compress`],{encoding:'utf8'});
      const bindings=JSON.parse(listeners);for(const binding of (Array.isArray(bindings)?bindings:[bindings]))assert.ok(['127.0.0.1','::1'].includes(binding.LocalAddress),'Inspection exposed beyond loopback');
    }
    await sleep(3000);
    const sample=memory(pid);
    const result={framework,index,startupMs,...sample};
    if(index===0)result.checks=await check(page,framework);
    results.push(result);fs.writeFileSync(path.join(root,'comparison-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({framework,index,startupMs,workingSetMiB:sample.workingSetBytes/1048576,privateMiB:sample.privateBytes/1048576,processes:sample.processes.length}));
  } finally {
    if(application)await application.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    if(child && child.exitCode===null){child.kill();await new Promise(resolve=>{child.once('exit',resolve);setTimeout(resolve,5000);});}
  }
}
(async()=>{await launch('electron',0);await launch('tauri',0);})().catch(error=>{fs.writeFileSync(path.join(root,'comparison-failure.txt'),error.stack);console.error(error);process.exitCode=1;});
