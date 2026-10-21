import {useEffect, useState} from 'react';
import {Icon} from './Icons';
import {getMessages} from './i18n';
type Tab = 'overview' | 'resources';
type View = {tabs:Tab[]; activeTab:Tab; layout:'standard'|'focus'};
type Space = {id:string; name:string; view:View};
type State = {version:1;lastWorkspaceId:string|null;workspaces:Space[]};
type Command = {type:'create';name:string}|{type:'open'|'reset';id:string}|{type:'view';id:string;view:View};
type Reply = {ok:true;state:State}|{ok:false;error:string};
declare global {interface Window {workstation?:{load:()=>Promise<Reply>;change:(command:Command)=>Promise<Reply>;recover:()=>Promise<Reply>}}}
export default function Workspace({onRestore,onCount}:{onRestore:()=>void;onCount:(count:number)=>void}) {
 const m = getMessages(navigator.language).workspace;
 const [state,setState] = useState<State|null>(null);
 const [busy,setBusy] = useState(true);
 const [error,setError] = useState('');
 const [name,setName] = useState('');
 const [confirmRecovery,setConfirmRecovery] = useState(false);
 const [saved,setSaved] = useState(false);
 const space = state?.workspaces.find(w=>w.id===state.lastWorkspaceId);
 useEffect(()=>{onCount(state?.workspaces.length ?? 0);},[state,onCount]);
 async function request(action:()=>Promise<Reply>,changed=false) {
  setBusy(true);setError('');setSaved(false);
  try {const reply=await action();if(reply.ok){setState(reply.state);setSaved(changed);return true;}setError(reply.error);}
  catch {setError('READ_FAILED');}
  finally {setBusy(false);}
  return false;
 }
 useEffect(()=>{
  let live=true;
  void (async()=>{try{
   const reply=await window.workstation?.load();if(!live)return;
   if(reply?.ok){setState(reply.state);if(reply.state.lastWorkspaceId)onRestore();}
   else setError(reply && !reply.ok ? reply.error : 'UNAVAILABLE');
  }catch{if(live)setError('READ_FAILED');}finally{if(live)setBusy(false);}})();
  return ()=>{live=false;};
 },[]);
 const change = (command:Command) => request(()=>window.workstation!.change(command),true);
 function update(view:View){if(space)void change({type:'view',id:space.id,view});}
 function openTab(tab:Tab){if(space)update({...space.view,tabs:space.view.tabs.includes(tab)?space.view.tabs:[...space.view.tabs,tab],activeTab:tab});}
 function closeTab(tab:Tab){if(space && space.view.tabs.length>1){const tabs=space.view.tabs.filter(t=>t!==tab);update({...space.view,tabs,activeTab:space.view.activeTab===tab?tabs[0]:space.view.activeTab});}}
 const blocked = !state || error==='CORRUPT' || error==='UNSUPPORTED';
 return <div className="workspaces" aria-busy={busy}>
  <div className="workspace-feedback" role="status" aria-live="polite">{busy?m.loading:error?m.notSaved:saved?m.saved:m.local}</div>
  {error&&<div className="workspace-error" role="alert"><span className="error-mark" aria-hidden="true">!</span><div><strong>{error==='CORRUPT'?m.corrupt:error==='UNSUPPORTED'?m.unsupported:m.failed}</strong><p>{m.kept}</p><button className="control" disabled={busy} onClick={()=>void request(()=>window.workstation!.load())}>{m.retry}</button>{error==='CORRUPT'&&<button className="control" disabled={busy} onClick={()=>setConfirmRecovery(true)}>{m.recover}</button>}</div></div>}
  {confirmRecovery&&<div className="recovery-confirm"><p>{m.preserve}</p><button className="control primary" disabled={busy} onClick={()=>void request(()=>window.workstation!.recover()).then(ok=>{if(ok)setConfirmRecovery(false);})}>{m.confirm}</button><button className="control" onClick={()=>setConfirmRecovery(false)}>{m.cancel}</button></div>}
  <form className="workspace-create" onSubmit={e=>{e.preventDefault();if(name.trim()&&!busy&&!blocked)void change({type:'create',name:name.trim()}).then(ok=>{if(ok)setName('');});}}>
   <label htmlFor="workspace-name">{m.name}</label><div><input id="workspace-name" value={name} onChange={e=>setName(e.target.value)} maxLength={60} placeholder={m.namePlaceholder} disabled={busy||blocked}/><button className="control primary" disabled={busy||blocked||!name.trim()}>{m.create}</button></div>
  </form>
  {state&&!space&&<div className="empty-panel state-panel"><div className="state-emblem"><Icon name="workspace"/></div><h2>{m.empty}</h2><p>{m.first}</p></div>}
  {!!state?.workspaces.length&&<div className="workspace-switcher" aria-label={m.spaces}>{state.workspaces.map(w=><button className="control" type="button" key={w.id} aria-pressed={w.id===space?.id} disabled={busy} onClick={()=>void change({type:'open',id:w.id})}>{w.name}</button>)}</div>}
  {space&&<section className={`workspace-editor ${space.view.layout}`} aria-label={space.name}>
   <div className="workspace-toolbar"><h2>{space.name}</h2><div className="workspace-actions"><label>{m.layout}<select aria-label={m.layout} value={space.view.layout} disabled={busy} onChange={e=>update({...space.view,layout:e.target.value as View['layout']})}><option value="standard">{m.standard}</option><option value="focus">{m.focus}</option></select></label><button className="control" disabled={busy} onClick={()=>void change({type:'reset',id:space.id})}>{m.reset}</button></div></div>
   <div className="workspace-body">{space.view.layout==='standard'&&<aside className="workspace-views" aria-label={m.views}>{(['overview','resources'] as Tab[]).map(tab=><button type="button" className="control" key={tab} aria-pressed={space.view.activeTab===tab} disabled={busy} onClick={()=>openTab(tab)}><Icon name={tab==='overview'?'grid':'folder'}/>{m[tab]}</button>)}</aside>}
    <div className="workspace-document"><div className="workspace-tabs" role="tablist" aria-label={m.tabs}>{space.view.tabs.map(tab=><div className="workspace-tab" key={tab}><button id={`tab-${tab}`} type="button" role="tab" aria-selected={space.view.activeTab===tab} aria-controls="workspace-panel" className="control" disabled={busy} onClick={()=>openTab(tab)}>{m[tab]}</button>{space.view.tabs.length>1&&<button type="button" className="tab-close" aria-label={`${m.close} ${m[tab]}`} disabled={busy} onClick={()=>closeTab(tab)}>×</button>}</div>)}{space.view.layout==='focus'&&!space.view.tabs.includes('resources')&&<button className="control" disabled={busy} onClick={()=>openTab('resources')}>{m.resources}</button>}</div>
    <div id="workspace-panel" role="tabpanel" aria-labelledby={`tab-${space.view.activeTab}`} className="workspace-panel"><span className="module-icon"><Icon name={space.view.activeTab==='overview'?'workspace':'folder'}/></span><h3>{m[space.view.activeTab]}</h3><p>{space.view.activeTab==='overview'?m.ready:m.noResources}</p></div></div>
   </div>
  </section>}
 </div>;
}
