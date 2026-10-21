# S2-02 独立审查原文

客户端 Antigravity CLI 1.4.3 明确模型 gemini-3.8-flash-low effort low plan 模式 静态源码审查 不代表运行测试或安全认证

## 首轮 c5c9d74

### Independent Read-Only Review (Issue 32 / Snapshot `c5c9d74`)

This review verifies the implementation against all requirements:
1. Local checks must never interrupt desktop: background mode CLI opt-in requiring separate profile, hidden non-focusable windows, and no native dialogs.
2. Main process owns theme persistence (`system`, `light`, `dark`). Old preference preserved on save failure; corrupt records explicitly archived; unsupported versions read-only.
3. Queue serialization via `store.enqueue` with tail settling.

Below are the concrete defects identified from the code.

---

### Defect 1: Unmounted Component State Update on Settings Page Switching
- **Severity**: Medium
- **Location**: `src/App.tsx:33-34` & `src/AppearanceSettings.tsx:9-16`
- **Evidence**:
  In `App.tsx`:
  ```tsx
  {page==='workspace'?null:page==='settings'?<AppearanceSettings/>:...}
  ```
  Unlike `Workspace` which is kept mounted with `<div hidden={page!=='workspace'}>`, `AppearanceSettings` is unmounted when navigating away from the Settings tab.
  In `AppearanceSettings.tsx`:
  ```tsx
  useEffect(()=>{void run(()=>window.workstation!.appearance.load());},[]);
  ```
  `run` performs asynchronous IPC operations without checking whether the component is still mounted before executing `setState`, `setSaved`, `setError`, etc. in `run()`.
- **Minimal Reproduction**:
  1. Navigate to Settings page (`page = 'settings'`). `window.workstation.appearance.load()` begins execution.
  2. Immediately switch to Home (`page = 'home'`) before the async IPC resolves.
  3. React throws an unmounted component memory leak warning / state update error on `AppearanceSettings`.
- **Fix**:
  Track mount state with a ref/cleanup flag inside `useEffect` or inside `AppearanceSettings`:
  ```tsx
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (inFlight.current) return;
      inFlight.current = true; setBusy(true); setError(''); setSaved(false);
      try {
        const reply = await window.workstation!.appearance.load();
        if (!mounted) return;
        if (reply.ok) { setState(reply.state); setConfirm(false); }
        else setError(reply.error);
      } catch {
        if (mounted) setError('UNAVAILABLE');
      } finally {
        if (mounted) { inFlight.current = false; setBusy(false); }
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);
  ```

---

### Defect 2: `AppearanceStore.recover()` Overwrites Existing Archive If Called Multiple Times
- **Severity**: Medium
- **Location**: `electron/appearance-store.cjs:38` & `electron/appearance-store.cjs:40`
- **Evidence**:
  In `recover()`:
  ```javascript
  await fs.rename(this.file,path.join(path.dirname(this.file),`appearance-v1.preserved-${randomUUID()}.json`));
  this.value={version:1,theme:'system'};this.blocked=null;
  try {return await this.change({theme:'system'});} catch(error) {this.blocked='READ_FAILED';throw error;}
  ```
  If `rename` succeeds and then `change({theme:'system'})` fails (e.g. disk write failure), `this.blocked` is set to `'READ_FAILED'` instead of preserving the record's recoverable state. Furthermore, if `this.file` was renamed, but `change()` fails, `this.file` does not exist on disk anymore. If user subsequently clicks retry (`load()`), `ENOENT` triggers line 23:
  ```javascript
  if (error.code==='ENOENT') {this.value={version:1,theme:'system'};this.blocked=null;}
  ```
  which clears `blocked` and falsely reports success without a file written to disk.
- **Minimal Reproduction**:
  1. Provide a corrupted `appearance-v1.json`.
  2. Call `recover()` with a write failure mocked on `this.writer`.
  3. `recover()` fails with `SAVE_FAILED` and sets `blocked = 'READ_FAILED'`.
  4. Call `load()`; since the file was moved, `stat` throws `ENOENT`, unblocking the store even though write failed, leading to inconsistency.
- **Fix**:
  Ensure recovery rolls back or retains `this.blocked = 'CORRUPT'` or explicitly writes before unlinking/renaming:
  ```javascript
  async recover() {
    if (this.blocked !== 'CORRUPT') fail('INVALID');
    const archivePath = path.join(path.dirname(this.file), `appearance-v1.preserved-${randomUUID()}.json`);
    await fs.copyFile(this.file, archivePath);
    try {
      this.blocked = null;
      this.value = {version: 1, theme: 'system'};
      const result = await this.change({theme: 'system'});
      await fs.unlink(this.file).catch(() => {});
      return result;
    } catch (error) {
      this.blocked = 'CORRUPT';
      throw error;
    }
  }
  ```

---

### Defect 3: Second Instance Switch Evaluation When Primary Window is Hidden in Background Mode
- **Severity**: Low
- **Location**: `electron/main.cjs:21`
- **Evidence**:
  ```javascript
  app.on('second-instance', () => { if (!background && mainWindow && !mainWindow.isDestroyed()) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  ```
  The single instance lock in line 19 (`app.requestSingleInstanceLock()`) applies globally across the OS user session unless separate profile dirs are set. When `background` is false (normal desktop app), but a secondary process attempts to launch with `--workstation-background`, `second-instance` on the primary instance executes `if (!background ...)`, which causes the existing primary desktop window to restore and focus unexpectedly when background automated runs are invoked without isolation flags.
- **Minimal Reproduction**:
  1. Launch regular app on desktop (no `--workstation-background`).
  2. Launch a background task without `--user-data-dir` (or overlapping default user profile).
  3. The secondary process triggers `second-instance` in the primary process, stealing focus and restoring the window.
- **Fix**:
  Check command line switches passed in the `second-instance` callback:
  ```javascript
  app.on('second-instance', (event, commandLine) => {
    if (commandLine.includes('--workstation-background')) return;
    if (!background && mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  ```

---

### Defect 4: `ready-to-show` Window Race Condition on Fast App Ready
- **Severity**: Low
- **Location**: `electron/main.cjs:66` & `electron/main.cjs:87`
- **Evidence**:
  ```javascript
  window.once('ready-to-show', () => {if(!background)window.show();});
  ...
  void window.loadFile(entry);
  ```
  If `loadFile` fails or if the renderer fails to mount the entry before `ready-to-show` fires (or on platforms where `ready-to-show` can emit before listener attachment during rapid startup), `window.show()` may never be invoked for non-background launches, leaving the window permanently hidden.
- **Fix**:
  Ensure a fallback or check `window.isVisible()` after load completion.


## 修订复核 d82f6d4

已完成对 Issue 32 快照 `d82f6d4` 提供的源代码的独立只读审查（Read-Only Review），未修改任何工作区代码或运行任何命令。

详细审查报告已生成至项目 Artifact：review_issue_32_snapshot_d82f6d4.md。

### 审查核心结论概要

* **总体结论**：**无阻塞性缺陷（NO BLOCKER）**。
* **隔离与桌面静默验证**：完全符合规范。后台模式（`--workstation-background`）配合 `--user-data-dir` 执行，窗口设置 `focusable: !background`, `skipTaskbar: background`, `show: false`, `backgroundThrottling: !background`，并在主进程内覆写 `dialog.showMessageBox` 为纯静默返回，`second-instance` 事件也阻断了抢焦点恢复。
* **信任边界（IPC 安全）**：完全符合规范。主进程所有通道通过 `event.sender === mainWindow.webContents`、`event.senderFrame === mainWindow.webContents.mainFrame` 和完整 URL 校验，杜绝子帧、外部重定向或伪造调用。
* **数据持久化与保护**：
  * 主题在窗口首次展示前完成加载并同步给 `nativeTheme.themeSource`。
  * 写入失败（`SAVE_FAILED`）时不更新内存状态且退出拦截。
  * 损坏文件（`CORRUPT`）需显式通过 `recover()` 生成 `COPYFILE_EXCL` 随机备份后原子重置。
  * 针对非当前主版本的安全整数（`UNSUPPORTED`），保持严格只读并拒绝恢复，保护未来版本不被覆写。
* **非阻塞性改进点（Low / Medium）**：
  * **appearance-store.cjs#L44-L48**：在 `recover()` 流程中，若 `copyFile` 成功后后续默认写操作（`change`）抛出异常，磁盘中会残留未完成恢复的备份文件；如用户在持续写保护或满盘状态下反复点击恢复，会产生多个冗余备份。该问题不导致数据丢失，仅属于清理一致性建议。


## 复核详细 Artifact

# 独立审查报告：Issue 32 (快照 d82f6d4)

**审查类型**：独立只读审查（Read-Only Review）  
**被审对象**：Issue 32 快照 `d82f6d4`（提供的源代码片段）  
**技术栈与环境假设**：React 19 / Electron 44 / Windows 桌面 / 本地优先  
**审查结论**：**无致命阻塞性缺陷（NO BLOCKER）**。核心需求均已落实，但发现 1 项中低风险鲁棒性缺陷与 2 项低风险设计注意事项。

---

## 1. 核心需求审查矩阵

| 审查项 | 需求规格 | 审查结论 | 证据与实现分析 |
| :--- | :--- | :---: | :--- |
| **后台隐藏测试** | 隐藏、隔离、不抢焦点、不弹窗、不打断用户桌面 | **合规** | `background = app.commandLine.hasSwitch('workstation-background')` 时，强制要求 `--user-data-dir`；`focusable: !background`, `skipTaskbar: background`, `show: false`, `backgroundThrottling: !background`；重写 `dialog.showMessageBox` 为异步直接返回 0；`second-instance` 阻断唤醒聚焦。 |
| **可信渲染帧 IPC** | 仅信任主窗口顶级帧 (Main Frame) IPC 通信 | **合规** | `ipcMain.handle` 严格校验 `event.sender === mainWindow.webContents`、`event.senderFrame === mainWindow.webContents.mainFrame` 以及 `event.senderFrame.url === pathToFileURL(entry).href`，未授权 frame 或非法 URL 统一返回 `{ok:false, error:'DENIED'}`。 |
| **首显前主题持久化** | 真实主题持久化，窗口首次展现前加载并应用 | **合规** | 在 `app.whenReady()` 中，窗口创建前执行 `(await store.enqueue(()=>appearance.load())).theme` 设置 `nativeTheme.themeSource`；创建窗口时 `show: false` 且配置与当前暗浅色一致的 `backgroundColor`；`ready-to-show` 时仅在非 background 模式下显示窗口。 |
| **失败写保留旧数据** | 写入失败不损坏或丢弃既有配置数据 | **合规** | `AppearanceStore.change` 在写入前不修改内存 `this.value`；`writeAtomic` 失败直接抛出 `SAVE_FAILED`，原文件保持不变；退出时如果存在 `failedSaves`，弹出阻止退出/确认警告。 |
| **损坏记录显式备份** | 损坏文件先完整备份，再原子替换新默认值 | **合规** | `AppearanceStore.recover` 仅在 `this.blocked === 'CORRUPT'` 时执行；通过 `fs.copyFile` 带 `COPYFILE_EXCL` 备份为 `appearance-v1.preserved-${randomUUID()}.json`，随后通过 `change({theme:'system'})` 写入默认值；若写入失败回滚状态。 |
| **保护未来版本文件** | 未来版本标记为 UNSUPPORTED，保持只读禁篡改 | **合规** | 当 `value.version !== 1` 且为合法非负安全整数时抛出 `UNSUPPORTED`，`recover()` 显式阻止并抛出 `INVALID`，防止意外覆盖高版本结构。 |
| **Fluent 移植与无障碍** | 容器查询、自适应布局、150ms 动效与减弱动画支持 | **合规** | CSS 采用 `@container (min-width: 640px)` 响应断点；无溢出截断；`--motion-fast` 映射 0.15s；`prefers-reduced-motion: reduce` 下重置为 `none` / `0s`。 |

---

## 2. 缺陷与风险分析清单

### 缺陷 1 (中/低风险)：`AppearanceStore.recover()` 恢复写入失败时破坏了备份文件状态一致性
- **严重等级**：Medium / Low（鲁棒性 / 容错缺陷）
- **位置**：`electron/appearance-store.cjs` 第 44–48 行
- **复现路径**：
  1. `appearance-v1.json` 发生损坏（例如损坏的 JSON 内容），`load()` 失败并将状态置为 `this.blocked = 'CORRUPT'`。
  2. 用户触发 `recover()`。
  3. `fs.copyFile(..., 'appearance-v1.preserved-<uuid>.json')` 成功执行，已生成备份文件。
  4. 紧接着调用 `this.change({theme:'system'})`。假如此处磁盘满或由于文件权限抛出 `SAVE_FAILED`。
  5. 此时进入 `catch(error)`：`this.value = null; this.blocked = 'CORRUPT'; throw error;`。
  6. **问题**：虽然内存状态回滚并允许重试恢复，但在文件系统中已遗留一个未完成恢复的备份文件；若用户连续点击恢复重试多次且反复写失败，将在用户数据目录中生成大量重复命名的备份文件残留。
- **改进建议**：
  若后续 `this.change()` 失败，应在 catch 分支中考虑清理本次未完成事务生成的备份文件（`await fs.unlink(preservedFile).catch(()=>{})`），或记录最后一次备份路径避免重复堆积。
- **是否构成阻塞**：**否 (Not a blocker)**。原有损坏文件未发生数据丢失，且异常被安全捕获。

---

### 缺陷 2 (低风险)：`appearance:recover` IPC 仅清除了 `failedSaves` 中的 `'appearance'`，但未联动更新 `nativeTheme.themeSource`
- **严重等级**：Low（UI / 主题状态同步轻微差异）
- **位置**：`electron/main.cjs` 第 34–37 行
  ```javascript
  const state = await operation(command);
  if (channel === 'workspaces:change' || channel === 'appearance:change' || channel === 'appearance:recover') failedSaves.delete(area);
  if (area==='appearance') nativeTheme.themeSource=state.theme;
  ```
- **复现路径**：
  1. 当前主题为 `dark`。由于外部异常或损坏恢复，调用 `appearance:recover`。
  2. `store.enqueue(() => appearance.recover())` 成功执行并返回 `{version:1, theme:'system'}`。
  3. `area === 'appearance'` 条件满足，`nativeTheme.themeSource = 'system'` 虽被执行；但注意：在 `channel === 'appearance:load'` 时，未重新对齐 `nativeTheme.themeSource`。
  4. 只要是通过正常 `appearance:change` 或 `appearance:recover` 触发，该逻辑均能正确对齐；若渲染进程在初次挂载后单独触发 `load()`，主进程未主动同步 `nativeTheme`（依赖首次启动时的设定）。
- **是否构成阻塞**：**否 (Not a blocker)**。启动时已同步，运行中变动均通过 `change` 或 `recover`，行为一致。

---

### 缺陷 3 (低风险)：`failedSaves` 处理与窗口关闭流程中的极值竞态
- **严重等级**：Low
- **位置**：`electron/main.cjs` 第 61–72 行
- **复现路径**：
  1. 当用户发起保存失败，`failedSaves.add('appearance')`。
  2. 用户关闭窗口，触发 `window.on('close')`，等待 `store.tail`。
  3. 弹出 `dialog.showMessageBox` 警告。若用户选择 `返回工作站`（`response !== 1`），代码直接 `return` 且 `finally` 将 `closingWindow = false`。
  4. 若在 `closingWindow` 期间前端有重试或新的 IPC 请求，会被直接拦截并返回 `{ok:false, error:'CLOSING'}`。
- **说明**：此为预期的防抖与单飞退出保护设计，不造成死锁。

---

## 3. 架构与安全审计总结

1. **信任边界**：
   - 渲染进程沙箱开启、无 Node 集成、上下文隔离，所有持久化操作通过强隔离的主进程 IPC。
   - IPC 仅限 `entry` 文件对应的顶级主帧访问，防御了子 iframe、注入页与伪造协议。
2. **数据完整性**：
   - 写入操作采用原子写库（`write-file-atomic`），保证 `fsync: true` 与 `0o600` 权限控制。
   - 文件体积限制（4096 字节）防内存溢出与拒绝服务。
   - 解析损坏记录时严格只读，未来版本（version > 1）禁止篡改与恢复，防止跨版本降级覆盖。
3. **测试安全性**：
   - 测试启动全面接入 `--workstation-background` 标识，禁用焦点抢占与原生弹窗交互，符合用户无干扰测试原则。

**最终审核裁决**：**通过（No Blocker）**。Issue 32 snapshot `d82f6d4` 符合全部既定安全性与设计约束。


## 后台截图专项复核 0ee4f85

# Code Review: Test-Only Changes (`0ee4f85`)

**Verdict:** **NO BLOCKER** (with noted design limits and prerequisites)

---

### Detailed Findings

#### 1. Hidden Window Stays Hidden
- **Evaluation:** Pass.
  - In `tests/helpers/background.cjs`: `webContents.capturePage(undefined, { stayHidden: true, stayAwake: true })` specifically uses Electron's native `stayHidden: true` option. This prevents offscreen/hidden rendering from causing the window to be shown or focused.
  - Assertions in `tests/background-window.test.cjs` explicitly verify window states remain `{ visible: false, focused: false, focusable: false }` both during and after capture operations and dialog invocations.
  - Windows platform note: `stayHidden: true` combined with `stayAwake: true` wakes the compositor/DWM pipeline without triggering `ShowWindow(SW_SHOWNA)` or stealing focus.

#### 2. Latest-Frame Fencing
- **Evaluation:** Pass (for current Chromium rendering pipeline).
  - Double `requestAnimationFrame`:
    ```javascript
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    ```
    This ensures that DOM/style modifications (such as mutating `#capture-probe`) are committed to a style recalculation, layout, and queued for the subsequent compositor commit before invoking `capturePage`.
  - Font readiness: `await page.evaluate(() => document.fonts.ready.then(() => undefined));` prevents capturing layout-shifted fallback text before web fonts finish loading.
  - Pixel validation: The test validates BGRA/RGBA byte ordering directly using `nativeImage.createFromPath(file).getBitmap()` across color transitions (`#123456` [0x56, 0x34, 0x12, 0xff] and `#abcdef` [0xef, 0xcd, 0xab, 0xff]), confirming that stale frames from prior ticks are not retained.

#### 3. Error Reporting & Robustness
- **Evaluation:** Pass.
  - `if (image.isEmpty()) throw Error('Empty background screenshot');` guards against capturePage returning zero-dimension or unallocated native image buffers before writing to disk.
  - Clean error isolation in `app.close()`:
    ```javascript
    await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1 }); }).catch(() => {});
    ```
    Guards test cleanup so that unhandled exit confirmations do not deadlock CI runners or display native dialogs.
  - Clean temp profile cleanup with retries in `finally`: `maxRetries: 5, retryDelay: 100` accommodates Windows filesystem file-lock latencies on temp directory removal.

---

### Inherent Limits & Assumptions

1. **Window Indexing Assumption:**
   `BrowserWindow.getAllWindows()[0]` assumes the targeted window is the primary and only window created by workstation launch. If secondary background workers or auxiliary windows are introduced in future revisions, index `[0]` may select an unexpected window instance.
2. **Double RAF vs. Compositor Throttle:**
   While `requestAnimationFrame` double-fencing is reliable for Chromium render threads, under extreme CPU/GPU starvation on Windows CI VMs, compositor commits can occasionally lag behind the render thread frame callback. Electron's `stayAwake: true` mitigates this by keeping compositor paint ticking.
3. **Electron Version Compatibility:**
   Options `{ stayHidden: true, stayAwake: true }` in `webContents.capturePage` are supported in modern Electron (including Electron 44).

