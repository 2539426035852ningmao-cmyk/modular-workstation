// Shared visual treatment for design artifacts; no runtime dependency.
const symbols={
 grid:'<path fill-rule="evenodd" d="M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm11 0h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Zm11 0h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z"/>',
 home:'<path d="m12 2 9 7v2h-2v9a1 1 0 0 1-1 1h-4v-7h-4v7H6a1 1 0 0 1-1-1v-9H3V9Z"/>',
 workspace:'<path fill-rule="evenodd" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4v1.5h14V7Zm3 3v9h1.5v-9Z"/>',
 folder:'<path d="M3 4h6l2 3h9a1 1 0 0 1 1 1v2H3V4Z" opacity=".65"/><path d="M2 10h20l-2 10H4Z"/>',
 files:'<path fill-rule="evenodd" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4v1.5h14V7Zm3 3v9h1.5v-9Zm4 2v1.5h5V12Zm0 4v1.5h5V16Z"/>',
 plugin:'<path d="M9 3H5a2 2 0 0 0-2 2v4h2a2 2 0 0 1 0 4H3v6a2 2 0 0 0 2 2h4v-2a2 2 0 0 1 4 0v2h6a2 2 0 0 0 2-2v-6h-2a2 2 0 0 1 0-4h2V5a2 2 0 0 0-2-2h-6v2a2 2 0 0 1-4 0Z"/>',
 settings:'<path fill-rule="evenodd" d="m10 3-.6 2.3-2 1.2-2.3-.6-2 3.4L4.8 11v2l-1.7 1.7 2 3.4 2.3-.6 2 1.2L10 21h4l.6-2.3 2-1.2 2.3.6 2-3.4-1.7-1.7v-2l1.7-1.7-2-3.4-2.3.6-2-1.2L14 3Zm5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>',
 shield:'<path fill-rule="evenodd" d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6Zm-4.5 9.5 3.5 4 6-7-1.2-1-4.8 5.6-2.3-2.6Z"/>',
 warning:'<path fill-rule="evenodd" d="m10.3 3-8 15A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-15a2 2 0 0 0-3.4 0Zm.9 5v6h1.6V8Zm0 8v2h1.6v-2Z"/>',
 clock:'<path fill-rule="evenodd" d="M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0ZM11 6v7l5 3 .8-1.4-4.2-2.5V6Z"/>',
 search:'<path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM5 10a5 5 0 1 0 10 0 5 5 0 0 0-10 0Z"/><path d="m14 16 2-2 6 6-2 2Z"/>',
 package:'<path d="m3 7 9-4 9 4-9 4Z" opacity=".65"/><path d="m3 9 8 4v9l-8-5Zm10 4 8-4v8l-8 5Z"/>',
 list:'<path d="M3 4h3v3H3Zm5 .5h13v2H8ZM3 10.5h3v3H3Zm5 .5h13v2H8ZM3 17h3v3H3Zm5 .5h13v2H8Z"/>',
};
const css=`
/* Owner feedback: filled selections, face-led icons with cut-out detail. */
:root{--status-alert-fill:#c93b3b;--status-alert-foreground:#ffffff;--control-border-subtle:color-mix(in srgb,var(--color-border,#63767e) 50%,transparent)}
.search,.view-toggle,.control:not(.primary):not(.disabled),.state-controls label,.page-choice+label{border-color:var(--control-border-subtle);border-width:1px}
.nav-item.active,.tree-item.active,.category.active,.view-toggle span:first-child,.tab,.filter-tabs .selected,
.state-controls input:checked+label,.page-choice:checked+label{
 background:var(--color-accent-solid,#2563eb);color:var(--color-on-accent,#fff);border-color:var(--color-accent-solid,#2563eb)
}
.nav-item.active svg,.tree-item.active svg,.tree-item.active .count,.category.active svg,.tab svg.icon{color:inherit}
.tab:after{display:none}.view-toggle{background:var(--color-surface-elevated)}
.filter-tabs .selected{padding:6px 10px;border-radius:6px;border-bottom-color:transparent}
.control:not(.primary):not(.disabled),.state-controls label{background:var(--color-surface-elevated);}
.asset.selected{border-color:var(--color-accent-solid)}.asset.selected .asset-meta{background:var(--color-accent-solid);color:var(--color-on-accent)}.asset.selected .asset-name,.asset.selected .asset-kind{color:inherit}
.start-icon,.module-icon,.plugin-logo,.state-emblem{background:var(--color-selected);color:var(--color-accent)}
.state-emblem{background:var(--color-accent-solid);color:var(--color-on-accent)}
.state-card.warning .state-emblem,.state-card.error .state-emblem{background:var(--status-alert-fill);color:var(--status-alert-foreground)}
`;
function applySolidVisuals(html){
 for(const [id,shape]of Object.entries(symbols)){
  const re=new RegExp('<symbol id="'+id+'"[\\s\\S]*?<\\/symbol>');
  if(re.test(html))html=html.replace(re,`<symbol id="${id}" viewBox="0 0 24 24"><g fill="currentColor" stroke="none">${shape}</g></symbol>`);
 }
 html=html.replace(/<style data-solid-visuals>[\s\S]*?<\/style>\s*/g,'');
 return html.replace('</head>',`<style data-solid-visuals>${css}</style>\n</head>`).replace(/[ \t]+$/gm,'');
}
module.exports={applySolidVisuals,symbols};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 for(const v of ['home','assets','plugins-empty','plugins-permissions']){
  const file=path.join(__dirname,`d2-${v}-dark.html`);
  fs.writeFileSync(file,applySolidVisuals(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')));
 }
 console.log('Updated four dark design sources with shared filled selections and icons.');
}
