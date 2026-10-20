# Windows 桌面 Shell 技术原型

关联：[Issue #10](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/10)。本原型只验证桌面窗口、固定导航与诚实空状态。Electron + React + TypeScript 仍是候选组合，不是最终架构定案。

## 本机运行

前提：Windows 10/11、Node.js 22.12+ 与 npm。仓库根目录执行：

```powershell
npm ci
npm start
```

首次安装会从 Electron 官方发布源下载运行文件；若网络代理阻止下载，需按本机正常网络配置设置 `HTTPS_PROXY`、`HTTP_PROXY` 和 `ELECTRON_GET_USE_PROXY=true` 后重新运行 `node node_modules/electron/install.js`。不要把代理凭据写入仓库。

`npm start` 先做类型检查与静态构建，再启动真实 Electron 窗口；运行后的界面从本地 `file://` 加载，不依赖登录或云服务。关闭唯一窗口后桌面进程退出。

## 本机检查与便携目录

```powershell
npm test
npm run package:win
```

`npm test` 构建并用 Playwright 驱动真实 Electron 窗口，检查四个导航入口、鼠标和键盘切换、当前页标记、渲染页无法直接使用 Node 全局对象，以及页面没有 HTTP 请求。`npm run package:win` 在仓库同级的 `portable/ModularWorkstation-win32-x64/` 生成便携目录；双击其中的 `ModularWorkstation.exe` 可运行。便携目录整体移动，不能只复制 exe。

## 当前边界

- 工作区、插件、设置目前仅显示明确的未实现空状态；没有文件访问、安装插件、云账号或业务数据。
- 自动按系统语言选择中文/英文文案，按系统深浅主题显示；主题切换和工作区布局持久化尚未实现。
- Electron 渲染进程启用 sandbox、context isolation、禁用 Node integration；CSP 禁止远程连接，窗口拒绝新窗口与页面跳转。这些设置不等于插件安全沙盒完成验证。
- 便携目录是无签名技术样机，不是 Windows 安装包或公开发布版本。Windows 10 兼容性、启动性能/内存、打包发布、Tauri 对照、动态插件隔离均未验收。

## 回滚

原型在独立分支和 PR 中交付；撤销该 PR 的合并提交即可从主线移除新增代码和文档。便携目录位于仓库外，不属于 Git 版本记录，可直接删除。

## 2026-10-20 · 已确认主题的便携候选

当前深浅主题与四页实际映射、截图和测试见 [实施记录](SHELL_THEME_IMPLEMENTATION.md)。主题继续跟随系统；设置只读显示当前模式，手动主题和偏好保存尚未实现。首页模块卡片和“查看工作区”仅切换已有页面，创建/安装等操作禁用并说明原因。

本机新候选位于项目工作目录上两级的 `outputs/theme-candidate-20261020/ModularWorkstation-win32-x64/`。保留整个文件夹，双击 `ModularWorkstation.exe`；切换 Windows 深浅主题，检查四页、Tab/Enter、最小窗口和关闭退出。不要把单个 EXE 移出目录。旧便携包未覆盖，本候选未经最终产品验收。

重新打包可指定新的输出目录，避免覆盖旧包：

```powershell
npm run build
npx --no-install electron-packager . ModularWorkstation --platform=win32 --arch=x64 --out=../../outputs/my-new-candidate --prune=true --ignore=^/\.git --ignore=^/tests --ignore=^/docs
node scripts/verify-package.cjs ../../outputs/my-new-candidate/ModularWorkstation-win32-x64
```

验证脚本比较包内构建内容与本地 dist、启动实际 EXE、检查身份/隔离参数/双主题导航和正常关闭；报告写入 `docs/design/previews/runtime/package-validation.json`。这不代替签名、安装升级或发布验证。
