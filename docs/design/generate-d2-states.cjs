// Static review artifacts only; no workspace, file, or plugin operations.
const fs = require('node:fs');
const path = require('node:path');
const { palette } = require('./generate-d2-light.cjs');
const { applySolidVisuals } = require('./solid-visuals.cjs');
const dir = __dirname;
const groups = [
  { id: 'home', name: '首页', source: 'home', preview: 'failed', states: [
    { id: 'empty', label: '首次空白', icon: 'folder', title: '建立第一个工作区', copy: '为一个项目保留文件、视图和常用工具。', actions: ['创建工作区', '打开已有工作区'], note: '创建与打开均由你主动发起。', safety: '此处没有最近记录，也不会编造历史项目。' },
    { id: 'loading', label: '打开中', icon: 'clock', title: '正在读取工作区', copy: '读取布局与标签描述，插件将按需加载。', actions: ['返回首页'], note: '进度未知，不显示百分比。返回不等于已经取消。', safety: '不会自动重复上次的 AI 付费请求或文件覆盖。', pending: true },
    { id: 'failed', label: '打开失败', icon: 'warning', title: '无法打开这个工作区', copy: '所选位置当前无法读取，工作区尚未打开。', actions: ['重新选择位置', '返回首页'], note: '重新选择后核对访问范围，再由你主动打开。', safety: '读取失败，源文件未被修改；不会自动重试。', tone: 'error' },
  ] },
  { id: 'assets', name: '文件与素材', source: 'assets', preview: 'missing', states: [
    { id: 'empty', label: '首次空白', icon: 'folder', title: '把本地素材放在顺手的位置', copy: '关联原位置文件夹，或把选定文件复制到工作区。', actions: ['关联文件夹', '导入副本'], note: '关联保留原位置；导入会创建托管副本。', safety: '两种方式分别说明存储位置，不默认获得整个磁盘权限。' },
    { id: 'loading', label: '索引中', icon: 'clock', title: '正在读取文件信息', copy: '素材索引尚未完成，已有内容可在可用时逐步显示。', actions: ['请求停止索引'], note: '总量未知，不显示百分比；停止需等待执行方确认。', safety: '索引只读取获授权的范围，不修改原文件。', pending: true },
    { id: 'no-match', label: '无匹配', icon: 'search', title: '没有找到匹配的素材', copy: '当前搜索与筛选下没有结果，文件并未因此被删除。', actions: ['清除搜索与筛选'], note: '恢复当前目录的默认视图。', safety: '只改变视图条件，不移动文件或扩展授权。' },
    { id: 'denied', label: '无访问权限', icon: 'shield', title: '当前无法访问这个文件夹', copy: '访问可能未获授权、已撤销，或受到系统权限限制。', actions: ['检查目录访问', '选择其他文件夹'], note: '先查看当前授权；重新申请仅限所选目录的读取范围。', safety: '不建议以管理员身份绕过；系统仍拒绝时保留错误。', tone: 'warning' },
    { id: 'missing', label: '文件失联', icon: 'warning', title: '原文件暂时找不到了', copy: '文件可能已移动，或所在磁盘尚未连接。引用与原位置记录仍保留。', actions: ['重新定位文件', '仅移除引用'], note: '重新定位需要核对文件；移除引用前说明影响并确认。', safety: '移除引用不删除原文件，也不清空工作区其他内容。', tone: 'warning' },
  ] },
  { id: 'plugins', name: '插件中心', source: 'plugins-empty', preview: 'failed', states: [
    { id: 'empty', label: '首次空白', icon: 'plugin', title: '从一个需要的工具开始', copy: '尚未安装插件。安装前查看来源、兼容性和权限。', actions: ['选择本地安装包'], note: '选择文件不代表安装或资源授权已经完成。', safety: '普通插件默认不能读取所有文件或获得系统权限。' },
    { id: 'no-match', label: '无匹配', icon: 'search', title: '没有匹配的已安装插件', copy: '试试其他关键词，或清除当前筛选。', actions: ['清除搜索与筛选'], note: '返回本机插件列表，不自动联网搜索或下载。', safety: '不会因为没有结果而删除或禁用已有插件。' },
    { id: 'loading', label: '检查中', icon: 'package', title: '正在检查安装包', copy: '核对清单与兼容性，检查结果尚未返回。', actions: ['请求取消检查'], note: '不显示虚构百分比；此阶段尚未执行插件代码。', safety: '检查完成后仍须查看来源与权限，不能直接自动安装。', pending: true },
    { id: 'cancelling', label: '等待取消确认', icon: 'clock', title: '已请求取消，等待确认', copy: '执行方还未确认停止，请保留这个状态。', actions: ['查看任务详情'], note: '取消请求已发出；不能标成“已取消”或假装释放资源。', safety: '若长时间无响应，提供诊断；强制终止需要说明数据风险。', pending: true },
    { id: 'failed', label: '安装失败', icon: 'warning', title: '安装没有完成', copy: '安装步骤返回错误，当前包与已安装版本的状态需要核对。', actions: ['查看诊断', '重新检查安装包'], note: '先核对当前版本和残留状态，不自动重复安装。', safety: '不能默认旧版本可用或已经回滚；资源授权仍单独管理。', tone: 'error' },
    { id: 'incompatible', label: '版本不兼容', icon: 'plugin', title: '这个安装包与当前版本不兼容', copy: '安装前兼容性检查未通过，插件尚未安装或运行。', actions: ['选择其他安装包', '查看兼容要求'], note: '保留拒绝原因，不提供绕过兼容与权限检查的快捷入口。', safety: '不改动已安装版本，不自动下载其他版本。', tone: 'warning' },
  ] },
];
const symbols = {
  shield: '<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  plugin: '<path d="M9 3H5a2 2 0 0 0-2 2v4h2a2 2 0 0 1 0 4H3v6a2 2 0 0 0 2 2h4v-2a2 2 0 0 1 4 0v2h6a2 2 0 0 0 2-2v-6h-2a2 2 0 0 1 0-4h2V5a2 2 0 0 0-2-2h-6v2a2 2 0 0 1-4 0Z"/>',
  settings: '<path d="m10 3-.6 2.3-2 1.2-2.3-.6-2 3.4L4.8 11v2l-1.7 1.7 2 3.4 2.3-.6 2 1.2L10 21h4l.6-2.3 2-1.2 2.3.6 2-3.4-1.7-1.7v-2l1.7-1.7-2-3.4-2.3.6-2-1.2L14 3Z"/><circle cx="12" cy="12" r="3"/>',
  warning: '<path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v5m0 3h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  package: '<path d="m3 7 9-4 9 4v10l-9 4-9-4Z"/><path d="m3 7 9 4 9-4M12 11v10M7 5l10 4"/>',
};
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
function replaceElement(html, opening, tag, replacement) {
  const match = opening.exec(html);
  if (!match) throw Error('Missing template element: ' + opening);
  const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
  tags.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tags.exec(html))) {
    depth += token[0].startsWith('</') ? -1 : 1;
    if (!depth) return html.slice(0, match.index) + replacement + html.slice(tags.lastIndex);
  }
  throw Error('Unclosed template element');
}
function card(state, home) {
  return `<section class="state-card s-${state.id} ${state.tone || ''} ${home ? 'home-state' : ''}" data-state="${state.id}"><div class="state-emblem">${icon(state.icon)}</div><div class="state-copy"><div class="state-eyebrow">${state.label}</div><h2>${state.title}</h2><p class="state-description">${state.copy}</p>${state.pending ? '<div class="pending-line"><span></span>等待执行方反馈</div>' : ''}<div class="state-actions">${state.actions.map((a,i)=>`<span class="control ${i===0?'primary':'secondary'}">${a}</span>`).join('')}</div><p class="action-note">${state.note}</p><div class="safety-note">${icon('shield')}<span>${state.safety}</span></div></div></section>`;
}
const extraCss = `
body{height:100vh;display:flex;flex-direction:column;overflow:hidden}
.review-head{flex:none;padding:10px 20px;border-bottom:1px solid var(--color-divider);display:flex;gap:16px;align-items:center;justify-content:space-between;background:var(--color-sidebar)}
.review-head h1{font-size:14px;line-height:22px;margin:0}.review-head p{font-size:12px;color:var(--color-muted);margin:2px 0 0}.review-head a{font-size:12px;color:var(--color-accent);white-space:nowrap}
.state-controls{flex:none;display:flex;gap:8px;flex-wrap:wrap;padding:10px 20px;border-bottom:1px solid var(--color-divider)}
.state-controls input{position:absolute;opacity:0;width:1px;height:1px}.state-controls label{cursor:pointer;font-size:12px;padding:5px 10px;border:1px solid var(--color-border);border-radius:6px;color:var(--color-muted)}
.state-controls input:checked+label{border-color:var(--color-selected-border);background:var(--color-selected);color:var(--color-accent)}
.state-controls input:focus-visible+label,a:focus-visible{outline:2px solid var(--color-focus);outline-offset:3px}
.artboard{height:auto;min-height:0;flex:1;overflow:auto}.shell{min-height:0}.rail{position:static;align-self:stretch;height:auto}.state-stack{min-width:0}
.state-card{display:none;max-width:600px;margin:36px auto;padding:32px;border:1px solid var(--color-divider);border-radius:8px;background:var(--color-surface-subtle)}
.state-emblem{width:44px;height:44px;border-radius:8px;display:grid;place-items:center;background:var(--color-selected);color:var(--color-accent);margin-bottom:20px}.state-emblem svg{width:24px;height:24px}
.state-card.warning .state-emblem{background:var(--color-surface-elevated);color:var(--color-warning)}.state-card.error .state-emblem{background:var(--color-surface-elevated);color:var(--color-error)}
.state-eyebrow{font-size:11px;color:var(--color-subtle);margin-bottom:6px}.state-card h2{font-size:20px;font-weight:600;line-height:30px;margin:0 0 10px}.state-description{font-size:14px;line-height:24px;color:var(--color-muted);margin:0;max-width:480px}
.state-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.state-actions .control{height:auto;min-height:34px;white-space:normal;text-align:center;padding:6px 12px;line-height:20px}
.action-note{font-size:12px;color:var(--color-muted);line-height:21px;margin:12px 0 0}.safety-note{display:flex;align-items:flex-start;gap:8px;padding-top:16px;margin-top:20px;border-top:1px solid var(--color-divider);font-size:12px;line-height:21px;color:var(--color-subtle)}.safety-note svg{width:16px;height:16px;margin-top:2px;flex:none}
.pending-line{display:flex;align-items:center;gap:8px;color:var(--color-muted);font-size:12px;line-height:20px;margin-top:16px}.pending-line span{height:4px;width:28px;border-radius:2px;background:var(--color-accent)}
.state-card.home-state{max-width:none;display:none;margin:0;padding:24px;gap:20px;align-items:flex-start}.home-state .state-emblem{flex:none;margin:0}.home-state .state-copy{flex:1;min-width:0}.home-state h2{font-size:18px;line-height:26px}.home-state .state-actions{margin-top:16px}.home-state .safety-note{margin-top:16px;padding-top:12px}.home-review .shell{flex:none;min-height:650px}.home-review .content{padding-top:24px}
.source-note{color:var(--color-subtle);font-size:12px;line-height:22px;border-top:1px solid var(--color-divider);padding-top:16px;margin-top:24px}
@media(max-width:799px){.review-head{padding:10px 16px;align-items:flex-start}.review-head p{max-width:240px}.state-controls{padding:10px 16px;gap:8px}.state-card{padding:24px 20px;margin:16px auto}.state-card h2{font-size:18px;line-height:28px}.state-card.home-state{padding:20px}.home-state .state-emblem{display:none}.viewport{padding:16px}.toolbar-right .view-toggle,.toolbar-note{display:none}.window-actions span{width:30px}.home-review .shell{min-height:760px}}
`;
function generate() {
  const colors = palette();
  for (const group of groups) for (const theme of ['dark','light']) {
    let html = fs.readFileSync(path.join(dir,`d2-${group.source}-${theme}.html`),'utf8').replace(/\r\n/g,'\n');
    for (const [id,paths] of Object.entries(symbols)) {
      const symbol=`<symbol id="${id}" viewBox="0 0 24 24">${paths}</symbol>`;
      const re=new RegExp(`<symbol id="${id}"[\\s\\S]*?<\\/symbol>`);
      html=re.test(html)?html.replace(re,symbol):html.replace('</defs>',symbol+'</defs>');
    }
    html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>D2 ${group.name}状态 · ${theme==='dark'?'深色':'浅色'} · 设计审阅</title>`);
    html=html.replace(/<div class="artboard"[^>]*>/,`<div class="artboard ${group.id==='home'?'home-review':''}" role="img" aria-label="${group.name}状态静态设计。按钮均为示意，不执行真实业务操作。">`);
    const cards=`<div class="state-stack">${group.states.map(s=>card(s,group.id==='home')).join('')}</div>`;
    if(group.id==='home') html=replaceElement(html,/<section class="start-panel">/,'section',cards);
    else if(group.id==='assets') {
      html=replaceElement(html,/<div class="viewport">/,'div',`<div class="viewport">${cards}</div>`);
      html=replaceElement(html,/<aside class="detail">/,'aside','');
      html=html.replace('<span class="control collapsed-trigger detail-trigger">详情</span>','');
      html=replaceElement(html,/<div class="context-body">/,'div',`<div class="context-body"><div class="group-label">当前情境</div><div class="tree-item active">${icon('folder')}所选资源位置</div><p class="source-note">状态审阅示例。<br>空白、索引与失联是不同情境，不是连续执行记录。</p></div>`);
      html=html.replace(/6 项 · 已选 1 项（示例）/g,'状态情境 · 非实时文件记录').replace(/视觉参考/g,'文件与素材');
    } else {
      html=replaceElement(html,/<section class="content">/,'section',`<section class="content"><div class="page-heading"><div><h1>插件中心</h1><p>管理工具，以及它们可以访问的内容。</p></div></div>${cards}<p class="source-note">状态示例独立展示，不代表安装已经执行。支持的任务操作和授权范围由真实能力决定。</p></section>`);
      html=html.replace('首次使用 · 空态示意','状态情境 · 非实时安装记录');
    }
    html=replaceElement(html,/<div class="review-strip">/,'div','<div class="review-strip"><span><strong>静态状态稿</strong>　仅上方审阅切换可操作；业务按钮均为示意</span><span>钴蓝 · 统一图标候选</span></div>');
    const selectors=group.states.map(s=>`body:has(#state-${s.id}:checked) .s-${s.id}{display:${group.id==='home'?'flex':'block'}}`).join('\n');
    html=html.replace('</style>',extraCss+selectors+'</style>');
    const controls=`<header class="review-head"><div><h1>${group.name} · ${theme==='dark'?'深色':'浅色'}状态审阅</h1><p>选择设计情境；不创建文件、不安装插件、不发起任务。</p></div><a href="d2-states-${group.id}-${theme==='dark'?'light':'dark'}.html">查看${theme==='dark'?'浅色':'深色'}</a></header><div class="state-controls" role="group" aria-label="设计情境">${group.states.map((s,i)=>`<input type="radio" name="state" id="state-${s.id}" ${i===0?'checked':''}><label for="state-${s.id}">${s.label}</label>`).join('')}</div>`;
    html=html.replace('<body>','<body>'+controls);
    fs.writeFileSync(path.join(dir,`d2-states-${group.id}-${theme}.html`),applySolidVisuals(html));
  }
  const cards=groups.map(g=>`<section><h2>${g.name}</h2><div class="pair">${['dark','light'].map(t=>`<a href="d2-states-${g.id}-${t}.html"><img src="previews/d2-states-${g.id}-${t}-1440.png" alt="${g.name}${t==='dark'?'深色':'浅色'}状态稿；点击打开所有设计情境"><span>${t==='dark'?'深色':'浅色'} · ${g.states.length} 个情境 →</span></a>`).join('')}</div></section>`).join('');
  fs.writeFileSync(path.join(dir,'d2-state-review.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'"><title>D2 状态与恢复审阅</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#f5f6f6;color:#1e2b34;font:14px/1.7 "Segoe UI","Microsoft YaHei UI",sans-serif}main{max-width:1600px;margin:auto}h1{font-size:26px;font-weight:600;margin:0 0 8px}p{color:#526970;margin:0 0 20px}h2{font-size:18px;margin:28px 0 12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}a{display:block;color:#1d4ed8;text-decoration:none}a:focus-visible{outline:2px solid #2563eb;outline-offset:4px}img{width:100%;display:block;border:1px solid #63767e;border-radius:6px}a span{display:block;margin-top:8px}footer{border-top:1px solid #d2dadd;padding-top:20px;margin-top:32px;color:#526970;font-size:12px}@media(max-width:800px){body{padding:20px}.pair{grid-template-columns:1fr}}</style></head><body><main><h1>每一步，都有清楚的反馈。</h1><p>14 个状态情境 × 深浅主题。点击预览，切换查看空白、处理、失败与恢复设计。<br>保留 B 轻量首页与钴蓝；这些是静态稿，业务操作尚未实现。</p>${cards}<footer>统一图标采用项目自绘 SVG：面板表示工作区，拼图表示插件，盾牌表示授权说明。没有接入 Morphicons 或播放自动动效。系统恢复、未保存关闭等 Shell 状态流需后续分批设计。</footer></main></body></html>\n`);
  return {groups,colors};
}
module.exports={generate,groups};
if(require.main===module){generate();console.log('Generated six static state review sources and one index.');}
