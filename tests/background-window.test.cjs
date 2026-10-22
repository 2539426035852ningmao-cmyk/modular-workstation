const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const electron=require('./helpers/background.cjs');
test('isolated background verification never shows or focuses a window or native prompt',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'workstation-background-'));
 const app=await electron.launch({args:[path.join(__dirname,'..'),`--user-data-dir=${profile}`,'--workstation-background']});
 try{
  const p=await app.firstWindow();await p.getByRole('navigation').waitFor();await p.locator('nav button').nth(3).click();
  const state=await app.evaluate(async({BrowserWindow,dialog})=>{const w=BrowserWindow.getAllWindows()[0];return{visible:w.isVisible(),focused:w.isFocused(),focusable:w.isFocusable(),dialog:(await dialog.showMessageBox(w,{message:'hidden verification'})).response};});
  assert.deepEqual(state,{visible:false,focused:false,focusable:false,dialog:0});
  const shot=path.join(profile,'hidden-check.png');await electron.screenshot(app,p,shot);
  assert.equal((await fs.readFile(shot)).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  // A screenshot must contain the latest painted frame, not the previous page.
  for(const [color,pixel]of [['#123456',[86,52,18,255]],['#abcdef',[239,205,171,255]]]){
   await p.evaluate(color=>{let probe=document.querySelector('#capture-probe');if(!probe){probe=document.createElement('div');probe.id='capture-probe';document.body.append(probe);}probe.style.cssText=`position:fixed;inset:0;z-index:99999;background:${color}`;},color);
   await electron.screenshot(app,p,shot);
   assert.deepEqual(await app.evaluate(({nativeImage},file)=>Array.from(nativeImage.createFromPath(file).getBitmap().subarray(0,4)),shot),pixel);
  }
  assert.deepEqual(await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return{visible:w.isVisible(),focused:w.isFocused()};}),{visible:false,focused:false});
 }finally{await app.close();await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
