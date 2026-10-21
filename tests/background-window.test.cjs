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
 }finally{await app.close();await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
