const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {AppearanceStore}=require('../electron/appearance-store.cjs');
test('failed default recovery preserves the original file and stays recoverable',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-appearance-'));
 try{
  const file=path.join(dir,'appearance-v1.json');await fs.writeFile(file,'broken');
  const store=new AppearanceStore(dir,async()=>{throw Error('disk full');});
  await assert.rejects(store.load(),/CORRUPT/);await assert.rejects(store.recover(),/SAVE_FAILED/);
  assert.equal(await fs.readFile(file,'utf8'),'broken');await assert.rejects(store.load(),/CORRUPT/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('appearance saves separately and failed writes preserve the previous preference',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-appearance-'));
 try{
  const store=new AppearanceStore(dir);assert.equal((await store.load()).theme,'system');
  await store.change({theme:'dark'});assert.equal((await new AppearanceStore(dir).load()).theme,'dark');
  const file=path.join(dir,'appearance-v1.json'),before=await fs.readFile(file,'utf8');
  const failing=new AppearanceStore(dir,async()=>{throw Error('disk full');});await failing.load();
  await assert.rejects(failing.change({theme:'light'}),/SAVE_FAILED/);assert.equal(await fs.readFile(file,'utf8'),before);
  await assert.rejects(store.change({theme:'dark',path:'C:/secret'}),/INVALID/);
  await assert.rejects(store.change({theme:'automatic'}),/INVALID/);
  assert.equal((await fs.readdir(dir)).some(n=>n.startsWith('workspaces')),false);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('corrupt appearance records require explicit preservation and future versions remain read only',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-appearance-'));
 try{
  const file=path.join(dir,'appearance-v1.json');await fs.writeFile(file,'broken');
  const store=new AppearanceStore(dir);await assert.rejects(store.load(),/CORRUPT/);await assert.rejects(store.change({theme:'light'}),/CORRUPT/);
  assert.equal(await fs.readFile(file,'utf8'),'broken');await store.recover();
  assert.equal((await store.load()).theme,'system');const backup=(await fs.readdir(dir)).find(n=>n.startsWith('appearance-v1.preserved-'));
  assert.equal(await fs.readFile(path.join(dir,backup),'utf8'),'broken');
  await fs.writeFile(file,'{"version":2}');const future=new AppearanceStore(dir);await assert.rejects(future.load(),/UNSUPPORTED/);await assert.rejects(future.recover(),/INVALID/);
  assert.equal(await fs.readFile(file,'utf8'),'{"version":2}');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
