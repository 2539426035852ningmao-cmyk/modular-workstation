// Static light-design verification. Does not test application themes or features.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const {variants,generate}=require('./generate-d2-light.cjs');
const dir=__dirname,preview=path.join(dir,'previews');
const luminance=h=>{const c=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
(async()=>{
 const colors=generate(),byName=Object.fromEntries(colors.map(x=>[x.name,x.light])),contrastResults=[],results=[],sources=[];
 const check=(fg,bg,minimum)=>{const ratio=contrast(byName[fg],byName[bg]);contrastResults.push({fg,bg,minimum,ratio});if(ratio<minimum)throw new Error('Contrast below threshold: '+JSON.stringify(contrastResults.at(-1)))};
 for(const fg of ['--color-text','--color-muted','--color-subtle','--color-accent','--color-success','--color-warning','--color-error','--color-info'])for(const bg of ['--color-bg','--color-sidebar','--color-surface','--color-surface-subtle','--color-surface-elevated','--color-selected'])check(fg,bg,4.5);
 for(const fg of ['--color-focus','--color-selected-border','--color-border'])for(const bg of ['--color-bg','--color-surface','--color-selected'])check(fg,bg,3);
 check('--color-on-accent','--color-accent-solid',4.5);
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const variant of variants){
   const file=path.join(dir,`d2-${variant}-light.html`),source=fs.readFileSync(file,'utf8');
   if(/<script\b|<iframe\b/i.test(source))throw new Error('Static design must not execute business scripts');
   sources.push({file:path.basename(file),sha256:crypto.createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex')});
   for(const [width,height] of [[1440,900],[1120,900],[800,900],[640,900],[400,900],[800,540]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[],remote=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
    await page.goto(pathToFileURL(file).href);await page.evaluate(async()=>{await document.fonts.ready});
    const layout=await page.evaluate(names=>{
     const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
     const visible=s=>{const el=document.querySelector(s);return !!el&&getComputedStyle(el).display!=='none'};
     const center=document.querySelector('.center');
     const clipped=[...document.querySelectorAll('h1,h2,h3,.control,.asset-name,.asset-kind,.source-table dd,.permission-facts li,.start-copy p,.module p')].filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent);
     const root=getComputedStyle(document.documentElement);
     return {viewport:{width:innerWidth,height:innerHeight},pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,rail:box('.rail'),topbar:box('.topbar'),review:box('.review-strip'),settings:box('.rail-bottom'),center:center?{width:center.clientWidth,scrollWidth:center.scrollWidth}:null,contextVisible:visible('.context'),inspectorVisible:visible('.detail'),resourceTrigger:visible('.resource-trigger'),categoryTrigger:visible('.category-trigger'),moduleColumns:document.querySelector('.modules')?getComputedStyle(document.querySelector('.modules')).gridTemplateColumns.split(' ').length:null,clipped,colorScheme:root.colorScheme,tokens:Object.fromEntries(names.map(n=>[n,root.getPropertyValue(n).trim().toUpperCase()]))};
    },colors.map(x=>x.name));
    for(const color of colors)if(layout.tokens[color.name]!==color.light)throw new Error('Computed theme mismatch: '+variant+' '+color.name);
    if(layout.colorScheme!=='light'||layout.pageWidth>width||layout.rail.width!==56||layout.topbar.height!==48||layout.clipped.length||errors.length||remote.length)throw new Error(JSON.stringify({variant,layout,errors,remote}));
    if(variant==='home'){
     const columns=width>900?3:width>640?2:1;
     if(layout.moduleColumns!==columns)throw new Error('Home column mismatch');
     if(width===1440&&layout.review.bottom>height)throw new Error('Main home review label below viewport');
    }else{
     if(layout.pageHeight>height||layout.center.scrollWidth>layout.center.width||layout.center.width<320||layout.contextVisible!==(width>=800)||layout.review.bottom>height||layout.settings.bottom>height)throw new Error('Workspace overflow: '+JSON.stringify(layout));
     if(variant==='assets'&&layout.inspectorVisible!==(width>=1120))throw new Error('Inspector breakpoint mismatch');
     if(variant.startsWith('plugins')&&(layout.inspectorVisible||layout.categoryTrigger!==(width<800)))throw new Error('Plugin panel mismatch');
    }
    if(height===900&&[1440,800,400].includes(width))await page.screenshot({path:path.join(preview,`d2-${variant}-light-${width}.png`),fullPage:variant==='home'&&width!==1440});
    const end=await page.evaluate(variant=>{
     const center=document.querySelector(variant==='assets'?'.viewport':'.center');
     if(center)center.scrollTop=center.scrollHeight;else scrollTo(0,document.documentElement.scrollHeight);
     const target=document.querySelector(variant==='plugins-permissions'?'.detail-actions':variant==='plugins-empty'?'.notice':variant==='assets'?'.asset:last-child':'.home-note'),r=target.getBoundingClientRect(),bounds=center?center.getBoundingClientRect():{top:0,bottom:innerHeight};
     const settings=document.querySelector('.rail-bottom').getBoundingClientRect();
     return {endReachable:r.bottom<=bounds.bottom+1&&r.top>=bounds.top,settingsVisible:settings.top>=0&&settings.bottom<=innerHeight,installBlocked:variant!=='plugins-permissions'||document.querySelector('.disabled').getAttribute('aria-disabled')==='true'};
    },variant);
    if(!end.endReachable||!end.settingsVisible||!end.installBlocked)throw new Error(JSON.stringify({variant,width,height,end}));
    results.push({variant,layout,end,errors,remote});await page.close();
   }
  }
  fs.writeFileSync(path.join(preview,'d2-light-validation.json'),JSON.stringify({date:new Date().toISOString().slice(0,10),kind:'static-design-only',tokenMatchesPerSource:colors.length,sourceHashFormat:'sha256-of-utf8-with-lf-newlines',sources,contrastResults,results},null,2)+'\n');
  console.log(JSON.stringify({sources:sources.length,cases:results.length,tokenMatchesPerSource:colors.length,contrastChecks:contrastResults.length,minTextContrast:Math.min(...contrastResults.filter(x=>x.minimum===4.5).map(x=>x.ratio)),minBoundaryContrast:Math.min(...contrastResults.filter(x=>x.minimum===3).map(x=>x.ratio)),errors:results.reduce((n,x)=>n+x.errors.length,0),remoteRequests:results.reduce((n,x)=>n+x.remote.length,0)},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
