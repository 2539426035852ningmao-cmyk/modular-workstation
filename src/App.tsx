import { useEffect, useState } from 'react';
import { getMessages, type PageId } from './i18n';
import { Icon, type IconName } from './Icons';
import './styles.css';
import Workspace from './Workspace';
import AppearanceSettings from './AppearanceSettings';
import CommandPalette from './CommandPalette';
const pageIds: PageId[] = ['home', 'workspace', 'plugins', 'settings'];
const moduleTargets: PageId[] = ['workspace', 'workspace', 'plugins'];
const moduleIcons: IconName[] = ['workspace', 'folder', 'plugins'];
export default function App() {
 const [spaceCount,setSpaceCount] = useState(0);
 const [page, setPage] = useState<PageId>('home');
 const [commandsOpen,setCommandsOpen]=useState(false);
 const messages = getMessages(navigator.language);
 const commands=pageIds.map(id=>({id,label:messages.pages[id].label,keywords:messages.commands.keywords[id],icon:id}));
 const navigate=(id:PageId)=>setPage(id);
 useEffect(()=>{
  const open=(e:KeyboardEvent)=>{if(!e.defaultPrevented&&!e.isComposing&&e.keyCode!==229&&e.ctrlKey&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==='k'){e.preventDefault();setCommandsOpen(true);}};
  window.addEventListener('keydown',open);return()=>window.removeEventListener('keydown',open);
 },[]);
 const current = messages.pages[page];
 return (
  <div className="shell">
   <a className="skip-link" href="#main-content">{messages.skip}</a>
   <nav className="rail navigation" aria-label={messages.navigation}>
    <div className="brand-mark"><Icon name="grid" /></div>
    {commands.map(c=><button key={c.id} type="button" aria-label={c.label} className={`nav-item${page===c.id?' active':''}${c.id==='settings'?' bottom':''}`} aria-current={page===c.id?'page':undefined} onClick={()=>navigate(c.id)}><Icon name={c.icon}/><span>{c.label}</span></button>)}
   </nav>
   <div className="body-shell">
    <aside className="sidebar" aria-label={messages.context}>
     <h2>{page==='home'?messages.myStation:current.label}</h2>
     <div className="context-current"><Icon name={page==='home'?'grid':page}/><span>{page==='home'?messages.overview:messages.sections[page]}</span></div>
     <div className="context-note"><span className="eyebrow">{messages.localSpace}</span><p>{messages.contextNote}</p></div>
     <div className="sidebar-footer"><span className="status-dot"/>{messages.status}</div>
    </aside>
    <main className="main-panel" id="main-content" tabIndex={-1}>
     <header className="topbar"><span className="breadcrumb"><strong>{messages.myStation}</strong><span className="breadcrumb-separator" aria-hidden="true">/</span><span className="breadcrumb-current">{current.label}</span></span><button className="search-surface" type="button" aria-label={messages.commands.title} aria-haspopup="dialog" aria-keyshortcuts="Control+K" onClick={()=>setCommandsOpen(true)}><Icon name="search"/><span>{messages.commands.title}</span><kbd>Ctrl K</kbd></button></header>
     <section className="content" aria-labelledby="page-title">
      <div className="content-intro"><div><span className="eyebrow">{messages.prototype}</span><h1 id="page-title">{current.title}</h1><p>{current.description}</p></div>{page==='home'&&<button className="control primary" type="button" onClick={()=>navigate('workspace')}><Icon name="workspace"/>{messages.viewWorkspace}</button>}</div>
      <div hidden={page!=='workspace'}><Workspace onRestore={()=>setPage('workspace')} onCount={setSpaceCount}/></div>
      {page==='workspace'?null:page==='settings'?<AppearanceSettings/>:page==='home'?<><h2 className="section-title">{messages.explore}</h2><div className="module-grid">{messages.modules.map((module,index)=><button type="button" className="module-card" key={module.title} onClick={()=>setPage(moduleTargets[index])}><div className="card-head"><span className="module-icon"><Icon name={moduleIcons[index]}/></span><Icon name="corner" className="module-card-corner"/></div><h3>{module.title}</h3><p>{module.description}</p><span className="module-status">{index===0&&spaceCount>0?messages.workspace.open:module.status}</span></button>)}</div><div className="home-note"><Icon name="clock"/><p>{messages.homeNote}</p></div></>:<div className="empty-panel state-panel" data-tone="neutral"><div className="state-emblem"><Icon name={page}/></div><h2>{messages.emptyLabel}</h2><p>{current.description}</p>{page==='plugins'&&<><button className="control" type="button" disabled>{messages.installPlugin}</button><span className="availability-note">{messages.pluginUnavailable}</span></>}</div>}
     </section>
    </main>
   </div>
   <CommandPalette open={commandsOpen} commands={commands} m={messages.commands} onClose={()=>setCommandsOpen(false)} onExecute={navigate}/>
  </div>
 );
}
