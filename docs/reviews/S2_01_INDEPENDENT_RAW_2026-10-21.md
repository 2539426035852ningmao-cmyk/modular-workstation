# 独立审查原文

2026-10-21 官方 Antigravity CLI 1.4.3 只读代码快照 静态审查不等于运行测试
前四次有效分段请求使用默认模型并设 effort low 返回未标明模型 ID 因此不把历史会话型号当成本轮型号实证
以下保留原始意见 具体采纳和驳回见同目录 S2_01_WORKSPACES_2026-10-21.md 不代表所有发现均已复现

## Store

conversation 57d45cc1-73f8-41ee-aa57-018bdbb59170

duration 16.8008934 seconds

# Independent Read-Only Code Review: Issue 30 — Windows Electron Local Workspace Store

**Date:** 2026-10-21  
**Target:** `electron/workspace-store.cjs`

---

### Defect 1: Concurrent `load()` Invocations Bypass In-Progress Loads and Race Unserialized
- **Severity:** High (Correctness / Race Condition)
- **Exact Evidence:**
  Lines 24–26:
  ```javascript
  async load() {
   await this.tail;
   if (this.state && !this.blocked) return structuredClone(this.state);
   try { ... }
  ```
  `this.tail` tracks queued operations via `enqueue()`. However, `load()` does **not** enqueue itself onto `this.tail` nor update `this.tail`. If two `load()` calls occur concurrently while `this.state === null`, both await the current `this.tail`, both pass `if (this.state && !this.blocked)`, and both perform concurrent reading/parsing from disk without coordination. Furthermore, an intervening `mutate()` queued during `load()`'s async read will execute before a second `load()` completes or can race with state assignment.
- **Minimal Fix:**
  Route `load()` execution through `this.enqueue()` or track a shared loading promise:
  ```javascript
  load() {
    return this.enqueue(async () => {
      if (this.state && !this.blocked) return structuredClone(this.state);
      try {
        const stat = await fs.stat(this.file);
        // ... rest of load logic ...
      } catch (error) { ... }
      return structuredClone(this.state);
    });
  }
  ```

---

### Defect 2: `recover()` Fails Permanently When Preserving Non-Existent or Unlinkable Corrupt File
- **Severity:** High (Data Loss / Recovery Lockout)
- **Exact Evidence:**
  Lines 28 & 56–58:
  ```javascript
  // In load():
  const stat = await fs.stat(this.file); if (stat.size > 1024*1024) fail('CORRUPT');
  let state; try { state = JSON.parse(bytes); } catch { fail('CORRUPT'); }
  if (!validState(state)) fail('CORRUPT');
  
  // In recover():
  if (this.blocked !== 'CORRUPT') fail('INVALID');
  await fs.rename(this.file, path.join(path.dirname(this.file), `workspaces-v1.preserved-${randomUUID()}.json`));
  this.state = {version:1,lastWorkspaceId:null,workspaces:[]}; this.blocked = null;
  ```
  If `this.file` was flagged `CORRUPT` due to an issue where renaming fails (e.g., file deleted/locked externally on Windows `EBUSY`/`EPERM`, or if the file was removed after `load()` failed), `fs.rename` throws an unhandled error inside `recover()`. Because `this.state` and `this.blocked` are only updated *after* `fs.rename`, the store remains permanently stuck in `blocked = 'CORRUPT'` with no mechanism to unblock or reset the workspace state without manually deleting/editing filesystem files or restarting the app.
- **Minimal Fix:**
  Wrap `fs.rename` in a `try...catch` allowing recovery to proceed even if the source corrupt file cannot be preserved:
  ```javascript
  try {
    await fs.rename(this.file, path.join(path.dirname(this.file), `workspaces-v1.preserved-${randomUUID()}.json`));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // or log error and proceed with reset
  }
  this.state = {version:1,lastWorkspaceId:null,workspaces:[]}; this.blocked = null;
  ```

---

### Defect 3: Non-Normalized UUID Validation Rejects Valid RFC 4122 v4 UUIDs
- **Severity:** Medium (Correctness)
- **Exact Evidence:**
  Line 8 & Line 40:
  ```javascript
  const validId = id => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id);
  // ...
  const workspace = { id:randomUUID(), name:command.name, view:defaultView() };
  ```
  While Node's `randomUUID()` generates lowercase hex characters matching `/^[0-9a-f-]{36}$/`, `validId` allows arbitrary hyphenation patterns (e.g. `------------------------------------`) while strictly rejecting uppercase standard UUIDs that may come from external IPC calls, Windows client components, or existing stored records (e.g., `550E8400-E29B-41D4-A716-446655440000`). When client code issues `mutate({ type: 'open', id: ... })` with an uppercase UUID or when standard UUID format validation is expected, valid UUIDs fail validation with `INVALID`.
- **Minimal Fix:**
  Enforce standard 8-4-4-4-12 UUID format with case-insensitivity:
  ```javascript
  const validId = id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  ```

---

### Defect 4: POSIX Octal Mode `0o600` Ineffective on Windows NTFS Creating Inconsistent Permission Expectations
- **Severity:** Low (Platform Portability / Correctness)
- **Exact Evidence:**
  Line 50:
  ```javascript
  await this.writer(this.file, JSON.stringify(next,null,2)+'\n', {encoding:'utf8',mode:0o600,fsync:true});
  ```
  On Windows systems (the target environment), Node.js and libuv map file modes via ACLs where `0o600` only sets or clears the `FILE_ATTRIBUTE_READONLY` flag. The group/other permission bits have no effect in Windows NTFS ACL security descriptors. While `write-file-atomic` executes, reliance on POSIX mode `0o600` fails to restrict read/write access from other local users on shared Windows machines.
- **Minimal Fix:**
  Ensure default file creation flags or handle Windows ACL restrictions using native security controls if multi-user isolation on Windows is intended, or use standard `{ encoding: 'utf8', fsync: true }`.

---

### Summary
No other blocking defects found. The critical items are Defect 1 (concurrency race on `load()`) and Defect 2 (fatal lockup during `recover()` on Windows filesystem failures).


## IPC

conversation 4e72592e-f3a0-41ae-8c57-9ce3a5a07c7e

duration 20.7341205 seconds

# Code Review: Electron IPC and Window Lifecycle (Issue #30)

**Review Date**: 2026-10-21  
**Scope**: `electron/main.cjs`, `electron/preload.cjs`, `index.html` (Supplied files only)

---

### Defect 1: Window Destruction and IPC Re-entrance in Asynchronous `close` Handler Causes Unhandled Rejections and Crashes

- **Severity**: High
- **Evidence**:
  In `electron/main.cjs`:
  ```javascript
  let closing = false;
  window.on('close', event => {
    if (closing) return;
    event.preventDefault();
    void store.tail.then(async () => {
      if (saveFailed) {
        const zh = app.getLocale().startsWith('zh');
        const result = await dialog.showMessageBox(window, { ... });
        if (result.response !== 1) return;
      }
      closing = true; window.close();
    });
  });
  ```
  And in IPC handlers:
  ```javascript
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame
    || event.senderFrame.url !== pathToFileURL(entry).href) return {ok:false,error:'DENIED'};
  ```
- **Reproduction**:
  1. The user initiates window closure (triggering `window.on('close')`), which prevents default and enters `store.tail.then(...)`.
  2. If the user clicks close a second time or if the app or OS terminates the window while the dialog is displaying or `store.tail` is executing, `window.isDestroyed()` becomes true.
  3. Invoking `dialog.showMessageBox(window, ...)` or `window.close()` on an already destroyed window instance throws `Object has been destroyed`.
  4. Furthermore, during the asynchronous await of `store.tail` or `showMessageBox`, the renderer is still running and can fire further IPC calls or state mutations after the user chose to exit.
- **Minimal Fix**:
  Guard against destroyed windows before opening dialogs or closing, and explicitly check `window.isDestroyed()`:
  ```javascript
  window.on('close', event => {
    if (closing) return;
    event.preventDefault();
    void store.tail.then(async () => {
      if (window.isDestroyed()) return;
      if (saveFailed) {
        const zh = (app.getLocale() || '').startsWith('zh');
        const result = await dialog.showMessageBox(window, {
          type: 'warning',
          buttons: zh ? ['返回工作站', '放弃本次更改并退出'] : ['Return to workstation', 'Discard failed change and exit'],
          defaultId: 0,
          cancelId: 0,
          message: zh ? '本次更改未保存' : 'The latest change was not saved',
          detail: zh ? '原有记录保持不变' : 'Previous records are unchanged'
        });
        if (result.response !== 1) return;
      }
      closing = true;
      if (!window.isDestroyed()) window.close();
    }).catch(() => {
      closing = true;
      if (!window.isDestroyed()) window.close();
    });
  });
  ```

---

### Defect 2: Dangling Reference to `mainWindow` on Window Close Prevents macOS Re-activation and Blocks Second-Instance Focus

- **Severity**: Medium
- **Evidence**:
  In `electron/main.cjs`:
  ```javascript
  let mainWindow;
  ...
  function createWindow() {
    const window = new BrowserWindow({ ... });
    ...
    mainWindow = window;
    return window;
  }
  ...
  app.on('second-instance', () => { if (mainWindow) { mainWindow.restore(); mainWindow.focus(); } });
  ...
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  ```
- **Reproduction**:
  1. On macOS (or in multi-window / minimize-to-tray scenarios where `window-all-closed` does not quit), the user closes the window.
  2. `mainWindow` still holds a reference to the destroyed `BrowserWindow` instance.
  3. When a `second-instance` event arrives, `if (mainWindow)` evaluates to truthy, and calling `mainWindow.restore()` / `mainWindow.focus()` on the destroyed window throws `Error: Object has been destroyed`.
  4. Any IPC handler relying on `mainWindow` checking will fail with stale references.
- **Minimal Fix**:
  Clean up `mainWindow` when the window is closed:
  ```javascript
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });
  ```
  And check `isDestroyed()` in `second-instance`:
  ```javascript
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  ```

---

### Defect 3: Fragile URL Comparison in IPC Handler Causes False `DENIED` on Case-Insensitive Windows Paths and Formatted URLs

- **Severity**: Medium
- **Evidence**:
  In `electron/main.cjs`:
  ```javascript
  const entry = path.join(__dirname, '..', 'dist', 'index.html');
  ...
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame
    || event.senderFrame.url !== pathToFileURL(entry).href) return {ok:false,error:'DENIED'};
  ```
- **Reproduction**:
  1. On Windows, file system paths are case-insensitive. Depending on how the working directory / `__dirname` is resolved (e.g., short 8.3 names `RUNNER~1`, drive letter casing `c:` vs `C:`), `pathToFileURL(entry).href` might be `file:///c:/...` while Chromium's `event.senderFrame.url` normalizes to `file:///C:/...` or percentage-encodes special characters differently.
  2. Furthermore, if hash routing or query parameters are ever appended in production / test fixtures (`dist/index.html#/workspace`), strict string inequality (`!==`) fails and all IPC calls are rejected with `{ ok: false, error: 'DENIED' }`.
- **Minimal Fix**:
  Compare normalized URL file paths or origins rather than strict href equality:
  ```javascript
  const expectedUrl = pathToFileURL(entry).href;
  const frameUrl = event.senderFrame.url;
  const isExpectedFile = frameUrl === expectedUrl || frameUrl.startsWith(expectedUrl + '#') || frameUrl.startsWith(expectedUrl + '?');
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame
    || !isExpectedFile) return {ok:false,error:'DENIED'};
  ```

---

### Defect 4: Single-Instance Lock Failure Leaks IPC Handlers and Asynchronous Lifecycle Handlers Before Process Exit

- **Severity**: Low
- **Evidence**:
  In `electron/main.cjs`:
  ```javascript
  const primary = app.requestSingleInstanceLock();
  if (!primary) app.quit();
  app.on('second-instance', () => { ... });
  for (const [channel,operation] of Object.entries({ ... })) ipcMain.handle(channel, ...);
  ```
- **Reproduction**:
  1. When a secondary instance starts, `app.requestSingleInstanceLock()` returns `false`.
  2. `app.quit()` schedules the Electron event loop to terminate, but the subsequent synchronous module top-level code continues executing.
  3. The secondary instance registers all `ipcMain.handle(...)` handlers and subscribes to events before the process actually exits.
- **Minimal Fix**:
  Return or exit immediately when `!primary`:
  ```javascript
  const primary = app.requestSingleInstanceLock();
  if (!primary) {
    app.quit();
    process.exit(0);
  }
  ```

---

### Defect 5: Unhandled Promise Rejections in `dialog.showMessageBox` / `store.tail` Hang Window Closure

- **Severity**: Low
- **Evidence**:
  In `electron/main.cjs`:
  ```javascript
  void store.tail.then(async () => {
    if (saveFailed) {
      const zh = app.getLocale().startsWith('zh');
      const result = await dialog.showMessageBox(window, { ... });
      if (result.response !== 1) return;
    }
    closing = true; window.close();
  });
  ```
- **Reproduction**:
  1. If `store.tail` rejects (e.g., store queue corruption or unhandled disk error attached to `tail`), the promise rejection is swallowed with `void store.tail.then(...)` without a `.catch(...)` handler.
  2. Because `event.preventDefault()` was called and `closing` is never set to `true`, the window becomes completely unclosable via the close button (user is trapped).
- **Minimal Fix**:
  Add `.catch(...)` error handling to allow closing if the persistence queue rejects:
  ```javascript
  void store.tail
    .then(async () => {
      if (saveFailed && !window.isDestroyed()) {
        const zh = (app.getLocale() || '').startsWith('zh');
        const result = await dialog.showMessageBox(window, { ... });
        if (result.response !== 1) return;
      }
      closing = true;
      if (!window.isDestroyed()) window.close();
    })
    .catch((err) => {
      console.error('Store flush failed during close:', err);
      closing = true;
      if (!window.isDestroyed()) window.close();
    });
  ```


## UI

conversation cfb4b88e-7aab-4e02-8852-211e2fbf45f2

duration 22.9649548 seconds

# Independent Read-Only Code Review: Issue 30 (`Workspace.tsx`)

**Date**: 2026-10-21  
**Scope**: Read-only defect review of the supplied `src/Workspace.tsx`. No external files assumed or invented.

---

### Defect 1: Unhandled `null`/`undefined` Window Global on Commands and Retries Causes Unhandled Runtime Exceptions
* **Severity**: High (App crash / UI freeze)
* **Evidence**:
  ```tsx
  const change = (command:Command) => request(()=>window.workstation!.change(command),true);
  // ...
  <button className="control" disabled={busy} onClick={()=>void request(()=>window.workstation!.load())}>
  // ...
  onClick={()=>void request(()=>window.workstation!.recover()).then(...)}
  ```
  In initial mount, optional chaining is used (`window.workstation?.load()`), and handles absence via `'UNAVAILABLE'`. However, `change()`, the retry `<button onClick>`, and the recover `<button onClick>` use non-null assertions (`window.workstation!.change(...)`, `window.workstation!.load()`, `window.workstation!.recover()`). If `window.workstation` is undefined (e.g. electron preload failed or running in non-desktop/browser contexts), invoking these callbacks throws a synchronous `TypeError: Cannot read properties of undefined` outside the promise callback or within `request()` before invocation.
* **Reproduction**:
  1. Mount `Workspace` in an environment where `window.workstation` is `undefined`.
  2. Initial load fails gracefully to `'UNAVAILABLE'` and displays the retry button.
  3. Click "Retry" or attempt to trigger a change/recover action.
  4. An unhandled `TypeError` crashes the component handler.
* **Minimal Fix**:
  Guard or wrap calls in `request` using optional chaining and reject/return error if missing:
  ```tsx
  const change = (command: Command) =>
    request(() => window.workstation ? window.workstation.change(command) : Promise.resolve({ ok: false, error: 'UNAVAILABLE' }), true);
  ```
  Apply the same pattern to retry and recover button invocations.

---

### Defect 2: Active Tab Invariant Violation when Resetting or Receiving State Changes
* **Severity**: Medium / High (Broken View State & Layout Inconsistency)
* **Evidence**:
  ```tsx
  function openTab(tab:Tab){
    if(space)update({...space.view,tabs:space.view.tabs.includes(tab)?space.view.tabs:[...space.view.tabs,tab],activeTab:tab});
  }
  function closeTab(tab:Tab){
    if(space && space.view.tabs.length>1){
      const tabs=space.view.tabs.filter(t=>t!==tab);
      update({...space.view,tabs,activeTab:space.view.activeTab===tab?tabs[0]:space.view.activeTab});
    }
  }
  ```
  And inside the render tree:
  ```tsx
  <div id="workspace-panel" role="tabpanel" aria-labelledby={`tab-${space.view.activeTab}`} className="workspace-panel">
    <span className="module-icon"><Icon name={space.view.activeTab==='overview'?'workspace':'folder'}/></span>
    <h3>{m[space.view.activeTab]}</h3>
    <p>{space.view.activeTab==='overview'?m.ready:m.noResources}</p>
  </div>
  ```
  When switching workspaces (`change({type: 'open', id})`) or resetting (`change({type: 'reset', id})`), the new `space` may arrive with a view where `space.view.activeTab` is not in `space.view.tabs` (or if external command/reset resets `tabs` to `['overview']` while `activeTab` was `'resources'`). Furthermore, when switching layout to `focus`, the secondary tab button only checks `space.view.layout==='focus' && !space.view.tabs.includes('resources')`. If `tabs` does not contain `activeTab`, the tablist renders tabs that do not match `aria-labelledby`, rendering an orphaned panel tab state with no selected tab button.
* **Reproduction**:
  1. Open a workspace with both tabs open and `activeTab === 'resources'`.
  2. Click "Reset" (`{type: 'reset', id: space.id}`). Backend reset resets `tabs: ['overview']`, but if `activeTab` is not adjusted or persists, or when opening another workspace whose `activeTab` does not match its `tabs`.
  3. UI renders the panel for a tab not present in the tab strip; `aria-labelledby="tab-resources"` references a non-existent DOM ID.
* **Minimal Fix**:
  Derive safe active tab defensively:
  ```tsx
  const activeTab: Tab = (space && space.view.tabs.includes(space.view.activeTab))
    ? space.view.activeTab
    : (space?.view.tabs[0] ?? 'overview');
  ```

---

### Defect 3: Stale `space` Closure in Multiple Concurrent Actions Overwrites View Updates (Silent View State Regression)
* **Severity**: High (Data Loss / Lost User Updates)
* **Evidence**:
  ```tsx
  const space = state?.workspaces.find(w=>w.id===state.lastWorkspaceId);
  // ...
  function update(view:View){if(space)void change({type:'view',id:space.id,view});}
  function openTab(tab:Tab){if(space)update({...space.view,tabs:space.view.tabs.includes(tab)?space.view.tabs:[...space.view.tabs,tab],activeTab:tab});}
  ```
  `space` is captured from component render closure. While `busy` disables controls in the DOM, any sequential or rapid callback triggered before React re-renders with the new `state` from IPC (or chained operations) will capture stale `space.view`. More critically, if IPC returns updated workspace settings or an async load finishes while user interacts, `space.id` and `space.view` sent to `window.workstation.change` overwrite newer state with stale closed-over view layout or tabs.
* **Reproduction**:
  1. Change layout from `standard` to `focus` (`update` fires).
  2. If the user rapidly switches or closes a tab before IPC roundtrip resolves, or if another event resolves, the stale `space.view` snapshot is dispatched in the subsequent IPC payload, reverting layout or losing tabs.
* **Minimal Fix**:
  Ensure state transitions pass current state or compute next view against the latest state ref/functional setter, or ensure pending operations queue sequentially.

---

### Defect 4: Failure to Clear Stale Error and Confirm States on Workspace Switching
* **Severity**: Medium (Faulty UI state / Blocked Actions)
* **Evidence**:
  ```tsx
  const blocked = !state || error==='CORRUPT' || error==='UNSUPPORTED';
  // ...
  {error&&<div className="workspace-error" role="alert">...</div>}
  {confirmRecovery&&<div className="recovery-confirm">...</div>}
  ```
  When an error occurs (such as an ephemeral IPC error from a reset or view update action), `error` is set to `reply.error`. If the user clicks a different workspace button in `.workspace-switcher`:
  ```tsx
  <button className="control" type="button" key={w.id} aria-pressed={w.id===space?.id} disabled={busy} onClick={()=>void change({type:'open',id:w.id})}>{w.name}</button>
  ```
  If `confirmRecovery` was toggled open due to a corrupt notice, or if an action failed, `confirmRecovery` remains `true` even after a successful workspace switch unless `request` succeeds and sets state, but `confirmRecovery` is only reset on successful `recover()`, NOT on switching workspaces, creating a workspace, or resetting.
* **Reproduction**:
  1. Encounter `CORRUPT` error.
  2. Click `m.recover` to reveal the confirmation banner (`confirmRecovery === true`).
  3. Instead of confirming, click another workspace or retry.
  4. `confirmRecovery` remains stuck visible and can trigger destructive recovery on the wrong state context.
* **Minimal Fix**:
  Reset `confirmRecovery` whenever switching workspaces or changing commands:
  ```tsx
  async function request(action:()=>Promise<Reply>,changed=false) {
    setBusy(true);setError('');setSaved(false);setConfirmRecovery(false);
    ...
  ```

---

### Defect 5: Unconditional `onRestore` Triggered on Initialization Failure Causes False Navigation
* **Severity**: Medium (Erroneous Navigation / Inconsistent Host Application State)
* **Evidence**:
  ```tsx
  useEffect(()=>{
   let live=true;
   void (async()=>{try{
    const reply=await window.workstation?.load();if(!live)return;
    if(reply?.ok){setState(reply.state);if(reply.state.lastWorkspaceId)onRestore();}
    else {setError(reply && !reply.ok ? reply.error : 'UNAVAILABLE');onRestore();}
   }catch{if(live){setError('READ_FAILED');onRestore();}}finally{if(live)setBusy(false);}})();
   return ()=>{live=false;};
  },[]);
  ```
  Specification states:
  > *"Other App component mounts Workspace once inside a hidden container to keep state across navigation, onRestore selects workspace page"*
  
  When `load()` succeeds with `lastWorkspaceId`, calling `onRestore()` correctly restores navigation to the workspace page. However, in both error branches (`else` where load is not ok/unavailable, and `catch` where read failed), `onRestore()` is unconditionally executed.
* **Reproduction**:
  1. Mount `App` on another page (e.g., settings or dashboard) while `Workspace` is mounted in the hidden container.
  2. `window.workstation.load()` fails (e.g. backend returns error or is not ready yet).
  3. `onRestore()` is invoked despite failure to load any workspace, forcibly navigating the host application away from the user's active page and selecting the workspace page.
* **Minimal Fix**:
  Only invoke `onRestore()` when a valid previous workspace session actually exists to restore:
  ```tsx
  if (reply?.ok) {
    setState(reply.state);
    if (reply.state.lastWorkspaceId) onRestore();
  } else {
    setError(reply && !reply.ok ? reply.error : 'UNAVAILABLE');
    // Do not call onRestore() on failure
  }
  ```


## Followup default model

conversation 6aebe1e8-7bb1-47af-8eb0-50dd90fb9a02

duration 14.5214572 seconds

# Independent Code Review: Issue 30 (Snapshot `3a617df`)

Based strictly on the supplied sources (`main.cjs`, `preload.cjs`, `workspace-store.cjs`, `Workspace.tsx`, and `index.html`), here is the adjudication of concrete blocking defects and functional limitations remaining in this revision.

---

### 1. Concrete Blocking Defects

1. **Uncaught Asynchronous Exception During Recovery Renaming (`WorkspaceStore.recover` `(electron/workspace-store.cjs#L69-L77)`)**
   - **Mechanism:** In `recover()`, `fs.rename` is executed before validating whether `this.file` actually exists on disk or handling permission/file-locking errors (`EBUSY`, `ENOENT`). 
   - **Impact:** If `this.file` was deleted externally, corrupted in a transient path, or held open by an OS lock (common on Windows during file scans), `fs.rename` throws an unhandled rejection inside the queue. Because `store.recover()` does not wrap `fs.rename` in a `try/catch` and `main.cjs` line 25 maps only recognized error messages (or defaults to `'READ_FAILED'`), `this.blocked` remains set to `'CORRUPT'` and `this.state` remains `null`. The user cannot clear or recover the corrupted state without restarting or manual filesystem intervention.

2. **IPC Origin Verification Incompatibility Under Windows File Paths (`main.cjs:21-22` `(electron/main.cjs#L21-L22)`)**
   - **Mechanism:** The check `event.senderFrame.url !== pathToFileURL(entry).href` enforces exact character equality against Electron’s rendered frame URL. 
   - **Impact:** On Windows, `pathToFileURL` produces case-normalized drive letters (e.g., `file:///C:/...` vs `file:///c:/...`) or trailing slashes, whereas Chromium's internal `mainFrame.url` evaluation after `window.loadFile(entry)` can differ in drive-letter casing or URI normalization. When this mismatch occurs, every IPC call (`load`, `change`, `recover`) is unconditionally denied with `{ ok: false, error: 'DENIED' }`, completely blocking renderer-to-main communication.

3. **Window Close Deadlock via Trapped Cancellation Flow (`main.cjs:53-66` `(electron/main.cjs#L53-L66)`)**
   - **Mechanism:** When a save has failed (`saveFailed === true`), triggering a close shows the dialog. If the user clicks `"Return to workstation"` (`result.response !== 1`), the handler executes `return` directly without resetting `closing` or proceeding.
   - **Impact:** While `finally` sets `closingWindow = false`, subsequent window close events re-trigger the exact same dialog prompt even if the user deliberately wanted to remain in the app to continue editing. More critically, if `dialog.showMessageBox` throws an error, the `.catch()` block executes `saveFailed = true;` without handling or recovering the close intent, leaving the window stuck open.

---

### 2. Concrete UI & State Limitations

1. **Non-Blocking Control State on Save Failures (`Workspace.tsx:41, 46-47` `(src/Workspace.tsx#L41-L47)`)**
   - `blocked` is defined exclusively as `!state || error==='CORRUPT' || error==='UNSUPPORTED'`.
   - When a mutation fails with `SAVE_FAILED` or `LIMIT`, `state` retains its prior snapshot and `blocked` evaluates to `false`. Although `busy` is toggled off in `finally`, form inputs remain enabled while the app state in memory deviates from disk persistence. Attempting new mutations while `saveFailed = true` in main will quietly cause the exit dialog to trigger on close even if subsequent UI operations appear responsive.

2. **`closeTab` State Desynchronization on Single Active Tab (`Workspace.tsx:40` `(src/Workspace.tsx#L40)`)**
   - In `closeTab`, the condition `space.view.tabs.length > 1` prevents closing the last tab; however, if `activeTab` was the closed tab, fallback assigns `tabs[0]`. Because `openTab` and `closeTab` fire fire-and-forget calls to `update(...)` (e.g. `void change(...)`), rapid tab closure triggers racing mutations where intermediate tab indices can conflict with incoming store states.

3. **Orphaned Selection on External Workspace Deletion/Reset**
   - In `validState`, `lastWorkspaceId` must exist in `workspaces`. However, if `store.state` is mutated concurrently or initialized empty, `Workspace.tsx` does not clear stale UI form fields (e.g., `name` input string) upon error, leaving draft inputs visible despite underlying failure.


## Explicit Gemini 3.8 Flash Low final review

Source 3a617df Explicit model gemini-3.8-flash-low effort low CLI 1.4.3

conversation 1612c175-1444-4935-9d7d-4330cda4dde7

duration 11.7469205 seconds

### Independent Follow-up Review: Issue 30 (Commit `3a617df`)

**Verdict**: **No reproducible correctness or security blockers** identified in the supplied sources and test suite. The implementation conforms to the specified constraints.

---

### Detailed Findings & Architectural Trace

#### 1. IPC & Window Boundary Security (`electron/main.cjs`, `electron/preload.cjs`)
- **Sender & URL Validation**: IPC invocations verify `event.sender === mainWindow.webContents`, `event.senderFrame === mainWindow.webContents.mainFrame`, and exact file URL equality against `entry`. This strictly prevents unauthorized iframes, secondary renderers, or foreign origins from triggering store operations.
- **Navigation Lock & Sandboxing**: `will-navigate` is prevented, `setWindowOpenHandler` denies new windows, context isolation is enabled, and node integration is disabled.
- **CSP**: The document restricts scripts and styles to `'self'`, disables connections (`connect-src 'none'`), and blocks embedding object/frame vectors.
- **Preload API**: `window.workstation` is frozen and strictly limits exposure to invoking predefined IPC channels (`load`, `change`, `recover`).

#### 2. Promise Tracing & Error Handling
- **Queue Sequencing**: All operations (`load`, `mutate`, `recover`) chain onto `store.tail` via `this.tail.then(operation); this.tail = result.catch(() => {});`. Rejected promises are captured by the tail catch handler, preventing unhandled promise rejections on the main process while allowing the caller promise to convey failures.
- **IPC Error Wrapping**: Failures thrown from `WorkspaceStore` (`CORRUPT`, `UNSUPPORTED`, `READ_FAILED`, `SAVE_FAILED`, `INVALID`, `LIMIT`, `NOT_READY`) are trapped within the IPC handler try/catch block and normalized to `{ok: false, error: ...}`. Unrecognized exceptions default to `'READ_FAILED'`.
- **Exit Coordination & Dirty State**: In `window.on('close')`, closing awaits `store.tail`. If an unsaved change exists (`saveFailed === true`), a warning dialog prompts the user. If dialog confirmation throws or is cancelled (`cancelId: 0`, response !== 1), window destruction is halted and `saveFailed` remains set to allow subsequent retry without data discard.

#### 3. Storage Invariants & Atomic Persistence (`electron/workspace-store.cjs`)
- **Input Validation**: Strict schema checks enforce `exact` property keys, valid UUID formats, trimmed non-empty names ($\le 60$ chars without control characters), valid tab names (`overview`, `resources`), and workspace capacity limits ($\le 100$).
- **Atomic File Writes**: Mutations use `write-file-atomic` with fsync (`mode: 0o600, fsync: true`) and pre-create directories. On write failure, `this.state` is not updated; in-memory cache and disk remain consistent.
- **Safe Recovery**: `recover()` only proceeds when blocked on `'CORRUPT'`. The corrupted file is renamed to `workspaces-v1.preserved-${randomUUID()}.json` before state initialization, preventing unrecoverable loss of malformed user records. Future versions (`version !== 1`) remain blocked as `'UNSUPPORTED'` and reject `recover()`.

#### 4. UI State Synchronization (`src/Workspace.tsx`)
- **Two-Phase State Commit**: Local component state commits via `setState(reply.state)` strictly upon receiving `{ok: true}`. Failed actions set error banners while preserving loaded state in memory.
- **Recovery & Re-try Flow**: Corrupted states present explicit recovery dialogues requiring user confirmation before triggering `workspaces:recover`.

---

### Non-Blockers & Platform Considerations (Distinguished from Bugs)

1. **`write-file-atomic` Mode on Windows**: POSIX permission `mode: 0o600` has limited effect on Windows NTFS ACLs. This is a known platform limitation, not a software defect.
2. **Crash During Active FS Operations**: An abrupt OS power loss during `fs.rename` in `recover()` could theoretically leave the store in `CORRUPT` or `ENOENT`. On subsequent launch, `ENOENT` defaults to a clean schema, while an existing file triggers re-read/recovery; this is expected behavior for local filesystem storage.

