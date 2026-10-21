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
test('failure to create a state directory is a save failure',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-permission-')),dir=path.join(root,'profile');
 try {
  const store=new WorkspaceStore(dir);await store.load();await fs.writeFile(dir,'blocked directory');
  await assert.rejects(store.mutate({type:'create',name:'未保存'}),/SAVE_FAILED/);
  assert.equal(await fs.readFile(dir,'utf8'),'blocked directory');
 } finally {await fs.rm(root,{recursive:true,force:true});}
});
test('a missing version is corrupt and recoverable while real future versions stay protected',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-schema-'));
 try {
  const file=path.join(dir,'workspaces-v1.json');await fs.writeFile(file,'{}');
  const store=new WorkspaceStore(dir);await assert.rejects(store.load(),/CORRUPT/);
  await store.recover();const names=await fs.readdir(dir);
  const preserved=names.find(n=>n.startsWith('workspaces-v1.preserved-'));
  assert.ok(preserved);assert.equal(await fs.readFile(path.join(dir,preserved),'utf8'),'{}');
  await fs.writeFile(file,'{"version":2}');const future=new WorkspaceStore(dir);
  await assert.rejects(future.load(),/UNSUPPORTED/);await assert.rejects(future.recover(),/INVALID/);
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('initial load and immediate changes share one queue',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-load-'));
 try {
  const store=new WorkspaceStore(dir);
  const [,created]=await Promise.all([store.load(),store.mutate({type:'create',name:'排队空间'})]);
  assert.equal(created.workspaces.length,1);
  assert.equal((await new WorkspaceStore(dir).load()).workspaces[0].name,'排队空间');
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('failed preservation keeps bytes and a reread recovers after an external file removal',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-retry-'));
 try {
  const file=path.join(dir,'workspaces-v1.json');await fs.writeFile(file,'broken');
  const store=new WorkspaceStore(dir);await assert.rejects(store.load(),/CORRUPT/);
  await fs.unlink(file);await assert.rejects(store.recover(),/ENOENT/);
  assert.equal((await store.load()).workspaces.length,0);
  await store.mutate({type:'create',name:'重新读取后恢复'});
 } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('malformed UUID records are rejected without changing their bytes',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-id-'));
 try {
  const id='-'.repeat(36),file=path.join(dir,'workspaces-v1.json');
  const bytes=JSON.stringify({version:1,lastWorkspaceId:id,workspaces:[{id,name:'坏记录',view:{tabs:['overview'],activeTab:'overview',layout:'standard'}}]});
  await fs.writeFile(file,bytes);await assert.rejects(new WorkspaceStore(dir).load(),/CORRUPT/);
  assert.equal(await fs.readFile(file,'utf8'),bytes);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
