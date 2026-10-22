export type Tab = 'overview' | 'resources';
export type View = {tabs:Tab[];activeTab:Tab;layout:'standard'|'focus'};
export type State = {version:1;lastWorkspaceId:string|null;workspaces:{id:string;name:string;view:View}[]};
export type Command = {type:'create';name:string}|{type:'open'|'reset';id:string}|{type:'view';id:string;view:View};
export type Result<T> = {ok:true;state:T}|{ok:false;error:string};
export type Reply = Result<State>;
export type Theme = 'system'|'light'|'dark';
export type Appearance = {version:1;theme:Theme};
declare global {interface Window {workstation?:{
 load:()=>Promise<Reply>;change:(command:Command)=>Promise<Reply>;recover:()=>Promise<Reply>;
 appearance:{load:()=>Promise<Result<Appearance>>;change:(command:{theme:Theme})=>Promise<Result<Appearance>>;recover:()=>Promise<Result<Appearance>>};
}}}
