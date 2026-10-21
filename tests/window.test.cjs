const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const electron = require('./helpers/electron.cjs');

test('desktop window opens and navigation switches content by mouse and keyboard', async () => {
  const application = await electron.launch({ args: [path.join(__dirname, '..')] });
  try {
    const window = await application.firstWindow();
    const remoteRequests = [];
    window.on('request', (request) => {
      if (/^https?:/.test(request.url())) remoteRequests.push(request.url());
    });
    await window.getByRole('navigation').waitFor();
    const rendererGlobals = await window.evaluate(() => ({ nodeRequire: typeof window.require, nodeProcess: typeof window.process }));
    assert.deepEqual(rendererGlobals, { nodeRequire: 'undefined', nodeProcess: 'undefined' });
    assert.match(await window.title(), /工作站|Workstation/);
    assert.equal(await window.locator('nav button').count(), 4);
    assert.equal(await window.locator('.module-card').count(), 3);

    const workspace = window.getByRole('navigation').getByRole('button', { name: /工作区|Workspaces/ });
    await workspace.click();
    assert.equal(await workspace.getAttribute('aria-current'), 'page');
    assert.match(await window.locator('#page-title').innerText(), /工作区|Workspaces/);

    const plugins = window.getByRole('navigation').getByRole('button', { name: /插件|Plugins/ });
    await workspace.focus();
    await window.keyboard.press('Tab');
    assert.equal(await plugins.evaluate((element) => element === document.activeElement), true);
    await window.keyboard.press('Enter');
    assert.equal(await plugins.getAttribute('aria-current'), 'page');
    assert.match(await window.locator('.empty-panel:visible').innerText(), /尚未实现|not implemented/);
    assert.deepEqual(remoteRequests, []);

    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2));
    const viewport = await window.evaluate(() => ({ visible: innerWidth, content: document.documentElement.scrollWidth }));
    assert.ok(viewport.content <= viewport.visible, `horizontal overflow at 200% zoom: ${JSON.stringify(viewport)}`);

    await window.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await window.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()), '#1c1d20');
    await window.emulateMedia({ colorScheme: 'light' });
    assert.equal(await window.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()), '#f8f5ef');
  } finally {
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(1)).catch(() => {});
    await application.close();
  }
});
