// Static design export only. Requires existing dev dependencies and Microsoft Edge.
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const {chromium} = require('@playwright/test');
const root = path.resolve(__dirname, '../..');
const previewDir = path.join(root, 'docs/design/previews');
const outputDir = previewDir;
fs.mkdirSync(previewDir, {recursive:true});
(async () => {
  const browser = await chromium.launch({channel:'msedge', headless:true});
  const results = [];
  try {
    for (const width of [1440,800,400]) {
      const page = await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
      const errors = [], remote = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', e => { if(e.type()==='error') errors.push(e.text()); });
      page.on('request', r => { if(/^https?:/.test(r.url())) remote.push(r.url()); });
      await page.goto(pathToFileURL(path.join(root,'docs/design/d2-home-dark.html')).href);
      await page.evaluate(async () => { await document.fonts.ready; });
      const layout = await page.evaluate(() => {
        const rect = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
        const clipped=[];
        for(const el of document.querySelectorAll('.nav-item span,.start-copy h2,.start-copy p,.module h3,.module p,.recent h3,.recent p')) if(el.scrollWidth>el.clientWidth+1)clipped.push(el.textContent);
        return {viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},rail:rect('.rail'),topbar:rect('.topbar'),content:rect('.content'),start:rect('.start-panel'),review:rect('.review-strip'),moduleColumns:getComputedStyle(document.querySelector('.modules')).gridTemplateColumns.split(' ').length,moduleCount:document.querySelectorAll('.module').length,clipped,fonts:{segoe:document.fonts.check('14px "Segoe UI"'),yahei:document.fonts.check('14px "Microsoft YaHei UI"')}};
      });
      if(layout.document.width>width)throw new Error('horizontal overflow: '+JSON.stringify(layout));
      if(layout.rail.width!==56||layout.topbar.height!==48||layout.moduleCount!==3||layout.moduleColumns!==({1440:3,800:2,400:1}[width])) throw new Error('layout mismatch: '+JSON.stringify(layout));
      if(layout.clipped.length||errors.length||remote.length)throw new Error(JSON.stringify({layout,errors,remote}));
      if(width===1440 && layout.review.bottom>900)throw new Error('review label outside main screenshot');
      await page.evaluate(() => scrollTo(0,document.documentElement.scrollHeight));
      const settingsReachable = await page.locator('.rail-bottom').evaluate(el => { const r=el.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight; });
      if(!settingsReachable)throw new Error('global settings leaves viewport during scroll');
      await page.evaluate(() => scrollTo(0,0));
      const filename=`d2-home-dark-${width}.png`;
      await page.screenshot({path:path.join(previewDir,filename),fullPage:width!==1440});

      results.push({width,layout,errors,remote,settingsReachableAfterScroll:settingsReachable,fullPage:width!==1440});
      await page.close();
    }
    const d1=fs.readFileSync(path.join(root,'docs/DESIGN_PROPOSAL_D1.md'),'utf8');
    const source=fs.readFileSync(path.join(root,'docs/design/d2-home-dark.html'),'utf8');
    const palette=[...d1.matchAll(/^\| `(--color-[\w-]+)`(?:（新增）)? \| (#[0-9A-F]{6})/gm)];
    for(const m of palette)if(!source.toLowerCase().includes(`${m[1]}: ${m[2].toLowerCase()}`))throw new Error('D1 variable mismatch: '+m[1]);
    fs.writeFileSync(path.join(outputDir,'d2-home-validation.json'),JSON.stringify({kind:'static-design-only',date:'2026-10-20',candidateTokenMatches:palette.length,results},null,2)+'\n');
    console.log(JSON.stringify({candidateTokenMatches:palette.length,results},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
