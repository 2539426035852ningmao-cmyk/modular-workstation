import {useEffect,useRef,useState} from 'react';
import {Icon,type IconName} from './Icons';
import type {PageId} from './i18n';
export type PageCommand={id:PageId;label:string;keywords:string;icon:IconName};
type Messages={title:string;query:string;placeholder:string;group:string;empty:string;close:string;hint:string};
// React adaptation of Fluent-Qt v1.10.2 CommandPalette; see THIRD_PARTY_NOTICES.md.
export default function CommandPalette({open,commands,m,onClose,onExecute}:{open:boolean;commands:PageCommand[];m:Messages;onClose:()=>void;onExecute:(id:PageId)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),composing=useRef(false);
 const [query,setQuery]=useState(''),[index,setIndex]=useState(0);
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const results=commands.filter(c=>words.every(word=>`${c.label} ${m.group} ${c.keywords}`.toLowerCase().includes(word)));
 const current=results[Math.min(index,Math.max(0,results.length-1))];
 useEffect(()=>{
  const d=dialog.current!;
  if(open&&!d.open){composing.current=false;setIndex(0);d.showModal();input.current?.select();}
  else if(!open&&d.open)d.close();
 },[open]);
 function execute(id:PageId){
  if(composing.current||!commands.some(c=>c.id===id))return;
  dialog.current?.close(); // Native dialog restores the caller's focus before navigation.
  onClose();onExecute(id);
 }
 return <dialog ref={dialog} className="command-palette" aria-labelledby="commands-title" onClose={()=>{composing.current=false;onClose();}} onCancel={e=>{if(composing.current)e.preventDefault();}} onKeyDown={e=>{
  // Leave IME Enter confirmation to the input method; only suppress dialog dismissal.
  if(composing.current||e.nativeEvent.isComposing||e.keyCode===229){if(e.key==='Escape')e.preventDefault();return;}
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(results.length)setIndex(i=>(i+(e.key==='ArrowDown'?1:results.length-1))%results.length);}
  else if(e.key==='Enter'&&e.target===input.current){e.preventDefault();if(current)execute(current.id);}
 }}>
  <div className="command-heading"><h2 id="commands-title">{m.title}</h2><button className="command-close" type="button" aria-label={m.close} onClick={()=>dialog.current?.close()}>×</button></div>
  <div className="command-query"><Icon name="search"/><input ref={input} type="text" role="combobox" aria-label={m.query} placeholder={m.placeholder} aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open} aria-controls="command-results" aria-activedescendant={current?`command-${current.id}`:undefined} value={query} onChange={e=>{setQuery(e.target.value);setIndex(0);}} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}}/></div>
  <p className="command-group">{m.group}</p>
  <ul id="command-results" className="command-results" role="listbox" aria-label={m.title}>{results.map(c=><li key={c.id} id={`command-${c.id}`} role="option" aria-selected={current?.id===c.id} onMouseDown={e=>e.preventDefault()} onClick={()=>execute(c.id)}><Icon name={c.icon}/><span>{c.label}</span><Icon name="corner" className="command-corner"/></li>)}</ul>
  {results.length===0&&<p className="command-empty" role="status">{m.empty}</p>}
  <p className="command-hint">{m.hint}</p>
 </dialog>;
}
