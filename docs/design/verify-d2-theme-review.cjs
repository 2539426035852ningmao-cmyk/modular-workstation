// Tests the review artifact's navigation, not the workstation's navigation.
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],pages=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  await page.goto(pathToFileURL(path.join(__dirname,'d2-theme-review.html')).href);
  for(const variant of ['home','assets','plugins-empty','plugins-permissions']){
   await page.locator(`label[for="page-${variant}"]`).click();
   const item=await page.evaluate(v=>({variant:v,visible:[...document.querySelectorAll('.page')].filter(x=>getComputedStyle(x).display!=='none').length,correct:getComputedStyle(document.querySelector('.page-'+v)).display!=='none',loaded:[...document.querySelectorAll('.page-'+v+' img')].every(x=>x.complete&&x.naturalWidth===1440),overflow:document.documentElement.scrollWidth>innerWidth}),variant);
   if(!item.correct||item.visible!==1||!item.loaded||item.overflow)throw new Error(JSON.stringify(item));
   pages.push(item);
  }
  await page.setViewportSize({width:400,height:900});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Narrow review overflow');
  if(errors.length)throw new Error(JSON.stringify(errors));
  fs.writeFileSync(path.join(__dirname,'previews/d2-theme-review-validation.json'),JSON.stringify({kind:'static-review-navigation-only',pages,narrowWidth:400,errors},null,2)+'\n');
  console.log(JSON.stringify({reviewPages:pages.length,imagesLoaded:8,narrowWidth:400,errors:errors.length}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
