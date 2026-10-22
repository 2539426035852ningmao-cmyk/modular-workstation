const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {expect}=require('@playwright/test'),electron=require('./helpers/electron.cjs');
test('Chinese commands keep native composition confirmation and committed Chinese text intact',async()=>{
 const app=await electron.launch(process.env.WORKSTATION_TEST_EXECUTABLE?{executablePath:process.env.WORKSTATION_TEST_EXECUTABLE,args:[]}:{args:[path.join(__dirname,'..')]});
 try{
  const p=await app.firstWindow();await p.addInitScript(()=>Object.defineProperty(navigator,'language',{get:()=>'zh-CN',configurable:true}));await p.reload();
  await p.getByRole('button',{name:'查找命令',exact:true}).click();const input=p.getByRole('combobox'),dialog=p.locator('.command-palette');
  await input.fill('设置');await input.dispatchEvent('compositionstart');
  const allowed=await input.evaluate(e=>e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true})));
  assert.equal(allowed,true,'Application must leave IME Enter confirmation uncancelled');
  await expect(dialog).toBeVisible();await expect(input).toHaveValue('设置');await input.dispatchEvent('compositionend');
  for(const flags of [{isComposing:true},{keyCode:229}]){
   assert.equal(await input.evaluate((e,flags)=>e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,...flags})),flags),true);await expect(dialog).toBeVisible();
  }
  await input.fill('');const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.imeSetComposition',{text:'设置',selectionStart:2,selectionEnd:2});
  await expect(input).toHaveValue('设置');await p.keyboard.press('Enter');await expect(dialog).toBeVisible();
  await cdp.send('Input.insertText',{text:'设置'});await expect(input).toHaveValue('设置');
  await expect(p.getByRole('option')).toHaveCount(1);await expect(p.getByRole('option')).toHaveText('设置');
  await p.keyboard.press('Enter');await expect(dialog).not.toBeVisible();await expect(p.locator('nav button').nth(3)).toHaveAttribute('aria-current','page');
  await p.getByRole('button',{name:'查找命令',exact:true}).click();await input.fill('工作区　空间');await expect(p.getByRole('option')).toHaveCount(1);await expect(p.getByRole('option')).toHaveText('工作区');
  await input.fill('设置 外观');await expect(p.getByRole('option')).toHaveText('设置');
  for(const theme of ['dark','light']){await p.emulateMedia({colorScheme:theme});assert.equal(await p.locator('html').getAttribute('lang'),'zh-CN');assert.equal((await dialog.innerText()).includes('\ufffd'),false);await electron.screenshot(app,p,path.join(__dirname,`../docs/design/previews/runtime/commands-zh-ime-${theme}.png`));}
  await cdp.detach();
 }finally{await app.close();}
});
test('Chinese workspace naming does not create a space when confirming composition',async()=>{
 const app=await electron.launch(process.env.WORKSTATION_TEST_EXECUTABLE?{executablePath:process.env.WORKSTATION_TEST_EXECUTABLE,args:[]}:{args:[path.join(__dirname,'..')]});
 try{
  const p=await app.firstWindow();await p.addInitScript(()=>Object.defineProperty(navigator,'language',{get:()=>'zh-CN',configurable:true}));await p.reload();await p.locator('nav button').nth(1).click();await expect(p.locator('.workspaces')).toHaveAttribute('aria-busy','false');
  const input=p.locator('#workspace-name');await input.focus();const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.imeSetComposition',{text:'中文空间',selectionStart:4,selectionEnd:4});await p.keyboard.press('Enter');
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await expect(p.locator('.workspaces')).toHaveAttribute('aria-busy','false');
  await expect(p.locator('.workspace-switcher button')).toHaveCount(0);await expect(input).toHaveValue('中文空间');
  await cdp.send('Input.insertText',{text:'中文空间'});
  // Browser submit has no IME flags; capture the initiating key without cancelling it.
  for(const flags of [{isComposing:true},{keyCode:229}]){
   const allowed=await input.evaluate((e,flags)=>{const event=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,...flags});const allowed=e.dispatchEvent(event);e.form.requestSubmit();e.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));return allowed;},flags);
   assert.equal(allowed,true);await expect(p.locator('.workspace-switcher button')).toHaveCount(0);
  }
  await p.keyboard.press('Enter');await expect(p.locator('.workspace-feedback')).toHaveText('已保存到本机');await expect(p.locator('.workspace-switcher button')).toHaveCount(1);await expect(p.locator('.workspace-toolbar h2')).toHaveText('中文空间');
  await cdp.detach();
 }finally{await app.close();}
});
