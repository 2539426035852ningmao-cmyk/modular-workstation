const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {WorkspaceStore}=require('../electron/workspace-store.cjs');
test('workspace views survive reopening and reset preserves other spaces',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-store-'));
 try{
  const store=new WorkspaceStore(dir);await store.load();
  const a=await store.mutate({type:'create',name:'创作空间'});const id=a.lastWorkspaceId;
  await store.mutate({type:'view',id,view:{tabs:['overview','resources'],activeTab:'resources',layout:'focus'}});
  const b=await store.mutate({type:'create',name:'第二空间'});
  await store.mutate({type:'open',id});
  const reopened=await new WorkspaceStore(dir).load();
  assert.equal(reopened.lastWorkspaceId,id);assert.equal(reopened.workspaces[0].view.layout,'focus');
  const reset=await store.mutate({type:'reset',id});
  assert.equal(reset.workspaces.length,2);assert.equal(reset.workspaces[1].id,b.lastWorkspaceId);
  assert.equal(reset.workspaces[0].view.layout,'standard');
  await assert.rejects(store.mutate({type:'view',id,view:{tabs:['../../secret'],activeTab:'../../secret',layout:'standard'}}));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('failed saves and corrupt files preserve the last bytes and require explicit recovery',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-store-'));
 try{
  const store=new WorkspaceStore(dir);await store.load();await store.mutate({type:'create',name:'保留'});
  const file=path.join(dir,'workspaces-v1.json'),before=await fs.readFile(file,'utf8');
  const failing=new WorkspaceStore(dir,async()=>{throw new Error('disk full');});await failing.load();
  await assert.rejects(failing.mutate({type:'create',name:'失败'}));
  assert.equal(await fs.readFile(file,'utf8'),before);
  await fs.writeFile(file,'broken');const corrupt=new WorkspaceStore(dir);
  await assert.rejects(corrupt.load(),/CORRUPT/);await assert.rejects(corrupt.mutate({type:'create',name:'不应覆盖'}));
  assert.equal(await fs.readFile(file,'utf8'),'broken');
  await corrupt.recover();assert.ok((await fs.readdir(dir)).some(n=>n.startsWith('workspaces-v1.preserved-')));
  assert.equal((await corrupt.load()).workspaces.length,0);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('queued saves retain all changes and future schemas cannot be reset',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-store-'));
 try {
  const store=new WorkspaceStore(dir);await store.load();
  await Promise.all(['一','二','三'].map(name=>store.mutate({type:'create',name})));
  assert.equal((await new WorkspaceStore(dir).load()).workspaces.length,3);
  const file=path.join(dir,'workspaces-v1.json'),future='{"version":2}';await fs.writeFile(file,future);
  const old=new WorkspaceStore(dir);await assert.rejects(old.load(),/UNSUPPORTED/);await assert.rejects(old.recover(),/INVALID/);
  assert.equal(await fs.readFile(file,'utf8'),future);
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
