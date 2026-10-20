// Color review only. Uses existing Playwright dev dependency and installed Edge.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('@playwright/test');
const dir=__dirname, preview=path.join(dir,'previews');
const palette=JSON.parse(fs.readFileSync(path.join(dir,'accent-options.json'),'utf8'));
const base=fs.readFileSync(path.join(dir,'d2-home-dark.html'),'utf8');
const luma=h=>{const c=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const contrast=(a,b)=>(Math.max(luma(a),luma(b))+.05)/(Math.min(luma(a),luma(b))+.05);
for(const c of palette){c.onSolid=contrast(c.solid,'#FFFFFF')>=4.5?'#FFFFFF':'#141617';}
const svg=(type)=>{
 const p={home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',plus:'<path d="M12 5v14M5 12h14"/>',folder:'<path d="M3 7V5h6l2 3h10v12H3Z"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${p[type]}</svg>`;
};
const cards=palette.map(c=>`<article class="option" style="--solid:${c.solid};--accent:${c.text};--selected:${c.selected};--on-solid:${c.onSolid}">
 <div class="color-block"><span>${c.id}</span></div>
 <div class="details"><div class="name"><h2>${c.name}</h2><span>${c.id}</span></div><code>${c.solid}</code><p class="description">${c.description}</p>
 <div class="mini"><div class="mini-title">模块化工作站 <span>首页</span></div><div class="mini-main"><div class="mini-rail"><span class="selected-icon">${svg('home')}</span><span>${svg('folder')}</span></div><div class="mini-content"><h3>开始你的工作</h3><p>项目、素材与工具，顺手连接。</p><div class="mock-button">${svg('plus')}创建工作区</div><div class="mini-modules"><div>${svg('folder')}工作区</div><div>${svg('folder')}素材</div></div></div></div></div>
 <div class="component"><span class="label">主按钮</span><div class="button">${svg('plus')}创建工作区</div></div>
 <div class="component"><span class="label">选中状态</span><div class="nav-state">${svg('home')}首页<span class="dot"></span></div></div>
 <div class="component"><span class="label">文字强调</span><div class="link">查看全部工作区 ${svg('arrow')}</div></div>
 </div></article>`).join('');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'"><title>工作站强调色 · 五色小样</title><style>
*{box-sizing:border-box}html,body{margin:0;background:#181a1b;color:#e9efee;font-family:"Segoe UI","Microsoft YaHei UI",sans-serif}body{width:1600px;min-height:1000px;padding:40px}svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}.eyebrow{font-size:12px;color:#afbcbe;margin:0 0 12px;letter-spacing:.1em}header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px}h1{font-size:28px;line-height:36px;font-weight:600;margin:0 0 12px}header p{font-size:14px;line-height:22px;color:#afbcbe;margin:0}.badge{border:1px solid #41484b;border-radius:6px;padding:8px 12px;font-size:12px;color:#afbcbe;white-space:nowrap}.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:20px}.option{border:1px solid #303638;border-radius:8px;overflow:hidden;background:#202324}.color-block{height:96px;background:var(--solid);padding:20px}.color-block span{display:grid;place-items:center;width:36px;height:36px;border-radius:6px;border:1px solid currentColor;color:var(--on-solid);font-size:20px;font-weight:600}.details{padding:20px}.name{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}.name h2{font-size:18px;line-height:28px;margin:0;font-weight:600}.name>span{font-size:12px;color:#97aaad}code{font-family:Consolas,monospace;color:#afbcbe;font-size:14px}.description{font-size:12px;color:#afbcbe;margin:12px 0 24px;line-height:20px;white-space:nowrap}.mini{border:1px solid #41484b;border-radius:6px;overflow:hidden;background:#181a1b;margin-bottom:24px}.mini-title{height:32px;border-bottom:1px solid #303638;padding:0 8px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#afbcbe}.mini-title span{color:#e9efee}.mini-main{display:flex;min-height:176px}.mini-rail{width:32px;border-right:1px solid #303638;padding:12px 4px;display:flex;align-items:center;flex-direction:column;gap:12px;color:#97aaad}.mini-rail>span{padding:4px;display:flex;border-radius:4px}.mini-rail svg{width:14px;height:14px}.selected-icon{background:var(--selected);color:var(--accent)}.mini-content{flex:1;min-width:0;padding:16px 10px}.mini-content h3{font-size:12px;font-weight:600;margin:0 0 6px}.mini-content p{font-size:9px;line-height:16px;color:#afbcbe;margin:0 0 12px}.mock-button{height:26px;display:inline-flex;align-items:center;justify-content:center;gap:4px;background:var(--solid);color:var(--on-solid);font-size:10px;font-weight:600;padding:0 8px;border-radius:4px}.mock-button svg{width:12px;height:12px}.mini-modules{display:flex;gap:8px;margin-top:12px}.mini-modules>div{height:50px;flex:1;border:1px solid #303638;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;padding:6px;border-radius:4px;color:#afbcbe;font-size:9px}.mini-modules svg{width:12px;height:12px}.component{margin-top:20px}.label{display:block;font-size:12px;color:#97aaad;margin-bottom:8px}.button{display:flex;align-items:center;justify-content:center;gap:8px;height:36px;border-radius:6px;background:var(--solid);color:var(--on-solid);font-weight:600;font-size:12px}.nav-state{display:flex;align-items:center;gap:12px;background:var(--selected);border:1px solid var(--accent);color:var(--accent);border-radius:6px;height:40px;padding:0 12px;font-size:12px}.dot{margin-left:auto;width:5px;height:5px;background:var(--accent);border-radius:50%}.link{display:flex;align-items:center;gap:8px;color:var(--accent);font-size:12px;height:32px}.link svg{width:14px;height:14px}footer{margin-top:28px;padding-top:20px;border-top:1px solid #303638;display:flex;justify-content:space-between;gap:24px;font-size:12px;color:#afbcbe;line-height:20px}footer p{margin:0}footer strong{font-weight:400;color:#e9efee}
</style></head><body><p class="eyebrow">模块化工作站 / 强调色选择</p><header><div><h1>同一套首页，五种强调色。</h1><p>先看整体感受，再比较按钮与选中态。只改变强调色，布局和中性背景保持一致。</p></div><span class="badge">中高饱和 · 深色界面对照 · 候选，未定案</span></header><div class="grid">${cards}</div><footer><p><strong>请选择 A / B / C / D / E</strong><br>色块为主按钮实色；深色界面的文字强调采用同色系浅阶，保证可读性。</p><p>青绿已退出候选。颜色用于主要操作和选中状态，其余界面保持克制。<br>这是静态设计小样，尚未修改运行中的应用。</p></footer></body></html>`;
fs.writeFileSync(path.join(dir,'accent-options.html'),html);
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
 try{
  for(const c of palette){
   const css=`<style>:root{--color-accent:${c.text};--color-selected:${c.selected};--color-selected-border:${c.text};--color-focus:${c.text};--color-accent-solid:${c.solid};--color-on-accent:${c.onSolid}}.primary{background:var(--color-accent-solid);border-color:var(--color-accent-solid);color:var(--color-on-accent)}</style>`;
   const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
   await page.setContent(base.replace('</head>',css+'</head>').replace('钴蓝 #2563EB · 首页 v0.2 · 2026.10.20',`${c.id} ${c.name} · ${c.solid} · 颜色候选，未定案`));
   await page.evaluate(async()=>{await document.fonts.ready});
   await page.screenshot({path:path.join(preview,`d2-home-accent-${c.id}.png`)});
   const pairs={button:contrast(c.solid,c.onSolid),emphasis:contrast(c.text,'#181a1b'),selected:contrast(c.text,c.selected)};
   if(Object.values(pairs).some(x=>x<4.5))throw new Error('contrast failed: '+JSON.stringify({c,pairs}));
   results.push({id:c.id,solid:c.solid,onSolid:c.onSolid,ratios:pairs});await page.close();
  }
  const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
  await page.setContent(html);await page.evaluate(async()=>{await document.fonts.ready});
  const bounds=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,cards:document.querySelectorAll('.option').length}));
  if(bounds.width!==1600||bounds.height>1000||bounds.cards!==5)throw new Error('board overflow '+JSON.stringify(bounds));
  await page.screenshot({path:path.join(preview,'accent-options-five.png')});
  fs.writeFileSync(path.join(preview,'accent-options-validation.json'),JSON.stringify({kind:'static-color-review',date:'2026-10-20',bounds,results},null,2)+'\n');
  console.log(JSON.stringify({bounds,results},null,2));
 } finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
