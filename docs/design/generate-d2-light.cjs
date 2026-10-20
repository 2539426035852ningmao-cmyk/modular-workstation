// Design exports only. Runtime theme tokens remain in src/tokens.css.
const fs=require('node:fs'),path=require('node:path');
const {applySolidVisuals}=require('./solid-visuals.cjs');
const dir=__dirname;
const variants=['home','assets','plugins-empty','plugins-permissions'];
function gallery(){
 const names=['首页','文件与素材','插件中心','安装前权限'];
 const choices=variants.map((v,i)=>`<input class="page-choice" type="radio" name="page" id="page-${v}" ${i===0?'checked':''}><label for="page-${v}">${names[i]}</label>`).join('');
 const pages=variants.map((v,i)=>`<section class="page page-${v}"><h2>${names[i]}</h2><div class="compare">${['dark','light'].map((t,j)=>`<figure class="${t}"><figcaption>${['深色','浅色'][j]} · 1440 × 900</figcaption><a href="d2-${v}-${t}.html"><img src="previews/d2-${v}-${t}-1440.png" alt="${names[i]}${['深色','浅色'][j]}静态设计；点击打开源稿"></a></figure>`).join('')}</div></section>`).join('');
 const selectors=variants.map(v=>`#page-${v}:checked~.pages .page-${v}{display:block}`).join('');
 fs.writeFileSync(path.join(dir,'d2-theme-review.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'"><title>D2 深浅主题对照</title><style>
 *{box-sizing:border-box}body{margin:0;padding:24px;background:#f5f6f6;color:#1e2b34;font:14px/1.6 "Segoe UI","Microsoft YaHei UI",sans-serif}main{max-width:1920px;margin:auto}h1{font-size:24px;margin:0 0 8px}p{color:#526970;margin:0 0 20px}.page-choice{position:absolute;opacity:0;width:1px;height:1px}label{display:inline-block;padding:8px 16px;margin:0 8px 12px 0;border:1px solid #63767e;border-radius:6px;cursor:pointer;background:white}input:focus-visible+label{outline:2px solid #2563eb;outline-offset:3px}input:checked+label{background:#e6eeff;border-color:#2563eb;color:#1d4ed8}.page{display:none}h2{font-size:18px;margin:16px 0}.compare{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{min-width:0;margin:0}figcaption{font-weight:600;margin-bottom:8px}img{display:block;width:100%;height:auto;border:1px solid #63767e;border-radius:6px}.note{margin-top:20px;font-size:12px}${selectors}@media(max-width:900px){body{padding:16px}.compare{grid-template-columns:1fr}label{padding:6px 10px}}
 </style></head><body><main><h1>钴蓝 · 深浅主题对照</h1><p>选择页面并比较两种主题。点击图片可打开完整静态稿；页面中的业务操作尚未实现。</p>${choices}<div class="pages">${pages}</div><p class="note">当前用于视觉审阅；窗口示意、文件与插件示例均不代表真实业务状态。浅色稿由 D1 配色和对应深色稿生成；应用程序尚未换装。</p></main></body></html>\n`);
}
function palette(){
 const spec=fs.readFileSync(path.join(dir,'../DESIGN_PROPOSAL_D1.md'),'utf8');
 const rows=[...spec.matchAll(/^\| `(--color-[\w-]+)`(?:（新增）)? \| (#[0-9A-F]{6}) \| (#[0-9A-F]{6})/gm)];
 if(rows.length!==23)throw new Error('Review D1 color inventory before generating');
 return rows.map(x=>({name:x[1],dark:x[2],light:x[3]}));
}
function generate(){
 const colors=palette();
 for(const variant of variants){
  let source=fs.readFileSync(path.join(dir,`d2-${variant}-dark.html`),'utf8').replace(/\r\n/g,'\n');
  for(const token of colors){
   const re=new RegExp('('+token.name+':\\s*)'+token.dark+'\\b','ig');
   if([...source.matchAll(re)].length!==1)throw new Error('Expected one dark declaration: '+variant+' '+token.name);
   source=source.replace(re,(_,prefix)=>prefix+token.light.toLowerCase());
  }
  source=source.replace(/color-scheme:\s*dark\b/g,'color-scheme: light').replaceAll('深色','浅色');
  source=source.replace('首页 v0.2','首页浅色 v0.1').replace('专业工作区 v0.1','专业工作区浅色 v0.1').replace('插件中心 v0.1','插件中心浅色 v0.1');
  const note='<!-- Generated from matching dark design + D1 light palette. Edit those sources, then regenerate. -->\n';
  fs.writeFileSync(path.join(dir,`d2-${variant}-light.html`),source.replace('<html lang="zh-CN">',note+'<html lang="zh-CN">'));
 }
 gallery();
 const galleryFile=path.join(dir,'d2-theme-review.html');
 fs.writeFileSync(galleryFile,applySolidVisuals(fs.readFileSync(galleryFile,'utf8')));
 return colors;
}
module.exports={variants,palette,generate};
if(require.main===module){generate();console.log('Generated four standalone light design sources from D1 and dark sources.');}
