const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {expect}=require('@playwright/test');const electron=require('./helpers/electron.cjs');
test('command palette navigates existing pages with keyboard focus and composition safety',async()=>{
 const app=await electron.launch(process.env.WORKSTATION_TEST_EXECUTABLE?{executablePath:process.env.WORKSTATION_TEST_EXECUTABLE,args:[]}:{args:[path.join(__dirname,'..')]});
 try{
  const p=await app.firstWindow(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await p.context().setOffline(true);
  await p.addInitScript(()=>Object.defineProperty(navigator,'language',{get:()=>'zh-CN',configurable:true}));await p.reload();
  await p.getByRole('navigation').waitFor();const trigger=p.locator('.search-surface'),dialog=p.locator('.command-palette'),input=p.getByRole('combobox');
  await trigger.click();await expect(dialog).toBeVisible();await expect(input).toBeFocused();await expect(p.getByRole('option')).toHaveCount(4);
  await input.fill('页面 SET TINGS');await expect(p.getByRole('option')).toHaveCount(1);await p.keyboard.press('Enter');await expect(dialog).not.toBeVisible();await expect(p.locator('nav button').nth(3)).toHaveAttribute('aria-current','page');await expect(trigger).toBeFocused();
  await p.keyboard.press('Control+k');await expect(dialog).toBeVisible();await expect(input).toHaveValue('页面 SET TINGS');assert.deepEqual(await input.evaluate(e=>[e.selectionStart,e.selectionEnd]),[0,12]);
  await input.fill('not-a-real-command');await expect(p.getByRole('option')).toHaveCount(0);await expect(dialog.getByRole('status')).toHaveText('没有匹配的命令');await p.keyboard.press('Enter');await expect(dialog).toBeVisible();
  await input.fill('');await p.keyboard.press('ArrowDown');await expect(p.getByRole('option').nth(1)).toHaveAttribute('aria-selected','true');await p.keyboard.press('Enter');await expect(p.locator('nav button').nth(1)).toHaveAttribute('aria-current','page');
  await trigger.click();await p.keyboard.press('ArrowUp');await expect(p.getByRole('option').nth(3)).toHaveAttribute('aria-selected','true');await input.focus();await p.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'关闭命令面板'})).toBeFocused();await p.keyboard.press('Tab');await expect(input).toBeFocused();
  await input.fill('home');await input.dispatchEvent('compositionstart');await p.keyboard.press('Enter');await expect(dialog).toBeVisible();await expect(p.locator('nav button').nth(1)).toHaveAttribute('aria-current','page');await p.keyboard.press('Escape');await expect(dialog).toBeVisible();await input.dispatchEvent('compositionend');await p.keyboard.press('Enter');await expect(dialog).not.toBeVisible();await expect(p.locator('nav button').nth(0)).toHaveAttribute('aria-current','page');
  await p.dispatchEvent('body','keydown',{key:'k',ctrlKey:true,isComposing:true});await expect(dialog).not.toBeVisible();await trigger.click();await p.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  await trigger.click();await input.fill('plugins');await p.getByRole('option').click();await expect(dialog).not.toBeVisible();await expect(p.locator('nav button').nth(2)).toHaveAttribute('aria-current','page');
  await p.locator('nav button').nth(1).click();await expect(p.locator('.workspaces')).toHaveAttribute('aria-busy','false');const draft=p.locator('#workspace-name');await draft.fill('尚未提交的名称');await draft.focus();await p.keyboard.press('Control+k');await expect(dialog).toBeVisible();await p.keyboard.press('Escape');await expect(draft).toBeFocused();await expect(draft).toHaveValue('尚未提交的名称');
  for(const locale of ['zh-CN','en-US']){await p.addInitScript(l=>Object.defineProperty(navigator,'language',{get:()=>l,configurable:true}),locale);await p.reload();await expect(trigger).toHaveAttribute('aria-label',locale==='zh-CN'?'查找命令':'Find commands');
   for(const theme of ['dark','light']){await p.emulateMedia({colorScheme:theme});for(const [width,zoom]of [[1440,1],[800,2]]){
    await app.evaluate(({BrowserWindow},{width,zoom})=>{const w=BrowserWindow.getAllWindows()[0];w.setContentSize(width,760);w.webContents.setZoomFactor(zoom);},{width,zoom});await trigger.click();await input.fill('');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await dialog.evaluate(e=>e.scrollWidth>e.clientWidth),false);
    const b=await dialog.boundingBox();assert.ok(b.x>=0&&b.width<=width/zoom);
    assert.equal(await p.getByRole('option').first().evaluate(e=>getComputedStyle(e).backgroundColor),theme==='dark'?'rgb(34, 84, 135)':'rgb(12, 57, 103)');
    await electron.screenshot(app,p,path.join(__dirname,'../docs/design/previews/runtime',`commands-${locale}-${theme}-${width/zoom}.png`));await dialog.getByRole('button').click();await expect(dialog).not.toBeVisible();
   }}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 }finally{await app.close();}
});
