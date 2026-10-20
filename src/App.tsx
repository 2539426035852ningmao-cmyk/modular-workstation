import { useState } from 'react';
import { getMessages, type PageId } from './i18n';
import { Icon, type IconName } from './Icons';
import './styles.css';
const pageIds: PageId[] = ['home', 'workspace', 'plugins', 'settings'];
const moduleTargets: PageId[] = ['workspace', 'workspace', 'plugins'];
const moduleIcons: IconName[] = ['workspace', 'folder', 'plugins'];
export default function App() {
 const [page, setPage] = useState<PageId>('home');
 const messages = getMessages(navigator.language);
 const current = messages.pages[page];
 return (
  <div className="shell">
   <a className="skip-link" href="#main-content">{messages.skip}</a>
   <nav className="rail navigation" aria-label={messages.navigation}>
    <div className="brand-mark"><Icon name="grid" /></div>
    {pageIds.map(id=><button key={id} type="button" aria-label={messages.pages[id].label} className={`nav-item${page===id?' active':''}${id==='settings'?' bottom':''}`} aria-current={page===id?'page':undefined} onClick={()=>setPage(id)}><Icon name={id}/><span>{messages.pages[id].label}</span></button>)}
   </nav>
   <div className="body-shell">
    <aside className="sidebar" aria-label={messages.context}>
     <h2>{page==='home'?messages.myStation:current.label}</h2>
     <div className="context-current"><Icon name={page==='home'?'grid':page}/><span>{page==='home'?messages.overview:messages.sections[page]}</span></div>
     <div className="context-note"><span className="eyebrow">{messages.localSpace}</span><p>{messages.contextNote}</p></div>
     <div className="sidebar-footer"><span className="status-dot"/>{messages.status}</div>
    </aside>
    <main className="main-panel" id="main-content" tabIndex={-1}>
     <header className="topbar"><span className="breadcrumb"><strong>{messages.myStation}</strong><span className="breadcrumb-separator" aria-hidden="true">/</span><span className="breadcrumb-current">{current.label}</span></span><div className="search-surface" aria-label={messages.searchUnavailable}><Icon name="search"/><span>{messages.searchUnavailable}</span></div></header>
     <section className="content" aria-labelledby="page-title">
      <div className="content-intro"><div><span className="eyebrow">{messages.prototype}</span><h1 id="page-title">{current.title}</h1><p>{current.description}</p></div>{page==='home'&&<button className="control primary" type="button" onClick={()=>setPage('workspace')}><Icon name="workspace"/>{messages.viewWorkspace}</button>}</div>
      {page==='home'?<><h2 className="section-title">{messages.explore}</h2><div className="module-grid">{messages.modules.map((module,index)=><button type="button" className="module-card" key={module.title} onClick={()=>setPage(moduleTargets[index])}><div className="card-head"><span className="module-icon"><Icon name={moduleIcons[index]}/></span><Icon name="corner" className="module-card-corner"/></div><h3>{module.title}</h3><p>{module.description}</p><span className="module-status">{module.status}</span></button>)}</div><div className="home-note"><Icon name="clock"/><p>{messages.homeNote}</p></div></>:<div className="empty-panel state-panel" data-tone="neutral"><div className="state-emblem"><Icon name={page}/></div><h2>{messages.emptyLabel}</h2><p>{current.description}</p>{page==='workspace'&&<><button className="control" type="button" disabled>{messages.createWorkspace}</button><span className="availability-note">{messages.workspaceUnavailable}</span></>}{page==='plugins'&&<><button className="control" type="button" disabled>{messages.installPlugin}</button><span className="availability-note">{messages.pluginUnavailable}</span></>}{page==='settings'&&<div className="theme-information"><span>{messages.themeLabel}</span><strong>{messages.systemTheme}</strong><p>{messages.themeNote}</p></div>}</div>}
     </section>
    </main>
   </div>
  </div>
 );
}
