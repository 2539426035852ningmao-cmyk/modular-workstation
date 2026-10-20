const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const {generate}=require('./generate-d2-states.cjs');
(async()=>{
 const {groups,colors}=generate(),results=[],preview=path.join(__dirname,'previews');
 fs.mkdirSync(preview,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const group of groups)for(const theme of ['dark','light'])for(const [width,height]of [[1440,900],[1120,900],[800,900],[640,900],[400,900],[800,540]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[],remote=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
   const file=path.join(__dirname,`d2-states-${group.id}-${theme}.html`);
   assert.ok(!/<script\b|<iframe\b/i.test(fs.readFileSync(file,'utf8')));
   await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
   // Native radio group: keyboard selection must change the visible design.
   await page.locator('input[name=state]').first().focus();
   await page.keyboard.press('ArrowRight');
   assert.equal(await page.locator('input[name=state]:checked').getAttribute('id'),'state-'+group.states[1].id);
   const focus=await page.locator('input[name=state]:checked').evaluate(e=>getComputedStyle(e.nextElementSibling).outlineStyle);
   assert.equal(focus,'solid');
   for(const state of group.states){
    // Labels, rather than hidden inputs, are the actual pointer targets.
    await page.locator(`label[for=state-${state.id}]`).click();
    const data=await page.evaluate(({state,colors,theme})=>{
     const visible=[...document.querySelectorAll('.state-card')].filter(e=>getComputedStyle(e).display!=='none');
     const el=visible[0],root=getComputedStyle(document.documentElement);
     const clipped=[...el.querySelectorAll('h2,p,.control,.safety-note,.pending-line')].filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent);
     const tokens=colors.every(c=>root.getPropertyValue(c.name).trim().toLowerCase()===c[theme].toLowerCase());
     return {visible:visible.map(e=>e.dataset.state),title:el.querySelector('h2').textContent,pageWidth:document.documentElement.scrollWidth,clipped,tokens,scheme:root.colorScheme,settings:!!document.querySelector('.rail-bottom'),brokenIcons:[...document.querySelectorAll('use')].filter(e=>!document.querySelector(e.getAttribute('href'))).length};
    },{state,colors,theme});
    assert.deepEqual(data.visible,[state.id]);assert.equal(data.title,state.title);assert.equal(data.pageWidth,width);assert.deepEqual(data.clipped,[]);assert.ok(data.tokens);assert.equal(data.scheme,theme);assert.equal(data.brokenIcons,0);
    const safety=page.locator(`.s-${state.id} .safety-note`);
    await safety.scrollIntoViewIfNeeded();
    const inView=await safety.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1});
    assert.ok(inView,'Safety note must be reachable');
    if(width===1440&&state.id===group.preview){await page.locator('.artboard').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(preview,`d2-states-${group.id}-${theme}-1440.png`)});}
    if(theme==='dark'&&group.id==='assets'&&state.id==='missing'&&[800,400].includes(width)&&height===900){await page.locator('.viewport').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(preview,`d2-states-assets-dark-${width}.png`)});}
    results.push({group:group.id,theme,state:state.id,width,height,...data});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);await page.close();
  }
  const index=await browser.newPage({viewport:{width:1440,height:1000}});
  await index.goto(pathToFileURL(path.join(__dirname,'d2-state-review.html')).href);
  const images=await index.locator('img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0));assert.ok(images);assert.equal(await index.locator('a').count(),6);
  await index.screenshot({path:path.join(preview,'d2-state-review-1440.png'),fullPage:true});
  await index.setViewportSize({width:400,height:900});assert.equal(await index.evaluate(()=>document.documentElement.scrollWidth),400);
  await index.close();
  const sources=groups.flatMap(g=>['dark','light'].map(t=>{
   const file=`d2-states-${g.id}-${t}.html`;
   return {file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file),'utf8').replace(/\r\n/g,'\n')).digest('hex')};
  }));
  fs.writeFileSync(path.join(preview,'d2-states-validation.json'),JSON.stringify({date:new Date().toISOString(),kind:'static-design-only',interaction:'review selectors only; business controls are inert artwork',sourceHashFormat:'sha256-of-utf8-with-lf-newlines',sources,indexImages:6,results},null,2)+'\n');
  console.log(JSON.stringify({staticCases:results.length,sources:6,statesPerTheme:groups.reduce((n,g)=>n+g.states.length,0),tokensPerSource:colors.length,keyboardCases:36,indexImages:6,remoteRequests:0,consoleErrors:0}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
