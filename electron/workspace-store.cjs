const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const writeAtomic = require('write-file-atomic');
const fail = code => { throw new Error(code); };
const plain = value => value && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, keys) => plain(value) && Object.keys(value).sort().join() === [...keys].sort().join();
const validId = id => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id);
const validName = name => typeof name === 'string' && name.trim() === name && name.length > 0 && name.length <= 60 && !/[\x00-\x1f\x7f]/.test(name);
const defaultView = () => ({ tabs: ['overview'], activeTab: 'overview', layout: 'standard' });
function validView(view) {
 return exact(view, ['tabs','activeTab','layout']) && Array.isArray(view.tabs) && view.tabs.length >= 1 && view.tabs.length <= 2
  && new Set(view.tabs).size === view.tabs.length && view.tabs.every(t => ['overview','resources'].includes(t))
  && view.tabs.includes(view.activeTab) && ['standard','focus'].includes(view.layout);
}
function validState(s) {
 return exact(s, ['version','lastWorkspaceId','workspaces']) && s.version === 1 && Array.isArray(s.workspaces) && s.workspaces.length <= 100
  && s.workspaces.every(w => exact(w,['id','name','view']) && validId(w.id) && validName(w.name) && validView(w.view))
  && new Set(s.workspaces.map(w => w.id)).size === s.workspaces.length
  && (s.lastWorkspaceId === null || s.workspaces.some(w => w.id === s.lastWorkspaceId));
}
class WorkspaceStore {
 constructor(directory, writer = writeAtomic) {
  this.file = path.join(directory, 'workspaces-v1.json'); this.writer = writer; this.tail = Promise.resolve(); this.state = null; this.blocked = null;
 }
 async load() {
  await this.tail;
  if (this.state && !this.blocked) return structuredClone(this.state);
  try {
   const stat = await fs.stat(this.file); if (stat.size > 1024*1024) fail('CORRUPT');
   const bytes = await fs.readFile(this.file, 'utf8');
   let state; try { state = JSON.parse(bytes); } catch { fail('CORRUPT'); }
   if (plain(state) && state.version !== 1) fail('UNSUPPORTED');
   if (!validState(state)) fail('CORRUPT');
   this.state = state; this.blocked = null;
  } catch (error) {
   if (error.code === 'ENOENT') { this.state = { version:1, lastWorkspaceId:null, workspaces:[] }; this.blocked = null; }
   else { this.blocked = ['CORRUPT','UNSUPPORTED'].includes(error.message) ? error.message : 'READ_FAILED'; fail(this.blocked); }
  }
  return structuredClone(this.state);
 }
 enqueue(operation) {
  const result = this.tail.then(operation); this.tail = result.catch(() => {}); return result;
 }
 mutate(command) {
  return this.enqueue(async () => {
   if (!this.state || this.blocked) fail(this.blocked || 'NOT_READY');
   const next = structuredClone(this.state);
   if (exact(command,['type','name']) && command.type === 'create' && validName(command.name)) {
    if (next.workspaces.length >= 100) fail('LIMIT');
    const workspace = { id:randomUUID(), name:command.name, view:defaultView() };
    next.workspaces.push(workspace); next.lastWorkspaceId = workspace.id;
   } else if ((exact(command,['type','id']) && ['open','reset'].includes(command.type))
    || (exact(command,['type','id','view']) && command.type === 'view' && validView(command.view))) {
    if (!validId(command.id)) fail('INVALID');
    const w = next.workspaces.find(w => w.id === command.id); if (!w) fail('INVALID');
    if (command.type === 'reset') w.view = defaultView();
    if (command.type === 'view') w.view = structuredClone(command.view);
    next.lastWorkspaceId = w.id;
   } else fail('INVALID');
   await fs.mkdir(path.dirname(this.file), {recursive:true});
   try { await this.writer(this.file, JSON.stringify(next,null,2)+'\n', {encoding:'utf8',mode:0o600,fsync:true}); } catch { fail('SAVE_FAILED'); }
   this.state = next; return structuredClone(next);
  });
 }
 recover() {
  return this.enqueue(async () => {
   if (this.blocked !== 'CORRUPT') fail('INVALID');
   // Preserve the original bytes before creating a new empty record on the next save.
   await fs.rename(this.file, path.join(path.dirname(this.file), `workspaces-v1.preserved-${randomUUID()}.json`));
   this.state = {version:1,lastWorkspaceId:null,workspaces:[]}; this.blocked = null;
   return structuredClone(this.state);
  });
 }
}
module.exports = {WorkspaceStore};
