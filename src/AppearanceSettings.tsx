import {useEffect,useRef,useState} from 'react';
import {getMessages} from './i18n';
import type {Appearance,Result,Theme} from './bridge';
export default function AppearanceSettings() {
 const m=getMessages(navigator.language).appearance;
 const [state,setState]=useState<Appearance|null>(null);
 const [busy,setBusy]=useState(true),[error,setError]=useState(''),[saved,setSaved]=useState(false),[confirm,setConfirm]=useState(false);
 const inFlight=useRef(false);
 async function run(action:()=>Promise<Result<Appearance>>,changed=false) {
  if(inFlight.current)return;
  inFlight.current=true;setBusy(true);setError('');setSaved(false);
  try {const reply=await action();if(reply.ok){setState(reply.state);setSaved(changed);setConfirm(false);}else setError(reply.error);}
  catch {setError('UNAVAILABLE');}
  finally {inFlight.current=false;setBusy(false);}
 }
 useEffect(()=>{void run(()=>window.workstation!.appearance.load());},[]);
 const blocked=!state||['CORRUPT','UNSUPPORTED','READ_FAILED','UNAVAILABLE'].includes(error);
 return <section className="state-panel appearance-panel" aria-labelledby="appearance-title" aria-busy={busy}>
  <h2 id="appearance-title">{m.title}</h2><p>{m.description}</p>
  <div className="appearance-modes" role="group" aria-label={m.title}>{(['system','light','dark'] as Theme[]).map(theme=><button key={theme} type="button" className="control" aria-pressed={state?.theme===theme} aria-disabled={busy||blocked} disabled={blocked} onClick={()=>{if(!busy&&!blocked)void run(()=>window.workstation!.appearance.change({theme}),true);}}>{m[theme]}</button>)}</div>
  <p className="appearance-feedback" role="status" aria-live="polite">{busy?m.loading:error?m.notSaved:saved?m.saved:m.local}</p>
  {error&&<div className="workspace-error" role="alert"><span className="error-mark" aria-hidden="true">!</span><div><strong>{error==='CORRUPT'?m.corrupt:error==='UNSUPPORTED'?m.unsupported:m.failed}</strong><p>{m.kept}</p><button type="button" className="control" disabled={busy} onClick={()=>void run(()=>window.workstation!.appearance.load())}>{m.retry}</button>{error==='CORRUPT'&&<button type="button" className="control" disabled={busy} onClick={()=>setConfirm(true)}>{m.recover}</button>}</div></div>}
  {confirm&&<div className="recovery-confirm"><p>{m.confirmNote}</p><button type="button" className="control primary" disabled={busy} onClick={()=>void run(()=>window.workstation!.appearance.recover(),true)}>{m.confirm}</button><button type="button" className="control" disabled={busy} onClick={()=>setConfirm(false)}>{m.cancel}</button></div>}
 </section>;
}
