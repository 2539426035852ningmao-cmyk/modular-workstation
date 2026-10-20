// Verify the owner's specific feedback: opaque selected surfaces and filled icon bodies.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
const files=['home','assets','plugins-empty','plugins-permissions'].flatMap(v=>['dark','light'].map(t=>`d2-${v}-${t}.html`)).concat(['home','assets','plugins'].flatMap(v=>['dark','light'].map(t=>`d2-states-${v}-${t}.html`)),'d2-theme-review.html');
const selectors=['.nav-item.active','.tree-item.active','.category.active','.view-toggle span:first-child','.tab','.filter-tabs .selected','.asset.selected .asset-meta','.state-controls input:checked+label','.page-choice:checked+label'];
const luminance=rgb=>{const c=rgb.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
 try{
  for(const file of files){
   const p=await browser.newPage({viewport:{width:1440,height:900}});await p.goto(pathToFileURL(path.join(__dirname,file)).href);
   const data=await p.evaluate(selectors=>({surfaces:selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const s=getComputedStyle(e);return {selector,background:s.backgroundColor,foreground:s.color}})),icons:[...document.querySelectorAll('symbol[id="home"],symbol[id="workspace"],symbol[id="folder"],symbol[id="plugin"],symbol[id="settings"],symbol[id="warning"]')].map(e=>({id:e.id,fill:e.firstElementChild.getAttribute('fill'),stroke:e.firstElementChild.getAttribute('stroke')}))}),selectors);
   assert.ok(data.surfaces.length>0);
   for(const surface of data.surfaces){assert.equal(surface.background,'rgb(37, 99, 235)',file+surface.selector);assert.equal(surface.foreground,'rgb(255, 255, 255)',file+surface.selector);const a=luminance(surface.foreground),b=luminance(surface.background);surface.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(surface.contrast>=4.5);}
   for(const icon of data.icons){assert.equal(icon.fill,'currentColor');assert.equal(icon.stroke,'none');}
   data.warnings=await p.locator('.state-card.warning .state-emblem').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,foreground:s.color}}));
   for(const warning of data.warnings){assert.equal(warning.background,'rgb(220, 38, 38)');assert.equal(warning.foreground,'rgb(255, 255, 255)');const a=luminance(warning.foreground),b=luminance(warning.background);warning.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(warning.contrast>=4.5);}
   results.push({file,...data});await p.close();
  }
  fs.writeFileSync(path.join(__dirname,'previews/d2-solid-validation.json'),JSON.stringify({kind:'static-design-only',date:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify({sources:results.length,filledSelectedSurfaces:results.reduce((n,r)=>n+r.surfaces.length,0),filledIconDefinitions:results.reduce((n,r)=>n+r.icons.length,0),minTextContrast:Math.min(...results.flatMap(r=>r.surfaces.map(s=>s.contrast)))}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
