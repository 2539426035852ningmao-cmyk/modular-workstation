const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {test}=require('node:test');const electron=require('./helpers/electron.cjs');
const out=path.join(__dirname,'../docs/design/previews/runtime');
const sizes=[[1440,960,1],[1120,760,1],[800,540,1],[1120,760,1.25],[1120,760,1.5],[800,540,2]];
const colors={dark:['rgb(28, 29, 32)','rgb(34, 84, 135)'],light:['rgb(248, 245, 239)','rgb(12, 57, 103)']};
test('approved themes, navigation, density, contrast and control states in Electron',async()=>{
 const app=await electron.launch({args:[path.join(__dirname,'..')]});fs.mkdirSync(out,{recursive:true});
 const results=[],requests=[],errors=[];let minimumContrast=Infinity;
 try{
  const page=await app.firstWindow();page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('navigation').waitFor();
  for(const locale of ['zh-CN','en-US']){
   await page.addInitScript(language=>Object.defineProperty(navigator,'language',{get:()=>language,configurable:true}),locale);await page.reload();
   for(const [theme,[bg,blue]] of Object.entries(colors)){
    await page.emulateMedia({colorScheme:theme,reducedMotion:'no-preference'});
    for(const [width,height,zoom] of sizes){
     await app.evaluate(({BrowserWindow},{width,height,zoom})=>{const w=BrowserWindow.getAllWindows()[0];w.setContentSize(width,height);w.webContents.setZoomFactor(zoom);},{width,height,zoom});
     for(let index=0;index<4;index++){
      const nav=page.locator('nav button').nth(index);await nav.click();await nav.focus();
      assert.equal(await nav.getAttribute('aria-current'),'page');assert.ok(await nav.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth)>=2));
      assert.equal(await page.locator('.shell').evaluate(e=>getComputedStyle(e).backgroundColor),bg);
      if(theme==='dark')assert.equal(await nav.evaluate(e=>getComputedStyle(e).backgroundColor),blue);
      const metrics=await page.evaluate(()=>{
       const rgb=s=>s.match(/[\d.]+/g).map(Number);const lum=c=>{c=c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
       const pairs=[],clipped=[];for(const e of document.querySelectorAll('body *')){
        const r=e.getBoundingClientRect();if(!r.width||!r.height||e.closest('svg')||e.classList.contains('skip-link'))continue;
        if(e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible')clipped.push(e.className);
        if(![...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()))continue;
        let a=e,background;while(a){const c=rgb(getComputedStyle(a).backgroundColor);if(c.length===3||c[3]===1){background=c;break;}a=a.parentElement;}
        if(background){const x=lum(rgb(getComputedStyle(e).color)),y=lum(background);pairs.push({text:e.textContent.trim().slice(0,35),contrast:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)});}
       }return{visible:innerWidth,content:document.documentElement.scrollWidth,clipped,pairs};
      });
      assert.ok(metrics.content<=metrics.visible+1,JSON.stringify({locale,theme,width,zoom,index,metrics}));assert.deepEqual(metrics.clipped,[],JSON.stringify({locale,theme,width,zoom,index}));
      for(const p of metrics.pairs){minimumContrast=Math.min(minimumContrast,p.contrast);assert.ok(p.contrast>=4.5,JSON.stringify({locale,theme,index,...p}));}
      if(index===0){
       for(const s of ['.primary:visible'])assert.equal(await page.locator(s).evaluate(e=>getComputedStyle(e).backgroundColor),blue);
       if(width===1440)assert.equal(await page.locator('.context-current').evaluate(e=>getComputedStyle(e).backgroundColor),blue);
       assert.notEqual(await page.locator('.search-surface').evaluate(e=>getComputedStyle(e).boxShadow),'none');
      }else{
       const disabled=page.locator('button:disabled:visible');if(index===2){assert.equal(await disabled.count(),1);assert.equal(await disabled.evaluate(e=>getComputedStyle(e).opacity),'1');}
      }
      if(locale==='zh-CN'&&((width===1440&&zoom===1)||(width===800&&zoom===2)))await page.screenshot({path:path.join(out,`${theme}-${['home','workspace','plugins','settings'][index]}-${zoom===2?'400':'1440'}.png`)});
      results.push({locale,theme,width,height,zoom,page:index,viewport:metrics.visible,textPairs:metrics.pairs.length});
     }
    }
   }
  }
  // Test available actions, not demo business records.
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.webContents.setZoomFactor(1);w.setContentSize(1120,760);});
  await page.locator('nav button').nth(0).click();const primary=page.locator('.primary:visible');await primary.hover();
  assert.notEqual(await primary.evaluate(e=>getComputedStyle(e).filter),'none');
  await primary.focus();assert.ok(await primary.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth)>=2));
  const box=await primary.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.notEqual(await primary.evaluate(e=>getComputedStyle(e).transform),'none');await page.mouse.up();
  assert.equal(await page.locator('nav button').nth(1).getAttribute('aria-current'),'page');
  await page.locator('nav button').nth(0).click();await page.emulateMedia({reducedMotion:'reduce'});const b=await primary.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();assert.equal(await primary.evaluate(e=>getComputedStyle(e).transform),'none');await page.mouse.up();
  await page.locator('nav button').nth(0).click();await page.locator('.module-card').nth(1).click();assert.equal(await page.locator('nav button').nth(1).getAttribute('aria-current'),'page');
  // Style-only probes exercise shared loading/warning/error presentation. No fake application tasks.
  const feedback=[];for(const theme of ['dark','light']){await page.emulateMedia({colorScheme:theme});
   for(const tone of ['loading','warning','error']){
    const sample=await page.evaluate(tone=>{const panel=document.createElement('div');panel.className='state-panel';panel.dataset.tone=tone;const icon=document.createElement('div');icon.className='state-emblem';panel.append(icon);document.body.append(panel);const s=getComputedStyle(icon);const result={background:s.backgroundColor,foreground:s.color};panel.remove();return result;},tone);
    if(tone!=='loading'){assert.equal(sample.background,'rgb(201, 59, 59)');assert.equal(sample.foreground,'rgb(255, 255, 255)');}else assert.equal(sample.background,colors[theme][1]);feedback.push({theme,tone,...sample});
   }
  }
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify({kind:'running-electron-shell',cases:results.length,minimumContrast,remoteRequests:requests,rendererErrors:errors,feedbackStyleProbes:feedback,results},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,minimumContrast,remoteRequests:requests.length,rendererErrors:errors.length,feedbackStyleProbes:feedback.length}));
 }finally{await app.close()}
});
