// Static workspace layout review, not an application or filesystem test.
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const dir=__dirname,preview=path.join(dir,'previews');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
 try{
  for(const width of [1440,1120,800,640,400]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
   const errors=[],remote=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
   await page.goto(pathToFileURL(path.join(dir,'d2-assets-dark.html')).href);
   await page.evaluate(async()=>{await document.fonts.ready});
   const layout=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
    const visible=s=>getComputedStyle(document.querySelector(s)).display!=='none';
    const clipped=[];for(const el of document.querySelectorAll('.asset-name,.asset-kind,.detail h2,.toolbar-label'))if(getComputedStyle(el).display!=='none'&&el.clientWidth&&el.scrollWidth>el.clientWidth+1)clipped.push(el.textContent);
    const vp=document.querySelector('.viewport');
    return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,rail:rect('.rail'),center:rect('.center'),context:rect('.context'),detail:rect('.detail'),inspectorVisible:visible('.detail'),contextVisible:visible('.context'),resourceTrigger:visible('.resource-trigger'),detailTrigger:visible('.detail-trigger'),review:rect('.review-strip'),settings:rect('.rail-bottom'),assetCount:document.querySelectorAll('.asset').length,selectedCount:document.querySelectorAll('.asset.selected').length,centralScroll:{width:vp.clientWidth,scrollWidth:vp.scrollWidth,height:vp.clientHeight,scrollHeight:vp.scrollHeight},clipped};
   });
   if(layout.pageWidth>width||layout.pageHeight>900||layout.centralScroll.scrollWidth>layout.centralScroll.width||layout.review.bottom>900||layout.settings.bottom>900||layout.rail.width!==56||layout.assetCount!==6||layout.selectedCount!==1||layout.inspectorVisible!==(width>=1120)||layout.contextVisible!==(width>=800)||layout.clipped.length||errors.length||remote.length)throw new Error(JSON.stringify({layout,errors,remote}));
   if(layout.center.width<(width>=640?480:320))throw new Error('central area below budget');
   if([1440,800,400].includes(width))await page.screenshot({path:path.join(preview,`d2-assets-dark-${width}.png`)});
   results.push({layout,errors,remote});await page.close();
  }
  const source=fs.readFileSync(path.join(dir,'d2-assets-dark.html'),'utf8');
  const d1=fs.readFileSync(path.join(dir,'../DESIGN_PROPOSAL_D1.md'),'utf8');
  const colors=[...d1.matchAll(/^\| `(--color-[\w-]+)`(?:（新增）)? \| (#[0-9A-F]{6})/gm)];
  for(const c of colors)if(!new RegExp(c[1]+':\\s*'+c[2],'i').test(source))throw new Error('color mismatch '+c[1]);
  fs.writeFileSync(path.join(preview,'d2-assets-validation.json'),JSON.stringify({date:'2026-10-20',kind:'static-design-only',tokenMatches:colors.length,results},null,2)+'\n');
  console.log(JSON.stringify({tokenMatches:colors.length,viewports:results.map(x=>({width:x.layout.width,central:x.layout.center.width,context:x.layout.contextVisible,inspector:x.layout.inspectorVisible,errors:x.errors.length,remote:x.remote.length}))},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
