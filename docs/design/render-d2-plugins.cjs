// Static visual checks only: no plugin installation, authorization or app test.
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const dir=__dirname,preview=path.join(dir,'previews');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
 try{
  const spec=fs.readFileSync(path.join(dir,'../DESIGN_PROPOSAL_D1.md'),'utf8');
  const tokens=[...spec.matchAll(/^\| `(--color-[\w-]+)`(?:（新增）)? \| (#[0-9A-F]{6})/gm)];
  if(tokens.length!==23)throw new Error('Review token inventory before rendering');
  for(const state of ['empty','permissions']){
   const file=path.join(dir,`d2-plugins-${state}-dark.html`),source=fs.readFileSync(file,'utf8');
   for(const token of tokens)if(!new RegExp(token[1]+':\\s*'+token[2],'i').test(source))throw new Error('Token mismatch '+token[1]);
   if(/<script\b|<iframe\b/i.test(source))throw new Error('Static source must not execute scripts');
   for(const [width,height] of [[1440,900],[1120,900],[800,900],[640,900],[400,900],[800,540]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[],remote=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
    await page.goto(pathToFileURL(file).href);await page.evaluate(async()=>{await document.fonts.ready});
    const layout=await page.evaluate(()=>{
     const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
     const visible=s=>getComputedStyle(document.querySelector(s)).display!=='none';
     const center=document.querySelector('.center');
     const clipped=[...document.querySelectorAll('h1,h2,.control,.source-table dd,.permission-facts li,.filter-tabs')].filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent);
     return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,rail:box('.rail'),center:box('.center'),centerWidth:center.clientWidth,centerScrollWidth:center.scrollWidth,contextVisible:visible('.context'),categoryTrigger:visible('.category-trigger'),settings:box('.rail-bottom'),review:box('.review-strip'),inspectorCount:document.querySelectorAll('.detail').length,clipped};
    });
    if(layout.pageWidth>width||layout.pageHeight>height||layout.centerScrollWidth>layout.centerWidth||layout.center.width<320||layout.rail.width!==56||layout.settings.bottom>height||layout.review.bottom>height||layout.contextVisible!==(width>=800)||layout.categoryTrigger!==(width<800)||layout.inspectorCount||layout.clipped.length||errors.length||remote.length)throw new Error(JSON.stringify({state,layout,errors,remote}));
    if(height===900&&[1440,800,400].includes(width))await page.screenshot({path:path.join(preview,`d2-plugins-${state}-dark-${width}.png`)});
    const bottom=await page.evaluate(state=>{
     const center=document.querySelector('.center');center.scrollTop=center.scrollHeight;
     const target=document.querySelector(state==='permissions'?'.detail-actions':'.notice'),r=target.getBoundingClientRect(),c=center.getBoundingClientRect();
     const disabled=document.querySelector('.disabled');
     return {endReachable:r.bottom<=c.bottom+1&&r.top>=c.top,installBlocked:state!=='permissions'||disabled?.getAttribute('aria-disabled')==='true',scrollTop:center.scrollTop};
    },state);
    if(!bottom.endReachable||!bottom.installBlocked)throw new Error(JSON.stringify({state,width,height,bottom}));
    results.push({state,layout,bottom,errors,remote});await page.close();
   }
  }
  fs.writeFileSync(path.join(preview,'d2-plugins-validation.json'),JSON.stringify({date:new Date().toISOString().slice(0,10),kind:'static-design-only',tokenMatchesPerSource:tokens.length,results},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,tokenMatchesPerSource:tokens.length,errors:results.reduce((n,x)=>n+x.errors.length,0),remoteRequests:results.reduce((n,x)=>n+x.remote.length,0),widths:[1440,1120,800,640,400],extraViewport:'800x540'},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
